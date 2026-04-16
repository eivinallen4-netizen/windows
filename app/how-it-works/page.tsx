import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  title: "How Window Cleaning Works in Las Vegas",
  description:
    "See how the Las Vegas quote-first process works, from request to pricing confirmation to final walkthrough and approval.",
  path: "/how-it-works",
  keywords: ["how window cleaning works Las Vegas", "window cleaning process Las Vegas", "window cleaning quote process Las Vegas"],
});

const steps = [
  "Request a quote",
  "We call and confirm exact pricing",
  "We clean your windows",
  "You walk around and approve before paying",
];

export default async function HowItWorksPage() {
  const businessInfo = await readPublicBusinessSnapshot();
  const hero = getPublicPageStockHero("howItWorks");

  return (
    <PublicMarketingShell backgroundImageUrl={businessInfo.pageBackdropImageUrl} theme="dark">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "How It Works", path: "/how-it-works" },
        ])}
      />
      <PublicSiteHeader theme="dark" />
      <main className="marketing-container py-10 sm:py-14 lg:py-18">
        <section className="marketing-panel-dark px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-3xl space-y-5">
            <span className="marketing-kicker">How It Works</span>
            <h1 className="marketing-display-lg text-white">
              How Window Cleaning Works, Step by Step
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
              From quote request to final walkthrough, the process is designed to stay simple, fast, and easy to approve.
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

        <section className="mt-8 grid gap-4 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step} className="marketing-panel-light px-6 py-6">
              <p className="text-sm font-black tracking-[0.24em] text-primary">Step {index + 1}</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-foreground">{step}</h2>
            </article>
          ))}
        </section>

        <section className="marketing-panel-light mt-10 px-6 py-7">
          <p className="marketing-kicker">Why It Converts</p>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Clear process pages reduce uncertainty. They also help the site compete with Las Vegas competitors that already explain how
            quotes, scheduling, and service completion work in more detail than a simple hero section.
          </p>
        </section>

        <section className="mt-10 border border-white/12 bg-white/4 px-6 py-10 sm:px-10">
          <div className="max-w-3xl space-y-4">
            <h2 className="marketing-display-md text-white">You don&apos;t pay until you&apos;re 100% happy</h2>
            <p className="text-base leading-7 text-white/70">
              Walk around with us before anything is finalized.
            </p>
            <Button asChild size="lg" className="marketing-button-primary border-0 px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicSiteFooter businessInfo={businessInfo} theme="dark" />
    </PublicMarketingShell>
  );
}
