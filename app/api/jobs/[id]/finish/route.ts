import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { createReviewForJob, readReviewFormData, validateReviewFormValues } from "@/lib/job-review";
import { findJobById, updateJob } from "@/lib/jobs";
import { upsertTransaction } from "@/lib/transactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeApiVersion: Stripe.LatestApiVersion =
  (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) ?? "2026-02-25.clover";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe secret key is not configured." }, { status: 500 });
  }

  try {
    const { id } = await params;
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== "tech" && session.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const job = await findJobById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    if (session.role === "tech" && job.assigned_tech_email !== session.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (!job.started_at) {
      return NextResponse.json({ error: "Job must be started before finishing." }, { status: 400 });
    }
    if (!job.start_photo_url) {
      return NextResponse.json({ error: "Job is missing the required before photo." }, { status: 400 });
    }
    if (!job.payment_intent_id) {
      return NextResponse.json({ error: "Missing payment intent." }, { status: 400 });
    }
    if (job.review_id) {
      return NextResponse.json({ error: "This job already has a saved review." }, { status: 400 });
    }
    if (job.payment_status === "succeeded" || job.payment_status === "captured") {
      return NextResponse.json({ error: "This job has already been charged." }, { status: 400 });
    }

    const formData = await request.formData();
    const values = readReviewFormData(formData);
    const validationError = validateReviewFormValues(values, {
      requireBeforePhoto: false,
      requireAfterPhoto: true,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const savedReview = await createReviewForJob(job, session.email, values, {
      beforePhotoUrl: job.start_photo_url,
    });
    await updateJob(job.id, (current) => ({ ...current, review_id: savedReview.id }));

    try {
      const stripe = new Stripe(stripeSecretKey, { apiVersion: stripeApiVersion });
      const intent = await stripe.paymentIntents.capture(job.payment_intent_id);
      const now = new Date().toISOString();
      const updatedJob = await updateJob(job.id, (current) => ({
        ...current,
        review_id: savedReview.id,
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

      return NextResponse.json({
        ok: true,
        partial: false,
        message: "Review saved and card charged.",
        reviewId: savedReview.id,
        job: updatedJob,
        paymentStatus: intent.status ?? "captured",
      });
    } catch (captureError) {
      console.error(captureError);
      const updatedJob = await findJobById(job.id);
      return NextResponse.json(
        {
          ok: false,
          partial: true,
          message: "Review saved, but payment capture failed.",
          reviewId: savedReview.id,
          job: updatedJob,
          paymentStatus: updatedJob?.payment_status ?? "authorized",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to finish job." }, { status: 500 });
  }
}
