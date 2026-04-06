import type { Metadata } from "next";
import { PriceCalculator } from "@/components/price-calculator";
import { SiteHeader } from "@/components/site-header";
import { readPricing } from "@/lib/pricing-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Quote Builder",
};

export default async function QuotePage() {
  const pricing = await readPricing();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="px-4 py-8 sm:py-12">
        <PriceCalculator initialPricing={pricing} />
      </main>
    </div>
  );
}
