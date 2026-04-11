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
    <PublicMarketingShell backgroundImageUrl={businessInfo.pageBackdropImageUrl}>
      <JsonLd data={buildFAQSchema(CORE_FAQS)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ])}
      />
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-18">
        <section className="app-surface-panel px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-3xl space-y-5">
            <span className="app-kicker">FAQ</span>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-foreground sm:text-5xl">
              Las Vegas Window Cleaning Questions, Answered
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Straight answers reduce back-and-forth and give homeowners and business owners a clearer path to booking.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 text-base">
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
            <article
              key={faq.question}
              className="rounded-[1.9rem] border border-white/80 bg-white/94 px-6 py-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.28)]"
            >
              <h2 className="text-2xl font-black tracking-tight text-foreground">{faq.question}</h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">{faq.answer}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 px-2 pb-4">
          <div className="mx-auto max-w-4xl rounded-[2.4rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(11,111,178,0.12),rgba(255,255,255,0.94)_46%,rgba(56,189,248,0.12))] px-6 py-10 text-center shadow-[0_28px_90px_-48px_rgba(15,23,42,0.34)] sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Still Have Questions?</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-5xl">Still have questions?</h2>
            <Button asChild size="lg" className="mt-7 rounded-full px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicSiteFooter businessInfo={businessInfo} />
    </PublicMarketingShell>
  );
}
