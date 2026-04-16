import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home, MapPin } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { PublicSiteHeader } from "@/components/public-site-header";
import { PublicStockHeroImage } from "@/components/public-stock-hero-image";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { LANDING_GALLERY_STRIP, getPublicPageStockHero } from "@/lib/landing-stock-media";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import { getReviews } from "@/lib/reviews";
import { getPublicArea } from "@/lib/public-site";
import { buildBreadcrumbSchema, buildLocalBusinessSchema, buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Window Cleaning Reviews Las Vegas",
  description:
    "Read Las Vegas window cleaning reviews, testimonials, and before-and-after results from completed jobs across the valley.",
  path: "/reviews",
  keywords: ["window cleaning reviews Las Vegas", "Las Vegas window washing reviews", "window cleaning testimonials Las Vegas"],
});

function isDirectFile(url: string | undefined) {
  if (!url) return false;
  return url.startsWith("/uploads/") || url.startsWith("/api/files?");
}

export default async function ReviewsPage() {
  const [reviews, businessInfo] = await Promise.all([getReviews(), readPublicBusinessSnapshot()]);
  const featuredReviews = reviews.length ? reviews : [];
  const hero = getPublicPageStockHero("reviews");

  return (
    <PublicMarketingShell backgroundImageUrl={businessInfo.pageBackdropImageUrl} theme="dark">
      <JsonLd data={buildLocalBusinessSchema(reviews, businessInfo)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Reviews", path: "/reviews" },
        ])}
      />
      <PublicSiteHeader theme="dark" />
      <main className="marketing-container py-10 sm:py-14 lg:py-18">
        <section className="marketing-panel-dark px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-3xl space-y-5">
            <span className="marketing-kicker">Reviews</span>
            <h1 className="marketing-display-lg text-white">
              See Why Homeowners Across Las Vegas Trust Us
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
              Real results. Real homes. No streaks, no hassle.
            </p>
            <Button asChild size="lg" className="marketing-button-primary border-0 px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <PublicStockHeroImage {...hero} className="mt-8 max-w-3xl" priority />
        </section>

        <section
          className={
            featuredReviews.length === 1
              ? "mt-8 grid gap-5 lg:grid-cols-1 lg:justify-items-center"
              : "mt-8 grid gap-5 lg:grid-cols-2"
          }
        >
          {featuredReviews.length ? (
            featuredReviews.map((review, index) => (
              <article
                key={review.id}
                className={
                  featuredReviews.length === 1
                    ? "marketing-panel-light w-full max-w-2xl overflow-hidden"
                    : "marketing-panel-light overflow-hidden"
                }
              >
                {review.houseAfterPhotoUrl ? (
                  <div className="grid grid-cols-2 gap-px bg-border">
                    <div className="relative aspect-[4/5] bg-slate-100">
                      <Image
                        src={review.houseBeforePhotoUrl}
                        alt={`${review.name} before cleaning`}
                        fill
                        className="object-cover"
                        unoptimized={isDirectFile(review.houseBeforePhotoUrl)}
                        sizes="(max-width: 1024px) 50vw, 25vw"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                        Before
                      </span>
                    </div>
                    <div className="relative aspect-[4/5] bg-slate-100">
                      <Image
                        src={review.houseAfterPhotoUrl}
                        alt={`${review.name} after cleaning`}
                        fill
                        className="object-cover"
                        unoptimized={isDirectFile(review.houseAfterPhotoUrl)}
                        sizes="(max-width: 1024px) 50vw, 25vw"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground">
                        After
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-[16/10] bg-slate-100">
                    <Image
                      src={review.houseBeforePhotoUrl}
                      alt={`${review.name} home after service`}
                      fill
                      className="object-cover"
                      unoptimized={isDirectFile(review.houseBeforePhotoUrl)}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                )}

                <div className="space-y-4 px-6 py-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-black text-foreground">{review.name}</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="size-4 text-primary" />
                        {getPublicArea(index)}
                      </p>
                    </div>
                    <StarRating rating={review.rating} className="text-amber-500" />
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {review.testimonial || "Windows looked crystal clear, the details were handled right, and the whole process felt easy from start to finish."}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full space-y-6">
              <div className="marketing-panel-light px-6 py-8 text-sm leading-6 text-muted-foreground">
                Customer reviews will appear here as new jobs are completed. Example photography below shows the kind of results we
                highlight on the site.
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

        <section className="marketing-panel-light mt-10 px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-foreground">Hundreds of homes cleaned across Las Vegas</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Homeowners call us when they want clear communication, clean glass, and a job approved before payment.
              </p>
            </div>
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Home className="size-6" />
            </div>
          </div>
        </section>

        <section className="mt-10 border border-white/12 bg-white/4 px-6 py-10 text-center sm:px-10">
            <h2 className="marketing-display-md text-white">Want the same results?</h2>
            <Button asChild size="lg" className="marketing-button-primary mt-7 border-0 px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
        </section>
      </main>

      <PublicSiteFooter businessInfo={businessInfo} theme="dark" />
    </PublicMarketingShell>
  );
}
