import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      email: session.email,
      name: session.name,
      role: session.role,
      is_admin: session.is_admin,
    },
  });
}
