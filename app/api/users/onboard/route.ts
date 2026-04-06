import { NextResponse } from "next/server";
import { createSessionToken, hashPin } from "@/lib/auth";
import { findUserByEmail, findUserByInviteToken, getUserInviteStatus, readUsers, writeUsers } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

function isValidPin(value: string) {
  return /^\d{4,6}$/.test(value);
}

function isValidBirthday(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isSecureRequest(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }
  return new URL(request.url).protocol === "https:";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim();
    if (!token) {
      return NextResponse.json({ error: "Invite token is required." }, { status: 400 });
    }

    const users = await readUsers();
    const user = await findUserByInviteToken(users, token);
    if (!user) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }
    if (user.invite_used_at || getUserInviteStatus(user) === "expired") {
      return NextResponse.json({ error: "Invite is no longer valid." }, { status: 400 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        invite_expires_at: user.invite_expires_at,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to validate invite." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      email?: string;
      birthday?: string;
      phone?: string;
      pin?: string;
    };

    const token = body.token?.trim();
    const email = body.email?.trim().toLowerCase();
    const birthday = body.birthday?.trim();
    const phone = body.phone?.trim();
    const pin = body.pin?.trim();

    if (!token) {
      return NextResponse.json({ error: "Invite token is required." }, { status: 400 });
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    if (!birthday || !isValidBirthday(birthday)) {
      return NextResponse.json({ error: "Birthday must be YYYY-MM-DD." }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Phone is required." }, { status: 400 });
    }
    if (!pin || !isValidPin(pin)) {
      return NextResponse.json({ error: "PIN must be 4-6 digits." }, { status: 400 });
    }

    const users = await readUsers();
    const user = await findUserByInviteToken(users, token);
    if (!user) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }
    if (user.invite_used_at || getUserInviteStatus(user) === "expired") {
      return NextResponse.json({ error: "Invite is no longer valid." }, { status: 400 });
    }
    const existing = findUserByEmail(users, email);
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    const { salt, hash } = await hashPin(pin);
    const now = new Date().toISOString();

    user.email = email;
    user.birthday = birthday;
    user.phone = phone;
    user.pin_salt = salt;
    user.pin_hash = hash;
    user.profile_completed_at = now;
    user.invite_used_at = now;
    user.invite_token_hash = undefined;

    await writeUsers(users);

    const sessionToken = await createSessionToken({
      userId: user.id,
      email,
      name: user.name,
      role: user.role ?? (user.is_admin ? "admin" : "rep"),
      phone: user.phone,
      birthday: user.birthday,
      profile_completed_at: user.profile_completed_at,
      is_admin: user.is_admin,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        birthday: user.birthday,
        profile_completed_at: user.profile_completed_at,
        is_admin: user.is_admin,
      },
    });
    response.cookies.set({
      name: "pb_session",
      value: sessionToken,
      httpOnly: true,
      secure: isSecureRequest(request),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to complete setup." }, { status: 500 });
  }
}
