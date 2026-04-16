import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { PublicStockHeroImage } from "@/components/public-stock-hero-image";
import { Button } from "@/components/ui/button";
import { getPublicPageStockHero } from "@/lib/landing-stock-media";
import { CORE_FAQS } from "@/lib/marketing-content";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import { buildBreadcrumbSchema, buildFAQSchema, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Window Cleaning FAQ Las Vegas",
  description:
    "Answers to common Las Vegas window cleaning questions about pricing, service areas, screens, tracks, commercial work, and quote timing.",
  path: "/faq",
  keywords: ["window cleaning FAQ Las Vegas", "window cleaning questions Las Vegas", "Las Vegas window washing FAQ"],
});

export default async function FaqPage() {
  const businessInfo = await readPublicBusinessSnapshot();
  const hero = getPublicPageStockHero("faq");

  return (
    <PublicMarketingShell backgroundImageUrl={businessInfo.pageBackdropImageUrl} theme="dark">
      <JsonLd data={buildFAQSchema(CORE_FAQS)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ])}
      />
      <PublicSiteHeader theme="dark" />
      <main className="marketing-container py-10 sm:py-14 lg:py-18">
        <section className="marketing-panel-dark px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-3xl space-y-5">
            <span className="marketing-kicker">FAQ</span>
            <h1 className="marketing-display-lg text-white">
              Las Vegas Window Cleaning Questions, Answered
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
              Straight answers reduce back-and-forth and give homeowners and business owners a clearer path to booking.
            </p>
            <Button asChild size="lg" className="marketing-button-primary border-0 px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <PublicStockHeroImage {...hero} className="mt-8 max-w-3xl" priority />
        </section>

        <section className="mt-8 grid gap-4">
          {CORE_FAQS.map((faq) => (
            <article key={faq.question} className="marketing-panel-light px-6 py-6">
              <h2 className="text-2xl font-black tracking-tight text-foreground">{faq.question}</h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">{faq.answer}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 border border-white/12 bg-white/4 px-6 py-10 text-center sm:px-10">
            <p className="marketing-kicker">Still Have Questions?</p>
            <h2 className="marketing-display-md mt-4 text-white">Still have questions?</h2>
            <Button asChild size="lg" className="marketing-button-primary mt-7 border-0 px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
        </section>
      </main>
      <PublicSiteFooter businessInfo={businessInfo} theme="dark" />
    </PublicMarketingShell>
  );
}
