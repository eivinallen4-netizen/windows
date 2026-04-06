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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(11,111,178,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f3f7fb_55%,_#eef4f8_100%)]">
      <SiteHeader />
      <main className="px-4 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 px-6 py-8 text-center shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur sm:px-10 sm:py-10">
            <div className="mx-auto max-w-3xl space-y-5">
              <span className="inline-flex items-center rounded-full border border-[#0b6fb2]/20 bg-[#0b6fb2]/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#0b6fb2]">
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
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                <Star className="size-4 text-[#0b6fb2]" />
                5-Star Rated
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                <MapPin className="size-4 text-[#0b6fb2]" />
                Locally Trusted
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                <Shield className="size-4 text-[#0b6fb2]" />
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
