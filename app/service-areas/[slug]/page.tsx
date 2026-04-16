import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { PublicStockHeroImage } from "@/components/public-stock-hero-image";
import { Button } from "@/components/ui/button";
import { getPublicPageStockHero, landingServiceImageForSlug } from "@/lib/landing-stock-media";
import { BUSINESS, SERVICE_AREA_PAGES, SERVICE_LINKS } from "@/lib/marketing-content";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import { buildBreadcrumbSchema, buildFAQSchema, buildPageMetadata } from "@/lib/seo";

type ServiceAreaPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SERVICE_AREA_PAGES.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: ServiceAreaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const area = SERVICE_AREA_PAGES.find((entry) => entry.slug === slug);

  if (!area) {
    return {};
  }

  return buildPageMetadata({
    title: area.title,
    description: area.description,
    path: `/service-areas/${area.slug}`,
    keywords: [...area.keywords],
  });
}

export default async function ServiceAreaPage({ params }: ServiceAreaPageProps) {
  const { slug } = await params;
  const area = SERVICE_AREA_PAGES.find((entry) => entry.slug === slug);
  const businessInfo = await readPublicBusinessSnapshot();

  if (!area) {
    notFound();
  }

  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Service Areas", path: "/service-areas" },
      { name: area.title, path: `/service-areas/${area.slug}` },
    ]),
    buildFAQSchema(area.faq),
  ];

  const hero = getPublicPageStockHero("serviceAreaLocal");
  const heroVisual = landingServiceImageForSlug("residential-window-cleaning");

  return (
    <PublicMarketingShell backgroundImageUrl={businessInfo.pageBackdropImageUrl} theme="dark">
      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}
      <PublicSiteHeader theme="dark" />
      <main className="marketing-container py-10 sm:py-14 lg:py-18">
        <section className="marketing-panel-dark px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-4xl space-y-5">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="transition hover:text-primary">
                Home
              </Link>
              <span>/</span>
              <Link href="/service-areas" className="transition hover:text-primary">
                Service Areas
              </Link>
              <span>/</span>
              <span className="text-foreground">{area.title.replace(", NV", "")}</span>
            </nav>
            <span className="marketing-kicker">Local Page</span>
            <h1 className="marketing-display-lg text-white">{area.title}</h1>
            <p className="max-w-3xl text-base leading-7 text-white/72 sm:text-lg">{area.intro}</p>
            <p className="max-w-3xl text-base leading-7 text-white/68">
              Serving Las Vegas since {businessInfo.servingSinceYear}. {businessInfo.callOnly ? "Call to book." : ""} {businessInfo.serviceAreaBusiness ? "No storefront at this time." : ""}
            </p>
            <Button asChild size="lg" className="marketing-button-primary border-0 px-8 text-base">
              <Link href={BUSINESS.quotePath}>
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
            <PublicStockHeroImage {...hero} className="max-lg:max-h-[min(34vh,18rem)] w-full lg:min-h-[14rem]" priority />
            <div className="relative hidden min-h-[12rem] overflow-hidden rounded-[2rem] border border-white/80 bg-slate-200 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.3)] lg:block">
              <Image
                src={heroVisual}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 0vw, 36vw"
              />
              <div className="absolute inset-0 bg-gradient-to-tl from-primary/25 via-transparent to-sky-300/15" aria-hidden />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">Nearby Areas</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {area.neighborhoods.map((neighborhood) => (
                <div key={neighborhood} className="flex items-center gap-3 rounded-[1.4rem] border border-border bg-background px-4 py-4 text-sm font-semibold text-foreground">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  <span>{neighborhood}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">Service Match</p>
            <div className="mt-5 grid gap-3">
              {SERVICE_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center gap-3 rounded-[1.4rem] border border-border bg-background px-4 py-4 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary">
                  <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-5">
          {area.sections.map((section) => (
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

        <section className="mt-10 rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
          <p className="app-kicker">Las Vegas FAQ</p>
          <div className="mt-5 grid gap-4">
            {area.faq.map((item) => (
              <article key={item.question} className="rounded-[1.4rem] border border-border bg-background px-4 py-4">
                <h2 className="text-xl font-black tracking-tight text-foreground">{item.question}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <PublicSiteFooter businessInfo={businessInfo} theme="dark" />
    </PublicMarketingShell>
  );
}
