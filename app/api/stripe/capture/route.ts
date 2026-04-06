import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { findJobById, updateJob } from "@/lib/jobs";
import { upsertTransaction } from "@/lib/transactions";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeApiVersion: Stripe.LatestApiVersion =
  (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) ?? "2026-02-25.clover";

export async function POST(request: Request) {
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe secret key is not configured." }, { status: 500 });
  }

  try {
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== "tech" && session.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as { jobId?: string };
    if (!body.jobId) {
      return NextResponse.json({ error: "jobId is required." }, { status: 400 });
    }

    const job = await findJobById(body.jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    if (session.role === "tech" && job.assigned_tech_email !== session.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (!job.payment_intent_id) {
      return NextResponse.json({ error: "Missing payment intent." }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: stripeApiVersion });
    const intent = await stripe.paymentIntents.capture(job.payment_intent_id);

    const now = new Date().toISOString();
    const updated = await updateJob(job.id, (current) => ({
      ...current,
      completed_at: current.completed_at ?? now,
      payment_status: intent.status ?? "captured",
    }));

    await upsertTransaction({
      job_id: job.id,
      stripe_session_id: job.stripe_session_id,
      payment_intent_id: job.payment_intent_id,
      amount_total: job.amount_total ?? (typeof intent.amount === "number" ? intent.amount / 100 : 0),
      currency: job.currency ?? intent.currency ?? "usd",
      customer: job.customer,
      rep: job.rep,
      tech: job.assigned_tech_email ? { email: job.assigned_tech_email } : undefined,
      pane_counts: job.pane_counts,
      pane_total: job.pane_total,
      service_date: job.service_date,
      service_time: job.service_time,
      payment_status: intent.status ?? "captured",
      created_at: job.created_at ?? now,
      captured_at: now,
    });

    return NextResponse.json({ job: updated, payment_intent: intent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to capture payment." }, { status: 500 });
  }
}
