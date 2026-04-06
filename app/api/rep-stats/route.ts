import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getRepStats } from "@/lib/rep-stats";
import { reconcilePendingStripeJobs } from "@/lib/stripe-job-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== "rep" && session.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await reconcilePendingStripeJobs();
    const stats = await getRepStats(session.email);
    return NextResponse.json(stats);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load rep stats." }, { status: 500 });
  }
}
