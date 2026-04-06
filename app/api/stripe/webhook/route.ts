import Stripe from "stripe";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { findJobByStripeSessionId } from "@/lib/jobs";
import { syncJobFromCheckoutSession } from "@/lib/stripe-job-sync";
import { upsertTransaction } from "@/lib/transactions";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripeApiVersion: Stripe.LatestApiVersion =
  (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) ?? "2026-02-25.clover";
const isProduction = process.env.NODE_ENV === "production";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(request: Request) {
  if (!stripeSecretKey || !stripeWebhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = new Stripe(stripeSecretKey, { apiVersion: stripeApiVersion });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid Stripe webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const sessionFromEvent = event.data.object as Stripe.Checkout.Session;
      const session = await stripe.checkout.sessions.retrieve(sessionFromEvent.id, {
        expand: ["payment_intent", "customer"],
      });
      if (!isProduction) {
        console.info("Stripe checkout completed", {
          id: session.id,
          email: session.customer_email,
          amount_total: session.amount_total,
        });
      }

      const email =
        session.customer_email ||
        session.customer_details?.email ||
        session.metadata?.customer_email ||
        "";

      if (!email) {
        console.warn("Stripe checkout completed without an email.");
      }

      const name = session.customer_details?.name || session.metadata?.customer_name || "there";
      const total =
        typeof session.amount_total === "number"
          ? formatCurrency(session.amount_total / 100)
          : session.metadata?.total
            ? formatCurrency(Number(session.metadata.total))
            : "";

      const addressParts = [
        session.metadata?.customer_address_line1 || session.metadata?.customer_address,
        session.metadata?.customer_city,
        session.metadata?.customer_state,
        session.metadata?.customer_postal,
      ]
        .filter(Boolean)
        .join(", ");

      const serviceDate = session.metadata?.service_date || "";
      const serviceTime = session.metadata?.service_time || "";
      const serviceText =
        serviceDate && serviceTime
          ? `${serviceDate} at ${serviceTime}`
          : serviceDate
            ? serviceDate
            : serviceTime
              ? serviceTime
              : "We will confirm the schedule soon.";

      const subject = "Authorization received for your window cleaning";
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Thank You</title>
</head>
<body style="margin:0;padding:0;background-color:#1a1a1a;font-family:'Barlow',sans-serif;color:white;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
          <tr>
            <td style="background:#f0a500;border-radius:12px 12px 0 0;padding:11px 24px;text-align:center;">
              <p style="margin:0;font-size:14px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#1a1a1a;">
                Authorization Received
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#222;padding:44px 40px 36px;text-align:center;">
              <div style="margin:0 auto 16px;width:64px;">
                <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                  <path d="M50 4 L92 22 L92 58 C92 80 72 98 50 106 C28 98 8 80 8 58 L8 22 Z" fill="none" stroke="#4ecdc4" stroke-width="5"/>
                  <path d="M50 14 L84 29 L84 58 C84 76 68 92 50 100 C32 92 16 76 16 58 L16 29 Z" fill="#4ecdc4" opacity="0.12"/>
                  <rect x="30" y="34" width="40" height="38" rx="3" fill="none" stroke="#4ecdc4" stroke-width="4"/>
                  <line x1="50" y1="34" x2="50" y2="72" stroke="#4ecdc4" stroke-width="3"/>
                  <line x1="30" y1="53" x2="70" y2="53" stroke="#4ecdc4" stroke-width="3"/>
                </svg>
              </div>
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#4ecdc4;">PureBin</p>
              <h1 style="margin:0;font-size:42px;font-weight:900;color:#ffffff;line-height:1.05;text-transform:uppercase;">
                Thanks ${escapeHtml(name)}!
              </h1>
              <p style="margin:16px auto 0;max-width:460px;font-size:15px;font-weight:400;color:rgba(255,255,255,0.55);line-height:1.75;">
                We received your payment authorization and will charge after the job is completed.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#222;padding:0 40px;">
              <div style="border-top:1px solid #333;"></div>
            </td>
          </tr>
          <tr>
            <td style="background:#222;padding:28px 40px 0;">
              <p style="margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#4ecdc4;">Order Summary</p>
              <div style="border:2px solid #4ecdc4;border-radius:12px;overflow:hidden;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#2a2a2a;">
                  <tr>
                    <td style="padding:18px 24px;border-bottom:1px solid #333;">
                      <span style="font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#4ecdc4;">Total</span><br/>
                      <span style="font-size:32px;font-weight:800;color:#fff;">${escapeHtml(total || "Paid")}</span>
                    </td>
                    <td style="padding:18px 24px;border-bottom:1px solid #333;border-left:1px solid #333;">
                      <span style="font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#4ecdc4;">Service Time</span><br/>
                      <span style="font-size:16px;font-weight:700;color:#fff;">${escapeHtml(serviceText)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:18px 24px;background:#1e1e1e;">
                      <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:2px;">Service Address</p>
                      <p style="margin:0;font-size:16px;font-weight:700;color:#fff;">${escapeHtml(addressParts || "On file")}</p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#222;padding:28px 40px 36px;text-align:center;">
              <a href="tel:+1XXXXXXXXXX" style="display:inline-block;background:#4ecdc4;color:#1a1a1a;text-decoration:none;padding:16px 44px;border-radius:6px;font-size:18px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">
                Need Anything? Call Us
              </a>
              <p style="margin:12px 0 0;font-size:12px;color:rgba(255,255,255,0.35);">
                If you need to change your appointment, just reply to this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#111;border-radius:0 0 12px 12px;padding:26px 40px;text-align:center;border-top:1px solid #2a2a2a;">
              <p style="margin:0 0 4px;font-size:18px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#fff;">Crystal Clear Windows</p>
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);line-height:1.8;">
                Thank you for choosing us. We look forward to making your windows shine.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      try {
        await syncJobFromCheckoutSession(session);
        const job = await findJobByStripeSessionId(session.id);
        await upsertTransaction({
          job_id: job?.id,
          stripe_session_id: session.id,
          payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id,
          amount_total: typeof session.amount_total === "number" ? session.amount_total / 100 : 0,
          currency: session.currency ?? "usd",
          customer: {
            name: session.customer_details?.name || session.metadata?.customer_name || undefined,
            email: session.customer_email || session.customer_details?.email || session.metadata?.customer_email || undefined,
            address: addressParts || session.metadata?.customer_address || undefined,
          },
          rep: session.metadata?.rep_email
            ? {
                email: session.metadata.rep_email,
                name: session.metadata.rep_name || session.metadata.rep_email,
              }
            : job?.rep,
          tech: job?.assigned_tech_email ? { email: job.assigned_tech_email } : undefined,
          pane_counts: job?.pane_counts,
          pane_total: job?.pane_total,
          service_date: session.metadata?.service_date || job?.service_date,
          service_time: session.metadata?.service_time || job?.service_time,
          payment_status: "authorized",
          created_at: job?.created_at ?? new Date().toISOString(),
          authorized_at: new Date().toISOString(),
        });
      } catch (jobError) {
        console.error("Failed to record job.", jobError);
      }

      if (email) {
        try {
          await sendEmail({
            to: email,
            subject,
            html,
          });
        } catch (emailError) {
          console.error("Failed to send purchase email.", emailError);
        }
      }
      break;
    }
    default:
      if (!isProduction) {
        console.info(`Unhandled Stripe event: ${event.type}`);
      }
  }

  return NextResponse.json({ received: true });
}
