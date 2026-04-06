import Stripe from "stripe";
import { NextResponse } from "next/server";
import { syncJobFromCheckoutSession } from "@/lib/stripe-job-sync";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeApiVersion: Stripe.LatestApiVersion =
  (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) ?? "2026-02-25.clover";

export async function POST(request: Request) {
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe secret key is not configured." }, { status: 500 });
  }

  try {
    const body = (await request.json()) as { sessionId?: string };
    const sessionId = body.sessionId?.trim();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: stripeApiVersion });
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (checkoutSession.status !== "complete") {
      return NextResponse.json({ error: "Checkout session is not complete." }, { status: 400 });
    }

    const paymentIntent =
      typeof checkoutSession.payment_intent === "string"
        ? null
        : checkoutSession.payment_intent;

    if (!paymentIntent || paymentIntent.status !== "requires_capture") {
      return NextResponse.json(
        { error: "Card authorization is not ready for job creation." },
        { status: 400 }
      );
    }

    const result = await syncJobFromCheckoutSession(checkoutSession);
    if (result.status === "skipped") {
      return NextResponse.json({ ok: false, reason: result.reason });
    }

    return NextResponse.json({
      ok: true,
      status: result.status,
      jobId: result.jobId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to sync job from purchase." }, { status: 500 });
  }
}
