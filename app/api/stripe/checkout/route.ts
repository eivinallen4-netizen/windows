import Stripe from "stripe";
import { NextResponse } from "next/server";
import { readPricing } from "@/lib/pricing-store";
import { computeQuote, type QuoteSelections } from "@/lib/quote";
import { getSessionFromRequest } from "@/lib/auth";
import { addJob, findJobByStripeSessionId } from "@/lib/jobs";
import { upsertTransaction, type TransactionLineItem } from "@/lib/transactions";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeApiVersion: Stripe.LatestApiVersion =
  (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) ?? "2026-02-25.clover";

function getSiteUrl(request: Request) {
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

function isValidEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

export async function POST(request: Request) {
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe secret key is not configured." }, { status: 500 });
  }

  try {
    const authSession = await getSessionFromRequest(request);
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as {
      user?: {
        name?: string;
        email?: string;
        address?: string;
        addressDetails?: {
          line1?: string;
          city?: string;
          state?: string;
          postalCode?: string;
          country?: string;
        };
      };
      selections?: QuoteSelections;
      serviceDate?: string;
      serviceTime?: string;
    };

    if (!body.user?.name || !body.user.email || !isValidEmail(body.user.email)) {
      return NextResponse.json({ error: "Valid name and email are required." }, { status: 400 });
    }

    if (!body.selections) {
      return NextResponse.json({ error: "selections is required" }, { status: 400 });
    }

    const paneCounts = (body.selections.paneCounts ?? {}) as Record<string, number>;
    const totalWindows = Object.values(paneCounts).reduce((sum, count) => sum + count, 0);
    if (totalWindows <= 0) {
      return NextResponse.json({ error: "Valid window count is required." }, { status: 400 });
    }

    const pricing = await readPricing();
    const totals = computeQuote(pricing, body.selections);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: stripeApiVersion });

    const customerAddress = body.user.addressDetails?.line1
      ? {
          line1: body.user.addressDetails.line1,
          city: body.user.addressDetails.city,
          state: body.user.addressDetails.state,
          postal_code: body.user.addressDetails.postalCode,
          country: body.user.addressDetails.country ?? "US",
        }
      : body.user.address
        ? { line1: body.user.address }
        : undefined;

    const customer = await stripe.customers.create({
      name: body.user.name,
      email: body.user.email,
      address: customerAddress,
      shipping: customerAddress
        ? {
            name: body.user.name,
            address: customerAddress,
          }
        : undefined,
    });

    const addressLine1 = body.user.addressDetails?.line1 ?? body.user.address ?? "Auto-Blob";
    const addressCity = body.user.addressDetails?.city ?? "";
    const addressState = body.user.addressDetails?.state ?? "";
    const addressPostal = body.user.addressDetails?.postalCode ?? "";
    const addressCountry = body.user.addressDetails?.country ?? "US";
    const createdAt = new Date().toISOString();

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const transactionLineItems: TransactionLineItem[] = [];
    const paneTypeLabels: Record<string, string> = {
      standard: "Standard",
      specialty: "Sliding / Large",
      french: "French Pane",
    };
    (Object.keys(pricing.paneTypes) as Array<keyof typeof pricing.paneTypes>).forEach((type) => {
      const count = paneCounts[type] ?? 0;
      if (count <= 0) return;
      const name = `Window panes - ${paneTypeLabels[type] ?? type.replace(/_/g, " ")}`;
      const unitAmount = Math.round(pricing.paneTypes[type] * 100) / 100;
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name,
            metadata: { panes: String(count) },
          },
          unit_amount: Math.round(unitAmount * 100),
        },
        quantity: count,
      });
      transactionLineItems.push({
        name,
        quantity: count,
        unit_amount: unitAmount,
        total_amount: unitAmount * count,
      });
    });

    if (body.selections.storyLevel === "3+") {
      const name = "Story surcharge (3rd floor+)";
      const unitAmount = Math.round(pricing.storySurcharge.third_plus * 100) / 100;
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name,
          },
          unit_amount: Math.round(unitAmount * 100),
        },
        quantity: totalWindows,
      });
      transactionLineItems.push({
        name,
        quantity: totalWindows,
        unit_amount: unitAmount,
        total_amount: unitAmount * totalWindows,
      });
    }

    if (body.selections.addons.screen) {
      const name = "Screen cleaning";
      const unitAmount = Math.round(pricing.addons.screen * 100) / 100;
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name },
          unit_amount: Math.round(unitAmount * 100),
        },
        quantity: totalWindows,
      });
      transactionLineItems.push({
        name,
        quantity: totalWindows,
        unit_amount: unitAmount,
        total_amount: unitAmount * totalWindows,
      });
    }

    if (body.selections.addons.track) {
      const name = "Track cleaning";
      const unitAmount = Math.round(pricing.addons.track * 100) / 100;
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name },
          unit_amount: Math.round(unitAmount * 100),
        },
        quantity: totalWindows,
      });
      transactionLineItems.push({
        name,
        quantity: totalWindows,
        unit_amount: unitAmount,
        total_amount: unitAmount * totalWindows,
      });
    }

    if (body.selections.addons.hard_water) {
      const name = "Hard water removal";
      const unitAmount = Math.round(pricing.addons.hard_water * 100) / 100;
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name },
          unit_amount: Math.round(unitAmount * 100),
        },
        quantity: totalWindows,
      });
      transactionLineItems.push({
        name,
        quantity: totalWindows,
        unit_amount: unitAmount,
        total_amount: unitAmount * totalWindows,
      });
    }

    if (body.selections.addons.interior) {
      const name = "Interior cleaning";
      const unitAmount = Math.round(pricing.addons.interior * 100) / 100;
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name },
          unit_amount: Math.round(unitAmount * 100),
        },
        quantity: totalWindows,
      });
      transactionLineItems.push({
        name,
        quantity: totalWindows,
        unit_amount: unitAmount,
        total_amount: unitAmount * totalWindows,
      });
    }

    const origin = getSiteUrl(request);
    if (totals.minimumApplied) {
      const difference = totals.total - totals.subtotal;
      const name = "Job minimum adjustment";
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name },
          unit_amount: Math.round(difference * 100),
        },
        quantity: 1,
      });
      transactionLineItems.push({
        name,
        quantity: 1,
        unit_amount: difference,
        total_amount: difference,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
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
          customer_name: body.user.name,
          customer_email: body.user.email,
          customer_address: addressLine1,
          customer_city: addressCity,
          customer_state: addressState,
          customer_postal: addressPostal,
          customer_country: addressCountry,
          pane_counts: JSON.stringify(paneCounts),
          pane_total: String(totalWindows),
          captured_at: createdAt,
          service_date: body.serviceDate ?? "",
          service_time: body.serviceTime ?? "",
          rep_email: authSession.email,
          rep_name: authSession.name ?? authSession.email,
        },
      },
      success_url: `${origin}/success?type=purchase&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/close-deal?canceled=1`,
      metadata: {
        customer_name: body.user.name,
        customer_address: body.user.address ?? addressLine1,
        pane_counts: JSON.stringify(paneCounts),
        pane_total: String(totalWindows),
        story_level: body.selections.storyLevel,
        total: String(totals.total),
        customer_email: body.user.email,
        customer_address_line1: addressLine1,
        customer_city: addressCity,
        customer_state: addressState,
        customer_postal: addressPostal,
        customer_country: addressCountry,
        captured_at: createdAt,
        service_date: body.serviceDate ?? "",
        service_time: body.serviceTime ?? "",
        rep_email: authSession.email,
        rep_name: authSession.name ?? authSession.email,
      },
    });

    try {
      const existingJob = await findJobByStripeSessionId(session.id);
      if (!existingJob) {
        const job = await addJob({
          id: `job_${crypto.randomUUID()}`,
          stripe_session_id: session.id,
          payment_intent_id: undefined,
          amount_total: totals.total,
          currency: "usd",
          customer: {
            name: body.user.name,
            email: body.user.email,
            address: body.user.address ?? addressLine1,
          },
          pane_counts: {
            standard: Number(paneCounts.standard ?? 0) || undefined,
            specialty: Number(paneCounts.specialty ?? 0) || undefined,
            french: Number(paneCounts.french ?? 0) || undefined,
          },
          pane_total: totalWindows,
          service_date: body.serviceDate ?? undefined,
          service_time: body.serviceTime ?? undefined,
          rep: {
            email: authSession.email,
            name: authSession.name ?? authSession.email,
          },
          payment_status: "checkout_pending",
          created_at: createdAt,
        });

        await upsertTransaction({
          job_id: job.id,
          stripe_session_id: session.id,
          amount_total: totals.total,
          currency: "usd",
          customer: job.customer,
          rep: job.rep,
          pane_counts: job.pane_counts,
          pane_total: job.pane_total,
          service_date: job.service_date,
          service_time: job.service_time,
          line_items: transactionLineItems,
          payment_status: "checkout_pending",
          created_at: createdAt,
        });
      } else {
        await upsertTransaction({
          job_id: existingJob.id,
          stripe_session_id: session.id,
          amount_total: totals.total,
          currency: "usd",
          customer: existingJob.customer,
          rep: existingJob.rep,
          pane_counts: existingJob.pane_counts,
          pane_total: existingJob.pane_total,
          service_date: existingJob.service_date,
          service_time: existingJob.service_time,
          line_items: transactionLineItems,
          payment_status: existingJob.payment_status,
          created_at: existingJob.created_at ?? createdAt,
        });
      }
    } catch (storageError) {
      console.error("Checkout session created, but local persistence failed.", {
        sessionId: session.id,
        error: storageError,
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create Stripe checkout session.",
      },
      { status: 500 }
    );
  }
}
