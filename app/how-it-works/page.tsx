import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="app-page-shell-soft">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "How It Works", path: "/how-it-works" },
        ])}
      />
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-18">
        <section className="app-surface-panel px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-3xl space-y-5">
            <span className="app-kicker">How It Works</span>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-foreground sm:text-5xl">
              How Window Cleaning Works, Step by Step
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              From quote request to final walkthrough, the process is designed to stay simple, fast, and easy to approve.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article
              key={step}
              className="rounded-[1.9rem] border border-white/80 bg-white/94 px-6 py-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.28)]"
            >
              <p className="text-sm font-black tracking-[0.24em] text-primary">Step {index + 1}</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-foreground">{step}</h2>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
          <p className="app-kicker">Why It Converts</p>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Clear process pages reduce uncertainty. They also help the site compete with Las Vegas competitors that already explain how
            quotes, scheduling, and service completion work in more detail than a simple hero section.
          </p>
        </section>

        <section className="mt-10 rounded-[2.4rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(11,111,178,0.12),rgba(255,255,255,0.94)_46%,rgba(56,189,248,0.12))] px-6 py-10 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.34)] sm:px-10">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-foreground">You don&apos;t pay until you&apos;re 100% happy</h2>
            <p className="text-base leading-7 text-muted-foreground">
              Walk around with us before anything is finalized.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 text-base">
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
