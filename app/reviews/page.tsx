import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home, MapPin } from "lucide-react";
import { PublicSiteHeader } from "@/components/public-site-header";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { getReviews } from "@/lib/reviews";
import { getPublicArea } from "@/lib/public-site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Reviews",
};

function isDirectFile(url: string | undefined) {
  if (!url) return false;
  return url.startsWith("/uploads/") || url.startsWith("/api/files?");
}

export default async function ReviewsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName())?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken) : null;
  const reviews = await getReviews();
  const featuredReviews = reviews.length ? reviews : [];

  return (
    <div className="app-page-shell-soft">
      {session ? <SiteHeader /> : <PublicSiteHeader />}
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-18">
        <section className="app-surface-panel px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-3xl space-y-5">
            <h1 className="text-4xl font-black tracking-[-0.05em] text-foreground sm:text-5xl">
              See Why Homeowners Across Las Vegas Trust Us
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Real results. Real homes. No streaks, no hassle.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          {featuredReviews.length ? (
            featuredReviews.map((review, index) => (
              <article
                key={review.id}
                className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/94 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.3)]"
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
            <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-8 text-sm leading-6 text-muted-foreground shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)] lg:col-span-3">
              Customer reviews will appear here as new jobs are completed.
            </div>
          )}
        </section>

        <section className="mt-10 rounded-[2.25rem] border border-white/80 bg-white/92 px-6 py-8 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.28)] sm:px-8">
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

        <section className="mt-10 px-2 pb-4">
          <div className="mx-auto max-w-4xl rounded-[2.4rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(11,111,178,0.12),rgba(255,255,255,0.94)_46%,rgba(56,189,248,0.12))] px-6 py-10 text-center shadow-[0_28px_90px_-48px_rgba(15,23,42,0.34)] sm:px-10">
            <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Want the same results?</h2>
            <Button asChild size="lg" className="mt-7 rounded-full px-8 text-base">
              <Link href="/#quote-form">
                Request a Call
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
