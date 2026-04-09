import type { Metadata } from "next";
import { ArrowRight, MapPin, Shield, Star } from "lucide-react";
import { PriceCalculator } from "@/components/price-calculator";
import { SiteHeader } from "@/components/site-header";
import { readPricing } from "@/lib/pricing-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Rep Quote Builder",
};

const trustPoints = [
  {
    label: "5-Star Rated",
    icon: Star,
  },
  {
    label: "Las Vegas Local",
    icon: MapPin,
  },
  {
    label: "Pay After Approval",
    icon: Shield,
  },
];

export default async function RepQuotePage() {
  const pricing = await readPricing();

  return (
    <div className="app-page-shell">
      <SiteHeader />
      <main className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mx-auto w-full max-w-7xl space-y-8">
          <section className="app-surface-panel px-6 py-8 sm:px-10 sm:py-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:items-end">
              <div className="space-y-5">
                <span className="app-kicker">Quote Builder</span>
                <div className="max-w-3xl space-y-4">
                  <h1 className="text-4xl font-black tracking-[-0.05em] text-foreground sm:text-5xl">
                    Build the quote while the homeowner is ready to say yes
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                    Keep the pitch clear, show a clean estimate fast, and move straight into booking while the confidence is high.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trustPoints.map((item) => {
                    const Icon = item.icon;
                    return (
                      <span key={item.label} className="app-chip">
                        <Icon className="size-4 text-primary" />
                        {item.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(11,111,178,0.12),rgba(255,255,255,0.96)_46%,rgba(56,189,248,0.12))] px-6 py-6 shadow-[0_22px_70px_-42px_rgba(15,23,42,0.28)]">
                <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground">
                  Sell the clarity, not just the price
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Confirm the scope, show the total live, and remind them they approve everything before they pay.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  <ArrowRight className="size-4" />
                  Use the calculator below, then continue straight to booking
                </div>
              </div>
            </div>
          </section>

          <section>
            <PriceCalculator initialPricing={pricing} variant="light" mode="portal" />
          </section>
        </div>
      </main>
    </div>
  );
}
