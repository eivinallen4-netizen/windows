import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { PublicStockHeroImage } from "@/components/public-stock-hero-image";
import { Button } from "@/components/ui/button";
import { getPublicPageStockHero, PUBLIC_SERVICE_AREA_HUB_CARD_IMAGE } from "@/lib/landing-stock-media";
import { BUSINESS, SERVICE_AREA_LINKS } from "@/lib/marketing-content";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import { buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Window Cleaning Service Areas Las Vegas Valley",
  description:
    "Las Vegas valley service areas we cover, including Las Vegas, Summerlin, Henderson, Green Valley, Centennial Hills, Southern Highlands, Spring Valley, Enterprise, and Skye Canyon.",
  path: "/service-areas",
  keywords: [
    "window cleaning service areas Las Vegas",
    "Las Vegas valley window cleaning",
    "window washing Las Vegas neighborhoods",
  ],
});

export default async function ServiceAreasPage() {
  const businessInfo = await readPublicBusinessSnapshot();
  const hero = getPublicPageStockHero("serviceAreas");

  return (
    <PublicMarketingShell backgroundImageUrl={businessInfo.pageBackdropImageUrl} theme="dark">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Service Areas", path: "/service-areas" },
        ])}
      />
      <PublicSiteHeader theme="dark" />
      <main className="marketing-container py-10 sm:py-14 lg:py-18">
        <section className="marketing-panel-dark px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-4xl space-y-5">
            <span className="marketing-kicker">Service Areas</span>
            <h1 className="marketing-display-lg text-white">
              Local Coverage Across Las Vegas and Nearby Areas
            </h1>
            <p className="max-w-3xl text-base leading-7 text-white/72 sm:text-lg">
              You should see the same service areas and neighborhood names whether you start on the homepage, the footer, or a local
              page—so there is no confusion about coverage before you call.
            </p>
            <Button asChild size="lg" className="marketing-button-primary border-0 px-8 text-base">
              <Link href={BUSINESS.quotePath}>
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <PublicStockHeroImage {...hero} className="mt-8 max-w-4xl" priority />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          {SERVICE_AREA_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="marketing-panel-light overflow-hidden transition hover:border-primary/30"
            >
              <div className="relative h-40 w-full bg-slate-200">
                <Image
                  src={PUBLIC_SERVICE_AREA_HUB_CARD_IMAGE}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent" aria-hidden />
              </div>
              <div className="flex items-start justify-between gap-4 px-6 py-7">
                <div>
                  <p className="marketing-kicker">Featured Area</p>
                  <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground">{link.label}</h2>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    A focused Las Vegas overview with neighborhood context and clear next steps when you need window cleaning in the
                    valley.
                  </p>
                </div>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="size-5" />
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="marketing-panel-light mt-10 px-6 py-7">
          <p className="marketing-kicker">Covered Areas</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {BUSINESS.serviceAreas.map((area) => (
              <span key={area} className="marketing-chip-light">
                {area}
              </span>
            ))}
          </div>
        </section>
      </main>
      <PublicSiteFooter businessInfo={businessInfo} theme="dark" />
    </PublicMarketingShell>
  );
}
