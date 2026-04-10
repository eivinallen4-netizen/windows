import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { Button } from "@/components/ui/button";
import { BUSINESS, SERVICE_AREA_LINKS } from "@/lib/marketing-content";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import { buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Window Cleaning Service Areas Las Vegas Valley",
  description:
    "See the Las Vegas valley service areas highlighted on the site, including Las Vegas, Summerlin, Henderson, Green Valley, Centennial Hills, Southern Highlands, Spring Valley, Enterprise, and Skye Canyon.",
  path: "/service-areas",
  keywords: [
    "window cleaning service areas Las Vegas",
    "Las Vegas valley window cleaning",
    "window washing Las Vegas neighborhoods",
  ],
});

export default async function ServiceAreasPage() {
  const businessInfo = await readPublicBusinessSnapshot();

  return (
    <div className="app-page-shell-soft">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Service Areas", path: "/service-areas" },
        ])}
      />
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-18">
        <section className="app-surface-panel px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-4xl space-y-5">
            <span className="app-kicker">Service Areas</span>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-foreground sm:text-5xl">
              Local Coverage Across Las Vegas and Nearby Areas
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              Local SEO works better when service-area language is consistent across the homepage, footer, schema, and supporting
              landing pages. This section keeps those signals aligned.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 text-base">
              <Link href={BUSINESS.quotePath}>
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          {SERVICE_AREA_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)] transition hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="app-kicker">Featured Area</p>
                  <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground">{link.label}</h2>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    Dedicated local landing-page content for the main target market, built to support ranking improvements for
                    window cleaning Las Vegas and related local variations.
                  </p>
                </div>
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="size-5" />
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
          <p className="app-kicker">Covered Areas</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {BUSINESS.serviceAreas.map((area) => (
              <span key={area} className="app-chip">
                {area}
              </span>
            ))}
          </div>
        </section>
      </main>
      <PublicSiteFooter businessInfo={businessInfo} />
    </div>
  );
}
