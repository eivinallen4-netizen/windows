import { NextResponse } from "next/server";
import { createSessionToken, verifyPin } from "@/lib/auth";
import { findUserByEmail, readUsers } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

function isValidPin(value: string) {
  return /^\d{4,6}$/.test(value);
}

function isSecureRequest(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }
  return new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; pin?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const pin = body.pin?.trim() ?? "";

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    if (!isValidPin(pin)) {
      return NextResponse.json({ error: "PIN must be 4-6 digits." }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPin = process.env.ADMIN_PIN?.trim();
    const adminName = process.env.ADMIN_NAME?.trim() || "Admin";

    let userName = "";
    let role: "admin" | "rep" | "tech" = "rep";

    if (adminEmail && adminPin && email === adminEmail && pin === adminPin) {
      userName = adminName;
      role = "admin";
    } else {
      const users = await readUsers();
      const user = findUserByEmail(users, email);
      if (!user || !user.pin_hash || !user.pin_salt) {
        return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
      }
      const ok = await verifyPin(pin, user.pin_salt, user.pin_hash);
      if (!ok) {
        return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
      }
      userName = user.name ?? "";
      role = user.role ?? (user.is_admin ? "admin" : "rep");
    }

    const token = await createSessionToken({
      email,
      name: userName || undefined,
      role,
      is_admin: role === "admin",
    });

    const response = NextResponse.json({
      user: {
        email,
        name: userName || undefined,
        role,
        is_admin: role === "admin",
      },
    });
    response.cookies.set({
      name: "pb_session",
      value: token,
      httpOnly: true,
      secure: isSecureRequest(request),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
