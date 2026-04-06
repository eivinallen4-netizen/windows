import { NextResponse } from "next/server";
import { getSessionFromRequest, hashPin } from "@/lib/auth";
import { findUserByEmail, findUserById, readUsers, writeUsers } from "@/lib/users";

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

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.userId === "env-admin") {
    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
        phone: session.phone,
        birthday: session.birthday,
        profile_completed_at: session.profile_completed_at,
        is_admin: session.is_admin,
      },
    });
  }

  const users = await readUsers();
  const user = findUserById(users, session.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
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
}

export async function PATCH(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (session.userId === "env-admin") {
    return NextResponse.json({ error: "Environment-managed admin cannot be edited here." }, { status: 400 });
  }

  const body = (await request.json()) as {
    email?: string;
    phone?: string;
    birthday?: string;
    pin?: string;
  };

  const users = await readUsers();
  const user = findUserById(users, session.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (body.email !== undefined) {
    const nextEmail = body.email.trim().toLowerCase();
    if (!isValidEmail(nextEmail)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    const existing = findUserByEmail(users, nextEmail);
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }
    user.email = nextEmail;
  }

  if (body.phone !== undefined) {
    user.phone = body.phone.trim() || undefined;
  }
  if (body.birthday !== undefined) {
    const birthday = body.birthday.trim();
    if (!isValidBirthday(birthday)) {
      return NextResponse.json({ error: "Birthday must be YYYY-MM-DD." }, { status: 400 });
    }
    user.birthday = birthday;
  }
  if (body.pin) {
    if (!isValidPin(body.pin)) {
      return NextResponse.json({ error: "PIN must be 4-6 digits." }, { status: 400 });
    }
    const { salt, hash } = await hashPin(body.pin);
    user.pin_salt = salt;
    user.pin_hash = hash;
  }

  await writeUsers(users);

  return NextResponse.json({
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
}
