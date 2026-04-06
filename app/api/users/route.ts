import { NextResponse } from "next/server";
import { getSessionFromRequest, hashPin } from "@/lib/auth";
import { findUserByEmail, normalizeUserRole, readUsers, writeUsers, type UserRecord, type UserRole } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

function isValidPin(value: string) {
  return /^\d{4,6}$/.test(value);
}

async function requireAdmin(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "admin") {
    return null;
  }
  return session;
}

function isValidRole(value: unknown): value is UserRole {
  return value === "admin" || value === "rep" || value === "tech";
}

function toSafeUser(user: UserRecord) {
  return {
    email: user.email,
    name: user.name,
    role: normalizeUserRole(user),
    is_admin: user.is_admin,
    created_at: user.created_at,
  };
}

export async function GET(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.toLowerCase();
    const all = searchParams.get("all") === "true";

    const users = await readUsers();
    if (!email || all) {
      const safe = users.map(toSafeUser);
      return NextResponse.json({ users: safe });
    }

    const user = users.find((entry) => entry.email.toLowerCase() === email);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ user: toSafeUser(user) });
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
      email?: string;
      name?: string;
      pin?: string;
      is_admin?: boolean;
      role?: UserRole;
    };
    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    if (!body.pin || !isValidPin(body.pin)) {
      return NextResponse.json({ error: "PIN must be 4-6 digits." }, { status: 400 });
    }
    if (body.role && !isValidRole(body.role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const users = await readUsers();
    if (findUserByEmail(users, body.email)) {
      return NextResponse.json({ error: "User already exists." }, { status: 409 });
    }

    const { salt, hash } = await hashPin(body.pin);
    const role: UserRole = body.role ?? (body.is_admin ? "admin" : "rep");
    const record: UserRecord = {
      email: body.email.trim().toLowerCase(),
      name: body.name?.trim() || undefined,
      role,
      is_admin: role === "admin",
      pin_hash: hash,
      pin_salt: salt,
      created_at: new Date().toISOString(),
    };

    await writeUsers([record, ...users]);
    return NextResponse.json({ user: toSafeUser(record) });
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
      email?: string;
      name?: string;
      pin?: string;
      is_admin?: boolean;
      role?: UserRole;
    };
    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    if (body.role && !isValidRole(body.role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const users = await readUsers();
    const user = findUserByEmail(users, body.email);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (body.name !== undefined) {
      user.name = body.name.trim() || undefined;
    }
    if (body.role) {
      user.role = body.role;
      user.is_admin = body.role === "admin";
    } else if (body.is_admin !== undefined) {
      user.is_admin = Boolean(body.is_admin);
      user.role = user.is_admin ? "admin" : user.role ?? "rep";
    }
    if (body.pin) {
      if (!isValidPin(body.pin)) {
        return NextResponse.json({ error: "PIN must be 4-6 digits." }, { status: 400 });
      }
      const { salt, hash } = await hashPin(body.pin);
      user.pin_salt = salt;
      user.pin_hash = hash;
    }

    await writeUsers([...users]);
    return NextResponse.json({ user: toSafeUser(user) });
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
    const email = searchParams.get("email")?.toLowerCase();
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const users = await readUsers();
    const nextUsers = users.filter((entry) => entry.email.toLowerCase() !== email);
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
