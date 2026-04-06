import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { findUserById, readUsers } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const storedUser = session.userId === "env-admin" ? null : findUserById(await readUsers(), session.userId);

  return NextResponse.json({
    user: {
      id: storedUser?.id ?? session.userId,
      email: storedUser?.email ?? session.email,
      name: storedUser?.name ?? session.name,
      role: storedUser?.role ?? session.role,
      phone: storedUser?.phone ?? session.phone,
      birthday: storedUser?.birthday ?? session.birthday,
      profile_completed_at: storedUser?.profile_completed_at ?? session.profile_completed_at,
      is_admin: storedUser?.is_admin ?? session.is_admin,
    },
  });
}
