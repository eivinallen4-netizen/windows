import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { PublicStockHeroImage } from "@/components/public-stock-hero-image";
import { CommercialProofSection } from "@/components/commercial-proof-section";
import { Button } from "@/components/ui/button";
import { commercialProofItems } from "@/lib/commercial-proof";
import { LANDING_FORM_HEADER_IMAGE, landingServiceImageForSlug } from "@/lib/landing-stock-media";
import { BUSINESS, SERVICE_LINKS, SERVICE_PAGES } from "@/lib/marketing-content";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import {
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildPageMetadata,
  buildServiceSchema,
  buildWebPageSchema,
} from "@/lib/seo";

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
  const internalLinks = service.internalLinks ?? [
    ...otherServices.map((link) => ({
      href: link.href,
      label: link.label,
      description: "Related PureBin service with more detail for that property type.",
    })),
    {
      href: "/reviews",
      label: "Customer Reviews",
      description: "Review-backed proof from real PureBin customers.",
    },
    {
      href: "/before-after",
      label: "Before & After Photos",
      description: "Visual proof for homeowners and business owners comparing outcomes.",
    },
    {
      href: "/faq",
      label: "Window Cleaning FAQs",
      description: "Pricing, service areas, and common booking questions in one place.",
    },
  ];
  const hasAeoContent = Boolean(service.answerBlock && service.keyTakeaways?.length && service.aeoSections?.length);
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
    ...(hasAeoContent
      ? [
          buildWebPageSchema({
            title: service.title,
            description: service.description,
            path: `/services/${service.slug}`,
            about: [service.title, BUSINESS.primaryLocation, BUSINESS.shortName],
          }),
        ]
      : []),
  ];

  const serviceHeroSrc = landingServiceImageForSlug(service.slug);
  const serviceHeroAlt = `${service.shortLabel} window cleaning — example property`;

  return (
    <PublicMarketingShell backgroundImageUrl={businessInfo.pageBackdropImageUrl}>
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
            {service.answerBlock ? (
              <div className="max-w-3xl rounded-[1.8rem] border border-primary/15 bg-white/82 px-5 py-5 shadow-[0_16px_50px_-40px_rgba(15,23,42,0.4)]">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">At a Glance</p>
                <p className="mt-3 text-base leading-7 text-foreground">{service.answerBlock}</p>
              </div>
            ) : null}
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

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
          <PublicStockHeroImage
            src={serviceHeroSrc}
            alt={serviceHeroAlt}
            className="max-h-[min(44vh,24rem)] w-full lg:min-h-[16rem]"
            sizes="(max-width: 1024px) 100vw, 65vw"
            priority
          />
          <div className="relative hidden min-h-[12rem] overflow-hidden rounded-[2rem] border border-white/80 bg-slate-200 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)] lg:block">
            <Image
              src={LANDING_FORM_HEADER_IMAGE}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 0vw, 32vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-sky-300/20" aria-hidden />
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
              We serve {BUSINESS.primaryLocation} and nearby areas including{" "}
              {BUSINESS.serviceAreas.filter((area) => area !== "Las Vegas").join(", ")}.
            </p>
            <Button asChild variant="outline" className="mt-5 rounded-full px-6">
              <Link href="/service-areas/las-vegas">View Las Vegas Service Area Page</Link>
            </Button>
          </div>
        </section>

        {hasAeoContent && service.keyTakeaways ? (
          <section className="mt-10 rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">Key Takeaways</p>
            <div className="mt-5 grid gap-3">
              {service.keyTakeaways.map((takeaway) => (
                <div
                  key={takeaway}
                  className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-sm font-semibold leading-6 text-foreground"
                >
                  {takeaway}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {hasAeoContent && service.aeoSections ? (
          <section className="mt-10 grid gap-5">
            {service.aeoSections.map((section) => (
              <article
                key={section.heading}
                className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]"
              >
                <h2 className="text-3xl font-black tracking-tight text-foreground">{section.heading}</h2>
                <p className="mt-4 text-base leading-7 text-foreground">{section.directAnswer}</p>
                <div className="mt-5 grid gap-3">
                  {section.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="flex items-start gap-3 rounded-[1.4rem] border border-border bg-background px-4 py-4 text-sm font-semibold leading-6 text-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-4">
                  <div className="rounded-[1.4rem] border border-border bg-background px-4 py-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Supporting Explanation</p>
                    <p className="mt-2 text-base leading-7 text-muted-foreground">{section.supportingExplanation}</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-border bg-background px-4 py-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Real-World Example</p>
                    <p className="mt-2 text-base leading-7 text-muted-foreground">{section.realWorldExample}</p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
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
        )}

        {hasAeoContent && service.comparisonTable ? (
          <section className="mt-10 rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">Comparison Table</p>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-[1.4rem] border border-border bg-background text-left">
                <caption className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {service.comparisonTable.caption}
                </caption>
                <thead>
                  <tr className="border-b border-border">
                    {service.comparisonTable.columns.map((column) => (
                      <th key={column} className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {service.comparisonTable.rows.map((row) => (
                    <tr key={row.topic} className="align-top">
                      <th className="border-b border-border px-4 py-4 text-sm font-semibold text-foreground">{row.topic}</th>
                      <td className="border-b border-border px-4 py-4 text-sm leading-6 text-muted-foreground">{row.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

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
              {internalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-[1.4rem] border border-border bg-background px-4 py-4 transition hover:border-primary/30 hover:text-primary"
                >
                  <span className="block text-base font-semibold text-foreground">{link.label}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">{link.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {hasAeoContent && service.externalSources?.length ? (
          <section className="mt-10 rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">Helpful References</p>
            <div className="mt-5 grid gap-3">
              {service.externalSources.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[1.4rem] border border-border bg-background px-4 py-4 transition hover:border-primary/30 hover:text-primary"
                >
                  <span className="block text-base font-semibold text-foreground">{source.label}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">{source.description}</span>
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <PublicSiteFooter businessInfo={businessInfo} />
    </PublicMarketingShell>
  );
}
