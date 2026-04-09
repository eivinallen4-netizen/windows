import Stripe from "stripe";
import {
  getJobs,
  addJob,
  findJobById,
  findJobByPaymentIntentId,
  findJobByStripeSessionId,
  type PaneCounts,
  updateJob,
} from "@/lib/jobs";

type SyncedJobResult =
  | { status: "created" | "updated"; jobId: string }
  | { status: "skipped"; reason: string };

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeApiVersion: Stripe.LatestApiVersion =
  (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) ?? "2026-02-25.clover";

function getPaymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id;
}

function getCustomerAddress(session: Stripe.Checkout.Session) {
  return [
    session.metadata?.customer_address_line1 || session.metadata?.customer_address,
    session.metadata?.customer_city,
    session.metadata?.customer_state,
    session.metadata?.customer_postal,
  ]
    .filter(Boolean)
    .join(", ");
}

function parsePaneCounts(raw: string | undefined): PaneCounts | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const paneCounts: PaneCounts = {
      standard: Number(parsed.standard ?? 0) || undefined,
      specialty: Number(parsed.specialty ?? 0) || undefined,
      french: Number(parsed.french ?? 0) || undefined,
    };

    return paneCounts.standard || paneCounts.specialty || paneCounts.french ? paneCounts : undefined;
  } catch {
    return undefined;
  }
}

export async function syncJobFromCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<SyncedJobResult> {
  const paymentIntentId = getPaymentIntentId(session);
  if (!paymentIntentId) {
    console.warn("Stripe checkout completed without a payment intent.", { id: session.id });
    return { status: "skipped", reason: "missing_payment_intent" };
  }

  const customerEmail =
    session.customer_email ||
    session.customer_details?.email ||
    session.metadata?.customer_email ||
    undefined;
  const customerName = session.customer_details?.name || session.metadata?.customer_name || undefined;
  const customerAddress = getCustomerAddress(session) || session.metadata?.customer_address || undefined;
  const paneCounts = parsePaneCounts(session.metadata?.pane_counts);
  const paneTotal = Number(session.metadata?.pane_total ?? 0) || undefined;
  const amountTotal = typeof session.amount_total === "number" ? session.amount_total / 100 : undefined;
  const createdAt = new Date().toISOString();

  const existingJob =
    (session.metadata?.job_id ? await findJobById(session.metadata.job_id) : null) ||
    (await findJobByPaymentIntentId(paymentIntentId)) ||
    (session.id ? await findJobByStripeSessionId(session.id) : null) ||
    (session.id ? await findJobById(session.id) : null);

  const stripeJobData = {
    stripe_session_id: session.id,
    payment_intent_id: paymentIntentId,
    amount_total: amountTotal,
    currency: session.currency ?? "usd",
    customer: {
      name: customerName,
      email: customerEmail,
      address: customerAddress,
    },
    pane_counts: paneCounts,
    pane_total: paneTotal,
    service_date: session.metadata?.service_date || undefined,
    service_time: session.metadata?.service_time || undefined,
    rep: session.metadata?.rep_email
      ? {
          email: session.metadata.rep_email,
          name: session.metadata.rep_name || session.metadata.rep_email,
        }
      : undefined,
    payment_status: "authorized",
  } as const;

  if (existingJob) {
    await updateJob(existingJob.id, (current) => ({
      ...current,
      stripe_session_id: stripeJobData.stripe_session_id || current.stripe_session_id,
      payment_intent_id: stripeJobData.payment_intent_id || current.payment_intent_id,
      amount_total: stripeJobData.amount_total ?? current.amount_total,
      currency: stripeJobData.currency || current.currency,
      customer: {
        name: stripeJobData.customer.name || current.customer?.name,
        email: stripeJobData.customer.email || current.customer?.email,
        address: stripeJobData.customer.address || current.customer?.address,
      },
      pane_counts: stripeJobData.pane_counts ?? current.pane_counts,
      pane_total: stripeJobData.pane_total ?? current.pane_total,
      service_date: stripeJobData.service_date || current.service_date,
      service_time: stripeJobData.service_time || current.service_time,
      rep:
        stripeJobData.rep?.email || current.rep?.email
          ? {
              email: stripeJobData.rep?.email || current.rep?.email,
              name: stripeJobData.rep?.name || current.rep?.name || stripeJobData.rep?.email || current.rep?.email,
            }
          : undefined,
      payment_status:
        current.payment_status === "captured" || current.payment_status === "succeeded"
          ? current.payment_status
          : stripeJobData.payment_status,
      created_at: current.created_at ?? createdAt,
    }));
    return { status: "updated", jobId: existingJob.id };
  }

  const job = await addJob({
    id: `job_${crypto.randomUUID()}`,
    ...stripeJobData,
    created_at: createdAt,
  });
  return { status: "created", jobId: job.id };
}

export async function syncJobFromCheckoutSessionId(sessionId: string): Promise<SyncedJobResult> {
  if (!stripeSecretKey) {
    return { status: "skipped", reason: "missing_stripe_secret" };
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: stripeApiVersion });
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent", "customer"],
  });

  if (session.status !== "complete") {
    return { status: "skipped", reason: "checkout_incomplete" };
  }

  const paymentIntent =
    typeof session.payment_intent === "string" ? null : session.payment_intent;

  if (!paymentIntent || paymentIntent.status !== "requires_capture") {
    return { status: "skipped", reason: "authorization_not_ready" };
  }

  return syncJobFromCheckoutSession(session);
}

export async function reconcilePendingStripeJobs() {
  const jobs = await getJobs();
  const pendingJobs = jobs.filter(
    (job) =>
      Boolean(job.stripe_session_id) &&
      (!job.payment_intent_id || job.payment_status === "checkout_pending")
  );

  for (const job of pendingJobs) {
    try {
      await syncJobFromCheckoutSessionId(job.stripe_session_id!);
    } catch (error) {
      console.error("Failed to reconcile pending Stripe job.", {
        jobId: job.id,
        stripeSessionId: job.stripe_session_id,
        error,
      });
    }
  }
}
