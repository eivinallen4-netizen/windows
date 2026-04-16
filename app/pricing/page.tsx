import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { PublicStockHeroImage } from "@/components/public-stock-hero-image";
import { Button } from "@/components/ui/button";
import { getPublicPageStockHero } from "@/lib/landing-stock-media";
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
  const hero = getPublicPageStockHero("pricing");

  return (
    <PublicMarketingShell backgroundImageUrl={businessInfo.pageBackdropImageUrl} theme="dark">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ])}
      />
      <PublicSiteHeader theme="dark" />
      <main className="marketing-container py-10 sm:py-14 lg:py-18">
        <section className="marketing-panel-dark px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-3xl space-y-5">
            <span className="marketing-kicker">Pricing</span>
            <h1 className="marketing-display-lg text-white">
              Simple, Transparent Window Cleaning Pricing in Las Vegas
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
              No surprises, no hidden fees, and no vague “starting at” games before the quote is reviewed.
            </p>
            <Button asChild size="lg" className="marketing-button-primary border-0 px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <PublicStockHeroImage {...hero} className="mt-8 max-w-3xl" priority />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="marketing-panel-light px-6 py-7">
            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground">
              Pricing depends on scope, access, pane count, and the exact service mix
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              We keep pricing fair and clear, then confirm the exact number with you before the job is ever scheduled. That approach
              works for residential window cleaning, commercial window cleaning, exterior-only service, and more detailed glass-cleaning requests.
            </p>
          </div>
          <div className="marketing-panel-light px-6 py-7">
            <p className="marketing-kicker">What Affects Price</p>
            <div className="mt-5 grid gap-3">
              {pricingFactors.map((factor) => (
                <div key={factor} className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-base font-semibold text-foreground">
                  {factor}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-panel-light mt-10 px-6 py-7">
          <p className="marketing-kicker">What This Prevents</p>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Detailed pricing guidance reduces surprises, answers common objections earlier, and keeps the focus on fair quotes instead
            of race-to-the-bottom discount language.
          </p>
        </section>

        <section className="marketing-panel-light mt-10 px-6 py-7">
          <p className="marketing-kicker">Reassurance</p>
          <div className="mt-5 grid gap-3">
            {reassurances.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[1.4rem] border border-border bg-background px-4 py-4 text-sm font-semibold text-foreground">
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 border border-white/12 bg-white/4 px-6 py-10 text-center sm:px-10">
            <h2 className="marketing-display-md text-white">Get your exact quote</h2>
            <Button asChild size="lg" className="marketing-button-primary mt-7 border-0 px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
        </section>
      </main>
      <PublicSiteFooter businessInfo={businessInfo} theme="dark" />
    </PublicMarketingShell>
  );
}
