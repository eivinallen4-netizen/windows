import { NextResponse } from "next/server";
import { getRoleOverrideCookieName, getSessionFromRequest, type AppAuthRole } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSecureRequest(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }
  return new URL(request.url).protocol === "https:";
}

function isValidRole(value: string | undefined): value is AppAuthRole {
  return value === "admin" || value === "rep" || value === "tech";
}

function clearOverrideCookie(response: NextResponse, request: Request) {
  response.cookies.set({
    name: getRoleOverrideCookieName(),
    value: "",
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function setOverrideCookie(response: NextResponse, request: Request, role: AppAuthRole) {
  response.cookies.set({
    name: getRoleOverrideCookieName(),
    value: role,
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.is_admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { role?: string };
  if (!isValidRole(body.role)) {
    return NextResponse.json({ error: "Valid role is required." }, { status: 400 });
  }

  const response = NextResponse.json({
    ok: true,
    role: body.role,
    is_test_mode: body.role !== (session.originalRole ?? "admin"),
  });

  if (body.role === (session.originalRole ?? "admin")) {
    clearOverrideCookie(response, request);
  } else {
    setOverrideCookie(response, request, body.role);
  }

  return response;
}

export async function DELETE(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.is_admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, role: session.originalRole ?? "admin", is_test_mode: false });
  clearOverrideCookie(response, request);
  return response;
}
