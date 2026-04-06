import Stripe from "stripe";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import type { QuoteSelections } from "@/lib/quote";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeApiVersion: Stripe.LatestApiVersion =
  (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) ?? "2026-02-25.clover";

type QuoteUser = {
  name: string;
  email: string;
  address: string;
  addressDetails?: {
    line1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
};

function isValidEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

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
  try {
    const body = (await request.json()) as {
      user?: QuoteUser;
      selections?: QuoteSelections;
      totals?: { total?: number; minimumApplied?: boolean };
    };

    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe secret key is not configured." }, { status: 500 });
    }

    if (!body.user?.email || !isValidEmail(body.user.email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    if (!body.user.name || !body.user.address) {
      return NextResponse.json({ error: "Name and address are required." }, { status: 400 });
    }

    if (!body.selections) {
      return NextResponse.json({ error: "selections is required" }, { status: 400 });
    }

    const paneCounts = (body.selections.paneCounts ?? {}) as Record<string, number>;
    const totalWindows = Object.values(paneCounts).reduce((sum, count) => sum + count, 0);
    if (totalWindows <= 0) {
      return NextResponse.json({ error: "Window count must be greater than 0." }, { status: 400 });
    }

    const addons = Object.entries(body.selections.addons || {})
      .filter(([, enabled]) => enabled)
      .map(([key]) => key.replace(/_/g, " "));

    const total = typeof body.totals?.total === "number" ? body.totals.total : 0;
    const totalText = formatCurrency(total);

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

    const paneTypeLabels: Record<string, string> = {
      standard: "Standard",
      specialty: "Sliding / Large",
      french: "French Pane",
    };
    const breakdownText = Object.entries(paneCounts)
      .filter(([, count]) => (count ?? 0) > 0)
      .map(([type, count]) => `${count} ${paneTypeLabels[type] ?? type.replace(/_/g, " ")}`)
      .join(", ");

    await stripe.customers.create({
      name: body.user.name,
      email: body.user.email,
      address: customerAddress,
      shipping: customerAddress
        ? {
            name: body.user.name,
            address: customerAddress,
          }
        : undefined,
      metadata: {
        source: "quote_request",
        pane_counts: JSON.stringify(paneCounts),
        story_level: body.selections.storyLevel,
        total: String(total),
      },
    });

    const subject = "PureBin LV window quote - neighborhood pricing";
   

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your neighborhood quote</title>

</head>
<body style="margin:0;padding:0;background-color:#0D2E45;font-family:Arial, sans-serif;color:#F5FAFD;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D2E45;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

          <!-- URGENCY BANNER -->
          <tr>
            <td style="background:#1B9E8A;border-radius:12px 12px 0 0;padding:11px 24px;text-align:center;">
              <p style="margin:0; font-family: Arial, sans-serif; font-size:14px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#0D2E45;">
                Neighborhood pricing while we are on your street
              </p>
            </td>
          </tr>

          <!-- HEADER -->
          <tr>
            <td style="background:#123B57;padding:44px 40px 36px;text-align:center;">
              <!-- Shield logo -->
              <div style="margin:0 auto 16px;width:64px;">
                <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                  <path d="M50 4 L92 22 L92 58 C92 80 72 98 50 106 C28 98 8 80 8 58 L8 22 Z" fill="none" stroke="#1B9E8A" stroke-width="5"/>
                  <path d="M50 14 L84 29 L84 58 C84 76 68 92 50 100 C32 92 16 76 16 58 L16 29 Z" fill="#1B9E8A" opacity="0.12"/>
                  <!-- Window pane icon -->
                  <rect x="30" y="34" width="40" height="38" rx="3" fill="none" stroke="#1B9E8A" stroke-width="4"/>
                  <line x1="50" y1="34" x2="50" y2="72" stroke="#1B9E8A" stroke-width="3"/>
                  <line x1="30" y1="53" x2="70" y2="53" stroke="#1B9E8A" stroke-width="3"/>
                  <!-- Sparkle -->
                  <text x="62" y="44" font-size="10" fill="#1B9E8A" opacity="0.9">&#10022;</text>
                </svg>
              </div>
              <p style="margin:0 0 4px; font-family: Arial, sans-serif; font-size:12px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#1B9E8A;">PureBin LV</p>
              <h1 style="margin:0; font-family: Arial, sans-serif; font-size:44px;font-weight:900;color:#F5FAFD;line-height:1.05;text-transform:uppercase;">
                Hey ${escapeHtml(body.user.name)} &#8212;<br/><span style="color:#1B9E8A;">Still thinking it over?</span>
              </h1>
              <p style="margin:16px auto 0;max-width:420px;font-size:15px;font-weight:400;color:rgba(245,250,253,0.75);line-height:1.75;">
                We were already in your neighborhood, so you got our best price. Here is everything in writing, no surprises.
              </p>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="background:#123B57;padding:0 40px;">
              <div style="border-top:1px solid rgba(245,250,253,0.12);"></div>
            </td>
          </tr>

          <!-- PERSONAL MESSAGE -->
          <tr>
            <td style="background:#123B57;padding:32px 40px 0;">
              <div style="background:#0F324F;border-radius:10px;padding:24px 26px;border-left:4px solid #1B9E8A;">
                <p style="margin:0 0 4px; font-family: Arial, sans-serif; font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B9E8A;">A note from our team</p>
                <p style="margin:12px 0 0;font-size:15px;color:rgba(245,250,253,0.78);line-height:1.85;">
                  We know life gets busy. Since we are already working nearby, your neighborhood price is available while we are on the street.
                </p>
                <p style="margin:12px 0 0;font-size:15px;color:rgba(245,250,253,0.78);line-height:1.85;">
                  If you would like to lock it in, just call or reply. We will take care of the rest.
                </p>
              </div>
            </td>
          </tr>

          <!-- QUOTE RECAP -->
          <tr>
            <td style="background:#123B57;padding:28px 40px 0;">
              <p style="margin:0 0 14px; font-family: Arial, sans-serif; font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#1B9E8A;">Your price details</p>
              <div style="border:2px solid #1B9E8A;border-radius:12px;overflow:hidden;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F324F;">
                  <tr>
                    <td style="padding:14px 24px;border-bottom:1px solid rgba(245,250,253,0.12);">
                      <span style="font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#1B9E8A;">Windows</span><br/>
                      <span style="font-family: Arial, sans-serif;font-size:20px;font-weight:700;color:#F5FAFD;">${totalWindows}</span>
                    </td>
                    <td style="padding:14px 24px;border-bottom:1px solid rgba(245,250,253,0.12);border-left:1px solid rgba(245,250,253,0.12);">
                      <span style="font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#1B9E8A;">Window Types</span><br/>
                      <span style="font-family: Arial, sans-serif;font-size:20px;font-weight:700;color:#F5FAFD;">${escapeHtml(breakdownText || "None")}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 24px;border-bottom:1px solid rgba(245,250,253,0.12);">
                      <span style="font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#1B9E8A;">Story Level</span><br/>
                      <span style="font-family: Arial, sans-serif;font-size:20px;font-weight:700;color:#F5FAFD;">${escapeHtml(body.selections.storyLevel)}</span>
                    </td>
                    <td style="padding:14px 24px;border-bottom:1px solid rgba(245,250,253,0.12);border-left:1px solid rgba(245,250,253,0.12);">
                      <span style="font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#1B9E8A;">Add-ons</span><br/>
                      <span style="font-family: Arial, sans-serif;font-size:20px;font-weight:700;color:#F5FAFD;">${escapeHtml(addons.length ? addons.join(", ") : "None")}</span>
                    </td>
                  </tr>
                  <!-- PRICE COMPARISON -->
                  <tr>
                    <td colspan="2" style="padding:20px 24px;background:#0B2639;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <p style="margin:0 0 6px;font-size:13px;color:rgba(245,250,253,0.5);text-decoration:line-through;">Standard price: ${formatCurrency(total + 50)}</p>
                            <p style="margin:0; font-family: Arial, sans-serif; font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#1B9E8A;">Your neighborhood price</p>
                            <p style="margin:4px 0 0;font-size:12px;color:rgba(245,250,253,0.7);">Available while we are still nearby</p>
                          </td>
                          <td align="right" style="vertical-align:middle;">
                            <span style="font-family: Arial, sans-serif;font-size:44px;font-weight:900;color:#1B9E8A;">${escapeHtml(totalText)}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- ADDRESS -->
          <tr>
            <td style="background:#123B57;padding:16px 40px 0;">
              <div style="border-left:4px solid rgba(245,250,253,0.2);padding:12px 18px;background:#0F324F;border-radius:0 8px 8px 0;">
                <p style="margin:0 0 3px;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(245,250,253,0.5);">Your home</p>
                <p style="margin:0; font-family: Arial, sans-serif; font-size:18px;font-weight:700;color:#F5FAFD;">${escapeHtml(body.user.address)}</p>
              </div>
            </td>
          </tr>

          <!-- WHAT WE DO -->
          <tr>
            <td style="background:#123B57;padding:28px 40px 0;">
              <p style="margin:0 0 14px; font-family: Arial, sans-serif; font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#1B9E8A;">What we clean &#8212; done by hand</p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="50%" style="padding:0 8px 10px 0;vertical-align:top;">
                    <div style="background:#0F324F;border-radius:8px;padding:14px 16px;">
                      <p style="margin:0; font-family: Arial, sans-serif; font-size:15px;font-weight:700;color:#F5FAFD;">Glass</p>
                      <p style="margin:4px 0 0;font-size:13px;color:rgba(245,250,253,0.7);line-height:1.5;">Streak-free clarity that boosts curb appeal.</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:0 0 10px 8px;vertical-align:top;">
                    <div style="background:#0F324F;border-radius:8px;padding:14px 16px;">
                      <p style="margin:0; font-family: Arial, sans-serif; font-size:15px;font-weight:700;color:#F5FAFD;">Frames</p>
                      <p style="margin:4px 0 0;font-size:13px;color:rgba(245,250,253,0.7);line-height:1.5;">Clean edges that make the whole window pop.</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
                    <div style="background:#0F324F;border-radius:8px;padding:14px 16px;">
                      <p style="margin:0; font-family: Arial, sans-serif; font-size:15px;font-weight:700;color:#F5FAFD;">Sills</p>
                      <p style="margin:4px 0 0;font-size:13px;color:rgba(245,250,253,0.7);line-height:1.5;">Inside and outside, wiped clean.</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:0 0 0 8px;vertical-align:top;">
                    <div style="background:#0F324F;border-radius:8px;padding:14px 16px;">
                      <p style="margin:0; font-family: Arial, sans-serif; font-size:15px;font-weight:700;color:#F5FAFD;">Tracks</p>
                      <p style="margin:4px 0 0;font-size:13px;color:rgba(245,250,253,0.7);line-height:1.5;">Cleared out so everything stays clean longer.</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SOCIAL PROOF -->
          <tr>
            <td style="background:#123B57;padding:28px 40px 0;">
              <div style="background:#0B2639;border-radius:10px;padding:22px 24px;text-align:center;">
                <p style="margin:0 0 8px;font-size:22px;">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
                <p style="margin:0;font-size:15px;font-style:italic;color:rgba(245,250,253,0.7);line-height:1.8;">
                  "They showed up on time and the windows look brand new. Super easy and the price was exactly what they said."
                </p>
                <p style="margin:10px 0 0; font-family: Arial, sans-serif; font-size:14px;font-weight:700;letter-spacing:1px;color:#1B9E8A;">&#8212; Mike T., your neighbor on Elm St.</p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#123B57;padding:32px 40px;text-align:center;">
              <a href="tel:+17027726000" style="display:inline-block;background:#1B9E8A;color:#0D2E45;text-decoration:none;padding:18px 52px;border-radius:6px; font-family: Arial, sans-serif; font-size:20px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">
                Call 702 772 6000
              </a>
              <p style="margin:14px 0 6px;font-size:13px;color:rgba(245,250,253,0.6);">Or just reply to this email and we will take care of it.</p>
              <p style="margin:0; font-family: Arial, sans-serif; font-size:15px;font-weight:700;letter-spacing:1px;color:#1B9E8A;">No long contracts. Morning or afternoon. You pick.</p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#0B2639;border-radius:0 0 12px 12px;padding:26px 40px;text-align:center;border-top:1px solid rgba(245,250,253,0.12);">
              <div style="margin:0 auto 10px;width:32px;">
                <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                  <path d="M50 4 L92 22 L92 58 C92 80 72 98 50 106 C28 98 8 80 8 58 L8 22 Z" fill="none" stroke="#1B9E8A" stroke-width="6"/>
                </svg>
              </div>
              <p style="margin:0 0 4px; font-family: Arial, sans-serif; font-size:18px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#F5FAFD;">PureBin LV</p>
              <p style="margin:0;font-size:12px;color:rgba(245,250,253,0.6);line-height:1.8;">
                We clean windows in your neighborhood &#8212; one street at a time.<br/>
                You received this because our team stopped by your home.<br/>
                &copy; 2026 PureBin LV. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

    await sendEmail({
      to: body.user.email,
      subject,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to send quote email." }, { status: 500 });
  }
}





