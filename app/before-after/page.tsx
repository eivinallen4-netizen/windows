import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { PublicStockHeroImage } from "@/components/public-stock-hero-image";
import { Button } from "@/components/ui/button";
import { LANDING_GALLERY_STRIP, getPublicPageStockHero } from "@/lib/landing-stock-media";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import { getReviews } from "@/lib/reviews";
import { buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Before and After Window Cleaning Las Vegas",
  description:
    "See before-and-after window cleaning photos from Las Vegas jobs, including real glass-cleaning results and visible detail work.",
  path: "/before-after",
  keywords: ["before and after window cleaning Las Vegas", "window washing photos Las Vegas", "glass cleaning before after Las Vegas"],
});

const captions = [
  "Hard water removed",
  "Tracks fully cleaned",
  "Crystal clear finish",
];

function isDirectFile(url: string | undefined) {
  if (!url) return false;
  return url.startsWith("/uploads/") || url.startsWith("/api/files?");
}

export default async function BeforeAfterPage() {
  const [reviews, businessInfo] = await Promise.all([getReviews(), readPublicBusinessSnapshot()]);
  const comparisonReviews = reviews.filter((review) => review.houseAfterPhotoUrl).slice(0, 6);
  const hero = getPublicPageStockHero("beforeAfter");

  return (
    <PublicMarketingShell backgroundImageUrl={businessInfo.pageBackdropImageUrl}>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Before & After", path: "/before-after" },
        ])}
      />
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-18">
        <section className="app-surface-panel px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-3xl space-y-5">
            <span className="app-kicker">Before & After</span>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-foreground sm:text-5xl">
              See the Difference
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              From buildup to crystal clear.
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

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {comparisonReviews.length ? (
            comparisonReviews.map((review, index) => (
              <article
                key={review.id}
                className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/94 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.3)]"
              >
                <div className="grid grid-cols-2 gap-px bg-border">
                  <div className="relative aspect-[4/5] bg-slate-100">
                    <Image
                      src={review.houseBeforePhotoUrl}
                      alt={`${review.name} before cleaning`}
                      fill
                      className="object-cover"
                      unoptimized={isDirectFile(review.houseBeforePhotoUrl)}
                      sizes="(max-width: 1024px) 50vw, 20vw"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                      Before
                    </span>
                  </div>
                  <div className="relative aspect-[4/5] bg-slate-100">
                    {review.houseAfterPhotoUrl ? (
                      <Image
                        src={review.houseAfterPhotoUrl}
                        alt={`${review.name} after cleaning`}
                        fill
                        className="object-cover"
                        unoptimized={isDirectFile(review.houseAfterPhotoUrl)}
                        sizes="(max-width: 1024px) 50vw, 20vw"
                      />
                    ) : null}
                    <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground">
                      After
                    </span>
                  </div>
                </div>
                <div className="px-5 py-5">
                  <p className="text-lg font-black text-foreground">{review.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{captions[index % captions.length]}</p>
                </div>
              </article>
            ))
          ) : (
            <div className="space-y-6 lg:col-span-3">
              <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-8 text-sm leading-6 text-muted-foreground shadow-[0_24px_60px_-40px_rgba(15,23,42,0.3)]">
                Before-and-after photo sets will appear here from submitted customer reviews. Example scenes below illustrate bright,
                finished glass until your gallery fills in.
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {LANDING_GALLERY_STRIP.slice(0, 3).map((url) => (
                  <div
                    key={url}
                    className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-white/80 bg-slate-100 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)]"
                  >
                    <Image src={url} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-10 px-2 pb-4">
          <div className="mx-auto max-w-4xl rounded-[2.4rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(11,111,178,0.12),rgba(255,255,255,0.94)_46%,rgba(56,189,248,0.12))] px-6 py-10 text-center shadow-[0_28px_90px_-48px_rgba(15,23,42,0.34)] sm:px-10">
            <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Want results like this?</h2>
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
