import type { Metadata } from "next";
import CustomerQuoteLanding from "./CustomerQuoteLanding";
import { getReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Request Your Quote",
};

export default async function CustomerQuotePage() {
  const reviews = await getReviews();

  return <CustomerQuoteLanding reviews={reviews} />;
}
