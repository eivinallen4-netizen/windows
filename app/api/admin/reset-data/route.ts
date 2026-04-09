import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { resetNonUserData } from "@/lib/admin-reset";
import type { AppConfig } from "@/lib/app-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESET_CONFIRMATION = "RESET";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.is_admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { confirmation?: string };
    if ((body.confirmation ?? "").trim() !== RESET_CONFIRMATION) {
      return NextResponse.json(
        { error: `Type ${RESET_CONFIRMATION} to confirm the reset.` },
        { status: 400 }
      );
    }

    const config: AppConfig = await resetNonUserData();

    return NextResponse.json({
      ok: true,
      message: "Non-user data reset. Users and reviews were preserved.",
      config,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to reset admin data." }, { status: 500 });
  }
}
