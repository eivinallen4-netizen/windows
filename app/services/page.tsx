import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { PublicStockHeroImage } from "@/components/public-stock-hero-image";
import { Button } from "@/components/ui/button";
import { getPublicPageStockHero, landingServiceImageForSlug } from "@/lib/landing-stock-media";
import { BUSINESS, SERVICE_LINKS, SERVICE_PAGES, TRUST_POINTS } from "@/lib/marketing-content";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import { buildBreadcrumbSchema, buildPageMetadata, buildServiceSchema } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Window Cleaning Services Las Vegas",
  description:
    "Residential, commercial, storefront, and high-rise window cleaning in Las Vegas with clear scopes, quote-first scheduling, and approval before payment.",
  path: "/services",
  keywords: [
    "window cleaning services Las Vegas",
    "residential window cleaning Las Vegas",
    "commercial window cleaning Las Vegas",
    "high-rise window cleaning Las Vegas",
  ],
});

export default async function ServicesPage() {
  const businessInfo = await readPublicBusinessSnapshot();
  const hero = getPublicPageStockHero("services");
  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
    ]),
    ...SERVICE_PAGES.map((service) =>
      buildServiceSchema({
        name: service.title,
        description: service.description,
        path: `/services/${service.slug}`,
      }),
    ),
  ];

  return (
    <PublicMarketingShell backgroundImageUrl={businessInfo.pageBackdropImageUrl}>
      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-18">
        <section className="app-surface-panel px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-4xl space-y-5">
            <span className="app-kicker">Services</span>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-foreground sm:text-5xl">
              Window Cleaning Services for Las Vegas Homes and Businesses
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              Dedicated pages for homeowners, businesses, storefronts, and difficult-access jobs so you can read the right details
              and request a quote without guessing which service fits.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 text-base">
              <Link href={BUSINESS.quotePath}>
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <PublicStockHeroImage {...hero} className="mt-8 max-w-4xl" priority />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {SERVICE_PAGES.map((service) => (
            <article
              key={service.slug}
              className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/94 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]"
            >
              <div className="relative h-40 w-full bg-slate-200">
                <Image
                  src={landingServiceImageForSlug(service.slug)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/25 to-transparent" aria-hidden />
              </div>
              <div className="px-6 py-7">
              <p className="app-kicker">{service.shortLabel}</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground">{service.title}</h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">{service.summary}</p>
              <div className="mt-5 grid gap-3">
                {service.highlights.map((highlight) => (
                  <div key={highlight} className="flex items-center gap-3 rounded-[1.4rem] border border-border bg-background px-4 py-4 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="size-5 shrink-0 text-primary" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
              <Button asChild className="mt-6 rounded-full px-6">
                <Link href={`/services/${service.slug}`}>
                  Read More
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">Why Separate Pages</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground">Find the service that matches your property</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Residential glass, storefronts, offices, and high-access buildings are not the same job. When each has its own page,
              you see the right scope, safety notes, and expectations before you call.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              That clarity saves time for homeowners and facility managers alike—especially in a market with this much commercial and
              mixed-use glass.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Serving Las Vegas since {businessInfo.servingSinceYear}. {businessInfo.callOnly ? "Call to book." : ""} {businessInfo.serviceAreaBusiness ? "No storefront at this time." : ""}
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">Trust Signals</p>
            <div className="mt-5 grid gap-3">
              {TRUST_POINTS.map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-base font-semibold text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[2.4rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(11,111,178,0.12),rgba(255,255,255,0.94)_46%,rgba(56,189,248,0.12))] px-6 py-10 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.34)] sm:px-10">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Explore More</p>
            <h2 className="text-4xl font-black tracking-tight text-foreground">Related pages that round out the picture</h2>
            <p className="text-base leading-7 text-muted-foreground">
              Reviews, FAQs, before-and-after photos, and the Las Vegas service-area overview all add context next to these service
              pages—so you can book with fewer open questions.
            </p>
            <div className="flex flex-wrap gap-3">
              {SERVICE_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="app-link-pill">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PublicSiteFooter businessInfo={businessInfo} />
    </PublicMarketingShell>
  );
}
