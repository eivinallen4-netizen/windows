import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { Button } from "@/components/ui/button";
import { BUSINESS } from "@/lib/marketing-content";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import { buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About PureBin Window Cleaning Las Vegas",
  description:
    "Learn how PureBin Window Cleaning approaches window cleaning in Las Vegas with clear communication, local service, and approval before payment.",
  path: "/about",
  keywords: ["about window cleaning company Las Vegas", "Las Vegas window cleaning company", "PureBin Window Cleaning"],
});

const values = [
  "Reliable",
  "No shortcuts",
  "Clear communication",
  "Respect for your home",
];

export default async function AboutPage() {
  const businessInfo = await readPublicBusinessSnapshot();

  return (
    <div className="app-page-shell-soft">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-18">
        <section className="app-surface-panel px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-3xl space-y-5">
            <span className="app-kicker">About</span>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-foreground sm:text-5xl">
              A Better Window Cleaning Experience for Las Vegas Homes and Businesses
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Built for property owners who want it done right the first time, with clear expectations before anything is scheduled.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">Our Story</p>
            <p className="mt-4 text-xl font-semibold leading-8 text-foreground">
              We built this service for Las Vegas property owners who are tired of unreliable companies, inconsistent results, and vague pricing.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              We explain the process clearly for residential window cleaning, commercial window cleaning, storefront glass cleaning, and local quote requests across the valley.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Serving Las Vegas since {businessInfo.servingSinceYear}, with a service-area model that starts every job with a call instead of a storefront visit.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">What Matters</p>
            <div className="mt-5 grid gap-3">
              {values.map((value) => (
                <div key={value} className="flex items-center gap-3 rounded-[1.4rem] border border-border bg-background px-4 py-4 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">Local Focus</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground">Local service across the Las Vegas valley</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Consistent contact details matter when you are comparing companies. We keep the business name, phone number, service
              areas, and city references aligned around {BUSINESS.primaryLocation} and nearby areas.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {businessInfo.callOnly ? "Call to book. " : ""}
              {businessInfo.serviceAreaBusiness ? "No storefront at this time." : ""}
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">Explore More</p>
            <div className="mt-5 grid gap-3">
              <Link href="/services" className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-base font-semibold text-foreground transition hover:text-primary">
                Window Cleaning Services
              </Link>
              <Link href="/service-areas/las-vegas" className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-base font-semibold text-foreground transition hover:text-primary">
                Las Vegas Service Area
              </Link>
              <Link href="/reviews" className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-base font-semibold text-foreground transition hover:text-primary">
                Customer Reviews
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[2.4rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(11,111,178,0.12),rgba(255,255,255,0.94)_46%,rgba(56,189,248,0.12))] px-6 py-10 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.34)] sm:px-10">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-foreground">You don&apos;t pay until you&apos;re 100% satisfied</h2>
            <p className="text-base leading-7 text-muted-foreground">
              Every job ends with a walkthrough so you can approve everything before payment.
            </p>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Ready to get started?</p>
            <Button asChild size="lg" className="rounded-full px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicSiteFooter businessInfo={businessInfo} />
    </div>
  );
}
