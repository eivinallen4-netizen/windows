import Stripe from "stripe";
import type { JobRecord } from "@/lib/jobs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeApiVersion: Stripe.LatestApiVersion =
  (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) ?? "2026-02-25.clover";

export function getSiteUrl(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || null;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const requestHost = forwardedHost || host || new URL(request.url).host;
  const requestIsLocal =
    requestHost.includes("localhost") || requestHost.startsWith("127.0.0.1");
  const envIsLocal = envUrl
    ? envUrl.includes("localhost") || envUrl.includes("127.0.0.1")
    : false;

  if (envUrl && (!envIsLocal || requestIsLocal)) {
    return envUrl;
  }

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (host) {
    const protocol = host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  const url = new URL(request.url);
  return url.origin;
}

export function shouldOfferReplacementAuthorization(error: unknown) {
  if (!(error instanceof Stripe.errors.StripeError)) {
    return false;
  }

  const retryableCodes = new Set([
    "authentication_required",
    "capture_charge_authorization_expired",
    "card_declined",
    "charge_expired_for_capture",
    "expired_card",
    "incorrect_cvc",
    "payment_intent_unexpected_state",
    "processing_error",
  ]);

  return Boolean((error.code && retryableCodes.has(error.code)) || error.type === "StripeCardError");
}

export async function createReplacementAuthorizationSession(request: Request, job: JobRecord) {
  if (!stripeSecretKey) {
    throw new Error("Stripe secret key is not configured.");
  }

  const amountTotal = Math.round(Number(job.amount_total ?? 0) * 100);
  if (!amountTotal) {
    throw new Error("Job amount is required to collect a replacement card.");
  }

  const customerName = job.customer?.name || "Customer";
  const customerEmail = job.customer?.email;
  const [line1 = "", city = "", state = "", postalCode = ""] = (job.customer?.address || "")
    .split(",")
    .map((part) => part.trim());

  const stripe = new Stripe(stripeSecretKey, { apiVersion: stripeApiVersion });
  const customer = await stripe.customers.create({
    name: customerName,
    email: customerEmail,
    address: line1
      ? {
          line1,
          city: city || undefined,
          state: state || undefined,
          postal_code: postalCode || undefined,
          country: "US",
        }
      : undefined,
  });

  const origin = getSiteUrl(request);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: job.currency ?? "usd",
          product_data: {
            name: "Window cleaning service",
            description: job.customer?.address || `Job ${job.id}`,
          },
          unit_amount: amountTotal,
        },
        quantity: 1,
      },
    ],
    customer: customer.id,
    customer_update: {
      address: "auto",
      name: "auto",
      shipping: "auto",
    },
    billing_address_collection: "required",
    shipping_address_collection: {
      allowed_countries: ["US"],
    },
    payment_intent_data: {
      capture_method: "manual",
      metadata: {
        job_id: job.id,
        customer_name: customerName,
        customer_email: customerEmail ?? "",
        customer_address: job.customer?.address ?? "",
        customer_address_line1: line1,
        customer_city: city,
        customer_state: state,
        customer_postal: postalCode,
        customer_country: "US",
        pane_counts: JSON.stringify(job.pane_counts ?? {}),
        pane_total: String(job.pane_total ?? 0),
        service_date: job.service_date ?? "",
        service_time: job.service_time ?? "",
        rep_email: job.rep?.email ?? "",
        rep_name: job.rep?.name ?? job.rep?.email ?? "",
        retry_for_payment_intent: job.payment_intent_id ?? "",
      },
    },
    success_url: `${origin}/tech/jobs/${job.id}/finish?reauthorized=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/tech/jobs/${job.id}/finish?payment_retry_canceled=1`,
    metadata: {
      job_id: job.id,
      customer_name: customerName,
      customer_email: customerEmail ?? "",
      customer_address: job.customer?.address ?? "",
      customer_address_line1: line1,
      customer_city: city,
      customer_state: state,
      customer_postal: postalCode,
      customer_country: "US",
      pane_counts: JSON.stringify(job.pane_counts ?? {}),
      pane_total: String(job.pane_total ?? 0),
      service_date: job.service_date ?? "",
      service_time: job.service_time ?? "",
      rep_email: job.rep?.email ?? "",
      rep_name: job.rep?.name ?? job.rep?.email ?? "",
      retry_for_job_id: job.id,
      retry_for_payment_intent: job.payment_intent_id ?? "",
      total: String(job.amount_total ?? 0),
    },
  });

  if (!session.url) {
    throw new Error("Unable to create replacement checkout session.");
  }

  return session.url;
}
