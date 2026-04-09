import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing",
};

const pricingFactors = [
  "Pane count",
  "Home size",
  "Interior vs exterior",
];

const reassurances = [
  "We confirm exact pricing before anything is scheduled",
  "You approve everything before we start",
];

export default function PricingPage() {
  return (
    <div className="app-page-shell-soft">
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-18">
        <section className="app-surface-panel px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-3xl space-y-5">
            <span className="app-kicker">Pricing</span>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-foreground sm:text-5xl">
              Simple, Transparent Pricing
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              No surprises. No hidden fees.
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
              Most homes fall within a typical range depending on size and service
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              We keep pricing fair and clear, then confirm the exact number with you before the job is ever scheduled.
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
      <PublicSiteFooter />
    </div>
  );
}
