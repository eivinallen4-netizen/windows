import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getJobs } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSuccessfulPaymentStatus(status?: string) {
  return status === "captured" || status === "succeeded";
}

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const jobs = await getJobs();
    const seenTransactions = new Set<string>();
    const bookings = jobs
      .filter((job) => {
        if (!job.payment_intent_id) {
          return false;
        }
        if (!isSuccessfulPaymentStatus(job.payment_status)) {
          return false;
        }
        if (seenTransactions.has(job.payment_intent_id)) {
          return false;
        }
        seenTransactions.add(job.payment_intent_id);
        return true;
      })
      .map((job) => ({
        transaction_id: job.payment_intent_id,
        session_id: job.stripe_session_id,
        job_id: job.id,
        amount_total: job.amount_total ?? 0,
        currency: job.currency ?? "usd",
        payment_status: job.payment_status,
        created_at: job.created_at,
        captured_at: job.completed_at,
        rep: job.rep,
        tech: job.assigned_tech_email ? { email: job.assigned_tech_email } : undefined,
      }));

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load bookings." }, { status: 500 });
  }
}
