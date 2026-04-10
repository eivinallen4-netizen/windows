import type { Metadata } from "next";
import CustomerQuoteLanding from "./CustomerQuoteLanding";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import { getReviews } from "@/lib/reviews";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Request a Window Cleaning Quote Las Vegas",
  description:
    "Request a Las Vegas window cleaning quote for residential or commercial glass cleaning with clear pricing before scheduling.",
  path: "/customer-quote",
  keywords: [
    "window cleaning quote Las Vegas",
    "residential window cleaning quote Las Vegas",
    "commercial window cleaning quote Las Vegas",
  ],
});

export default async function CustomerQuotePage() {
  const [reviews, businessInfo] = await Promise.all([getReviews(), readPublicBusinessSnapshot()]);

  return <CustomerQuoteLanding reviews={reviews} businessInfo={businessInfo} />;
}
