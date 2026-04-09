import type { Metadata } from "next";
import CustomerQuoteLanding from "@/app/customer-quote/CustomerQuoteLanding";
import { getReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Window Cleaning Las Vegas",
};

export default async function HomePage() {
  const reviews = await getReviews();

  return <CustomerQuoteLanding reviews={reviews} />;
}
