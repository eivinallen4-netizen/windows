import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { Button } from "@/components/ui/button";
import { BUSINESS, SERVICE_LINKS, SERVICE_PAGES, TRUST_POINTS } from "@/lib/marketing-content";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import { buildBreadcrumbSchema, buildPageMetadata, buildServiceSchema } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Window Cleaning Services Las Vegas",
  description:
    "Explore residential, commercial, storefront, and high-rise window cleaning content built for Las Vegas search intent and quote-first conversions.",
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
    <div className="app-page-shell-soft">
      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-18">
        <section className="app-surface-panel px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-4xl space-y-5">
            <span className="app-kicker">Services</span>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-foreground sm:text-5xl">
              Window Cleaning Services Built for Las Vegas Search Intent
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              The public site now has dedicated service pages for homeowners, businesses, storefronts, and difficult-access
              requests so Google can understand the service mix more clearly and visitors can find the right page faster.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 text-base">
              <Link href={BUSINESS.quotePath}>
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {SERVICE_PAGES.map((service) => (
            <article
              key={service.slug}
              className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]"
            >
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
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">What Helps Rankings</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground">Why this service architecture matters</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Competitors ranking well in Las Vegas give Google more than a branded homepage. They publish service-specific
              pages, mention commercial and residential use cases directly, and build out supporting content around service
              categories and local intent.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              These pages give your site the same structural advantage while keeping the language original and more conversion-focused.
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
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Internal Linking</p>
            <h2 className="text-4xl font-black tracking-tight text-foreground">Keep the service cluster tightly connected</h2>
            <p className="text-base leading-7 text-muted-foreground">
              Every service page should link back to the homepage, the Las Vegas service-area page, reviews, before-and-after proof,
              FAQ content, and the other core service pages. That internal structure helps both rankings and conversions.
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
    </div>
  );
}
