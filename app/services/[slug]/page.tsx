import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { CommercialProofSection } from "@/components/commercial-proof-section";
import { Button } from "@/components/ui/button";
import { commercialProofItems } from "@/lib/commercial-proof";
import { BUSINESS, SERVICE_LINKS, SERVICE_PAGES } from "@/lib/marketing-content";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import { buildBreadcrumbSchema, buildFAQSchema, buildPageMetadata, buildServiceSchema } from "@/lib/seo";

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SERVICE_PAGES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICE_PAGES.find((entry) => entry.slug === slug);

  if (!service) {
    return {};
  }

  return buildPageMetadata({
    title: service.title,
    description: service.description,
    path: `/services/${service.slug}`,
    keywords: [...service.keywords],
  });
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = SERVICE_PAGES.find((entry) => entry.slug === slug);
  const businessInfo = await readPublicBusinessSnapshot();

  if (!service) {
    notFound();
  }

  const otherServices = SERVICE_LINKS.filter((link) => link.href !== `/services/${service.slug}`);
  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
      { name: service.title, path: `/services/${service.slug}` },
    ]),
    buildServiceSchema({
      name: service.title,
      description: service.description,
      path: `/services/${service.slug}`,
    }),
    buildFAQSchema(service.faq),
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
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="transition hover:text-primary">
                Home
              </Link>
              <span>/</span>
              <Link href="/services" className="transition hover:text-primary">
                Services
              </Link>
              <span>/</span>
              <span className="text-foreground">{service.shortLabel}</span>
            </nav>
            <span className="app-kicker">{service.shortLabel}</span>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-foreground sm:text-5xl">{service.title}</h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{service.intro}</p>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">{service.summary}</p>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Serving Las Vegas since {businessInfo.servingSinceYear}. {businessInfo.callOnly ? "Call to book." : ""} {businessInfo.serviceAreaBusiness ? "No storefront at this time." : ""}
            </p>
            <Button asChild size="lg" className="rounded-full px-8 text-base">
              <Link href={BUSINESS.quotePath}>
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">Highlights</p>
            <div className="mt-5 grid gap-3">
              {service.highlights.map((highlight) => (
                <div key={highlight} className="flex items-center gap-3 rounded-[1.4rem] border border-border bg-background px-4 py-4 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">Service Area</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground">Local relevance across the Las Vegas valley</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              This service page supports search visibility for {BUSINESS.primaryLocation} and nearby areas including{" "}
              {BUSINESS.serviceAreas.filter((area) => area !== "Las Vegas").join(", ")}.
            </p>
            <Button asChild variant="outline" className="mt-5 rounded-full px-6">
              <Link href="/service-areas/las-vegas">View Las Vegas Service Area Page</Link>
            </Button>
          </div>
        </section>

        <section className="mt-10 grid gap-5">
          {service.sections.map((section) => (
            <article
              key={section.heading}
              className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]"
            >
              <h2 className="text-3xl font-black tracking-tight text-foreground">{section.heading}</h2>
              <div className="mt-4 grid gap-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-7 text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </section>

        <CommercialProofSection
          enabled={businessInfo.commercialProofEnabled}
          items={commercialProofItems.filter((item) =>
            service.slug === "commercial-window-cleaning"
              ? item.propertyType.toLowerCase().includes("commercial") || item.propertyType.toLowerCase().includes("storefront")
              : service.slug === "high-rise-window-cleaning"
                ? item.propertyType.toLowerCase().includes("high-rise")
                : false,
          )}
        />

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">FAQs</p>
            <div className="mt-5 grid gap-4">
              {service.faq.map((item) => (
                <article key={item.question} className="rounded-[1.4rem] border border-border bg-background px-4 py-4">
                  <h2 className="text-xl font-black tracking-tight text-foreground">{item.question}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">Related Pages</p>
            <div className="mt-5 grid gap-3">
              {otherServices.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-base font-semibold text-foreground transition hover:border-primary/30 hover:text-primary">
                  {link.label}
                </Link>
              ))}
              <Link href="/reviews" className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-base font-semibold text-foreground transition hover:border-primary/30 hover:text-primary">
                Customer Reviews
              </Link>
              <Link href="/before-after" className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-base font-semibold text-foreground transition hover:border-primary/30 hover:text-primary">
                Before &amp; After Photos
              </Link>
              <Link href="/faq" className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-base font-semibold text-foreground transition hover:border-primary/30 hover:text-primary">
                Window Cleaning FAQs
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicSiteFooter businessInfo={businessInfo} />
    </div>
  );
}
