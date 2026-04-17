import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import CustomerQuoteLanding from "@/app/customer-quote/CustomerQuoteLanding";
import { CORE_FAQS } from "@/lib/marketing-content";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import { getReviews } from "@/lib/reviews";
import { buildFAQSchema, buildLocalBusinessSchema, buildPageMetadata, buildServiceSchema } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Window Cleaning Las Vegas",
  description:
    "You need Your windows cleaned. We show everyone else on the block shiny your windows can get.",
  path: "/",
  keywords: [
    "window cleaning Las Vegas",
    "Las Vegas window washing",
    "residential window cleaning Las Vegas",
    "commercial window cleaning Las Vegas",
    "storefront window cleaning Las Vegas",
  ],
});

export default async function HomePage() {
  const [reviews, businessInfo] = await Promise.all([getReviews(), readPublicBusinessSnapshot()]);
  const homepageFaqs = CORE_FAQS.slice(0, 6);

  return (
    <>
      <JsonLd data={buildLocalBusinessSchema(reviews, businessInfo)} />
      <JsonLd
        data={buildServiceSchema({
          name: "Window Cleaning Las Vegas",
          description:
            "Window cleaning in Las Vegas for residential, commercial, storefront, and difficult-access properties with quote-first scheduling.",
          path: "/",
        })}
      />
      <JsonLd data={buildFAQSchema(homepageFaqs)} />
      <CustomerQuoteLanding reviews={reviews} businessInfo={businessInfo} />
    </>
  );
}
