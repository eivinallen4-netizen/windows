import { NextResponse } from "next/server";
import { getSessionFromRequest, hashPin } from "@/lib/auth";
import { getJobs } from "@/lib/jobs";
import { readQuotes } from "@/lib/quotes";
import { getReviews } from "@/lib/reviews";
import { readTransactions } from "@/lib/transactions";
import {
  createInviteToken,
  findUserById,
  getUserInviteStatus,
  hashInviteToken,
  normalizeUserRole,
  readUsers,
  writeUsers,
  type UserInviteStatus,
  type UserRecord,
  type UserRole,
} from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVITE_TTL_MS = 1000 * 60 * 60 * 72;

function isValidPin(value: string) {
  return /^\d{4,6}$/.test(value);
}

function isValidRole(value: unknown): value is UserRole {
  return value === "admin" || value === "rep" || value === "tech";
}

function isValidBirthday(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function requireAdmin(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "admin") {
    return null;
  }
  return session;
}

function getInviteLink(request: Request, token: string) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const requestOrigin = new URL(request.url).origin;

  let baseUrl = requestOrigin;

  if (forwardedHost) {
    baseUrl = `${forwardedProto === "http" ? "http" : "https"}://${forwardedHost}`;
  } else {
    const envUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
    const envLooksLocal =
      !envUrl ||
      !/^https?:\/\//.test(envUrl) ||
      envUrl.includes("localhost") ||
      envUrl.includes("127.0.0.1");

    if (!envLooksLocal) {
      baseUrl = envUrl;
    }
  }

  return `${baseUrl.replace(/\/$/, "")}/setup/${encodeURIComponent(token)}`;
}

function toSafeUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: normalizeUserRole(user),
    is_admin: user.is_admin,
    phone: user.phone,
    birthday: user.birthday,
    created_at: user.created_at,
    profile_completed_at: user.profile_completed_at,
    last_signed_in_at: user.last_signed_in_at,
    invite_created_at: user.invite_created_at,
    invite_expires_at: user.invite_expires_at,
    invite_used_at: user.invite_used_at,
    invite_status: getUserInviteStatus(user) as UserInviteStatus,
  };
}

async function buildUserDetail(user: UserRecord) {
  const [quotes, jobs, transactions, reviews] = await Promise.all([
    readQuotes(),
    getJobs(),
    readTransactions(),
    getReviews(),
  ]);

  if (normalizeUserRole(user) === "rep" && user.email) {
    return {
      quoteCount: quotes.filter((quote) => quote.rep?.email === user.email).length,
      jobsSold: jobs.filter((job) => job.rep?.email === user.email).length,
      authorizedRevenue: transactions
        .filter((transaction) => transaction.rep?.email === user.email && transaction.payment_status === "authorized")
        .reduce((sum, transaction) => sum + Number(transaction.amount_total || 0), 0),
      capturedRevenue: transactions
        .filter((transaction) => transaction.rep?.email === user.email && transaction.payment_complete)
        .reduce((sum, transaction) => sum + Number(transaction.amount_total || 0), 0),
    };
  }

  if (normalizeUserRole(user) === "tech" && user.email) {
    const assignedJobs = jobs.filter((job) => job.assigned_tech_email === user.email);
    return {
      assignedJobs: assignedJobs.length,
      completedJobs: assignedJobs.filter((job) => Boolean(job.completed_at)).length,
      reviewCount: reviews.filter((review) => review.tech_email === user.email).length,
    };
  }

  return {};
}

async function issueInvite(user: UserRecord) {
  const token = createInviteToken();
  const now = new Date();
  user.invite_token_hash = await hashInviteToken(token);
  user.invite_created_at = now.toISOString();
  user.invite_expires_at = new Date(now.getTime() + INVITE_TTL_MS).toISOString();
  user.invite_used_at = undefined;
  return token;
}

export async function GET(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    const id = searchParams.get("id");

    const users = await readUsers();
    if (all || !id) {
      return NextResponse.json({ users: users.map(toSafeUser) });
    }

    const user = findUserById(users, id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      user: toSafeUser(user),
      activity: await buildUserDetail(user),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: string;
      role?: UserRole;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!body.role || !isValidRole(body.role)) {
      return NextResponse.json({ error: "Valid role is required." }, { status: 400 });
    }

    const users = await readUsers();
    const record: UserRecord = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      role: body.role,
      is_admin: body.role === "admin",
      created_at: new Date().toISOString(),
    };

    const token = await issueInvite(record);
    await writeUsers([record, ...users]);

    return NextResponse.json({
      user: toSafeUser(record),
      inviteLink: getInviteLink(request, token),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to create user." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as {
      id?: string;
      name?: string;
      role?: UserRole;
      phone?: string;
      birthday?: string;
      pin?: string;
      action?: "regenerate_invite";
    };
    if (!body.id) {
      return NextResponse.json({ error: "User id is required." }, { status: 400 });
    }
    if (body.role && !isValidRole(body.role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const users = await readUsers();
    const user = findUserById(users, body.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    let inviteLink: string | undefined;

    if (body.name !== undefined) {
      user.name = body.name.trim() || undefined;
    }
    if (body.role) {
      user.role = body.role;
      user.is_admin = body.role === "admin";
    }
    if (body.phone !== undefined) {
      user.phone = body.phone.trim() || undefined;
    }
    if (body.birthday !== undefined) {
      const birthday = body.birthday.trim();
      if (birthday && !isValidBirthday(birthday)) {
        return NextResponse.json({ error: "Birthday must be YYYY-MM-DD." }, { status: 400 });
      }
      user.birthday = birthday || undefined;
    }
    if (body.pin) {
      if (!isValidPin(body.pin)) {
        return NextResponse.json({ error: "PIN must be 4-6 digits." }, { status: 400 });
      }
      const { salt, hash } = await hashPin(body.pin);
      user.pin_salt = salt;
      user.pin_hash = hash;
    }
    if (body.action === "regenerate_invite") {
      const token = await issueInvite(user);
      inviteLink = getInviteLink(request, token);
    }

    await writeUsers(users);

    return NextResponse.json({
      user: toSafeUser(user),
      inviteLink,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update user." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "User id is required." }, { status: 400 });
    }

    const users = await readUsers();
    const nextUsers = users.filter((entry) => entry.id !== id);
    if (nextUsers.length === users.length) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await writeUsers(nextUsers);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to delete user." }, { status: 500 });
  }
}
