import type { Metadata } from "next";
import { PriceCalculator } from "@/components/price-calculator";
import { SiteHeader } from "@/components/site-header";
import { MapPin, Shield, Star } from "lucide-react";
import { readPricing } from "@/lib/pricing-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Rep Portal",
};

export default async function HomePage() {
  const pricing = await readPricing();

  return (
    <div className="app-page-shell">
      <SiteHeader />
      <main className="px-4 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="app-surface-panel px-6 py-8 text-center sm:px-10 sm:py-10">
            <div className="mx-auto max-w-3xl space-y-5">
              <span className="app-kicker">
                Rep Portal
              </span>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  Build a clean quote fast and keep the booking moving.
                </h1>
                <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Count panes, add services, and move straight into booking without breaking the flow.
                  The total updates instantly as you work.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="app-chip">
                <Star className="size-4 text-primary" />
                5-Star Rated
              </span>
              <span className="app-chip">
                <MapPin className="size-4 text-primary" />
                Locally Trusted
              </span>
              <span className="app-chip">
                <Shield className="size-4 text-primary" />
                Fully Insured
              </span>
            </div>
          </div>
          <PriceCalculator initialPricing={pricing} variant="light" />
        </div>
      </main>
    </div>
  );
}
