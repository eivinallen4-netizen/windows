import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { Button } from "@/components/ui/button";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import { buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Window Cleaning Pricing Las Vegas",
  description:
    "Learn how window cleaning pricing works in Las Vegas, including pane count, access, interior versus exterior scope, and quote-first confirmation.",
  path: "/pricing",
  keywords: ["window cleaning pricing Las Vegas", "window washing cost Las Vegas", "residential window cleaning price Las Vegas"],
});

const pricingFactors = [
  "Pane count",
  "Home size",
  "Interior vs exterior",
];

const reassurances = [
  "We confirm exact pricing before anything is scheduled",
  "You approve everything before we start",
];

export default async function PricingPage() {
  const businessInfo = await readPublicBusinessSnapshot();

  return (
    <div className="app-page-shell-soft">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ])}
      />
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-18">
        <section className="app-surface-panel px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-3xl space-y-5">
            <span className="app-kicker">Pricing</span>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-foreground sm:text-5xl">
              Simple, Transparent Window Cleaning Pricing in Las Vegas
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              No surprises, no hidden fees, and no vague “starting at” games before the quote is reviewed.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground">
              Pricing depends on scope, access, pane count, and the exact service mix
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              We keep pricing fair and clear, then confirm the exact number with you before the job is ever scheduled. That approach
              works for residential window cleaning, commercial window cleaning, exterior-only service, and more detailed glass-cleaning requests.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">What Affects Price</p>
            <div className="mt-5 grid gap-3">
              {pricingFactors.map((factor) => (
                <div key={factor} className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-base font-semibold text-foreground">
                  {factor}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
          <p className="app-kicker">What This Prevents</p>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Detailed pricing guidance reduces surprises, answers common objections earlier, and keeps the focus on fair quotes instead
            of race-to-the-bottom discount language.
          </p>
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
          <p className="app-kicker">Reassurance</p>
          <div className="mt-5 grid gap-3">
            {reassurances.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[1.4rem] border border-border bg-background px-4 py-4 text-sm font-semibold text-foreground">
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 px-2 pb-4">
          <div className="mx-auto max-w-4xl rounded-[2.4rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(11,111,178,0.12),rgba(255,255,255,0.94)_46%,rgba(56,189,248,0.12))] px-6 py-10 text-center shadow-[0_28px_90px_-48px_rgba(15,23,42,0.34)] sm:px-10">
            <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Get your exact quote</h2>
            <Button asChild size="lg" className="mt-7 rounded-full px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicSiteFooter businessInfo={businessInfo} />
    </div>
  );
}
