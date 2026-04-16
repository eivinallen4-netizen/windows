
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Glasses,
  Handshake,
  Home,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/star-rating";
import {
  LANDING_ACCENT_BACKGROUNDS,
  LANDING_HERO_IMAGE,
  LANDING_INCLUDED_IMAGES,
  landingServiceImageForSlug,
} from "@/lib/landing-stock-media";
import { BUSINESS } from "@/lib/marketing-content";
import type { Review } from "@/lib/reviews";

type CustomerQuoteLandingProps = {
  reviews: Review[];
  businessInfo: {
    servingSinceYear: number;
    callOnly: boolean;
    serviceAreaBusiness: boolean;
    licenseStatusPublic: boolean;
    insuredPublic: boolean;
    publishedHoursSummary: readonly string[];
    sameAs: readonly string[];
    shortName: string;
    phone: string;
    phoneDisplay: string;
    primaryLocation: string;
    serviceAreas: readonly string[];
    heroBackgroundImageUrl?: string;
    pageBackdropImageUrl?: string;
    serviceSectionImageUrls?: readonly string[];
    randomBackgroundImageUrls?: readonly string[];
  };
};

type LeadFormState = {
  contactFullName: string;
  phone: string;
  address: string;
  requestDetails: string;
};

const initialState: LeadFormState = {
  contactFullName: "",
  phone: "",
  address: "",
  requestDetails: "",
};

const includedServiceCards = [
  {
    title: "Outside Window Cleaning",
    description: "Remove dirt, dust, and hard water stains from the outside of your windows.",
    icon: Home,
    image: LANDING_INCLUDED_IMAGES[0],
  },
  {
    title: "Tracks, Screens & Frames",
    description: "We clean window tracks, wipe frames, and rinse screens for a full finish.",
    icon: Handshake,
    image: LANDING_INCLUDED_IMAGES[1],
  },
  {
    title: "Inside & Outside Glass",
    description: "Streak-free cleaning on both sides so your windows shine from every angle.",
    icon: Glasses,
    image: LANDING_INCLUDED_IMAGES[2],
  },
] as const;

const propertyServiceCards = [
  {
    title: "Home Window Cleaning",
    description: "Brighten your home with clean, streak-free windows. Safe, careful, and detailed.",
    href: "/services/residential-window-cleaning",
    cta: "Get My Home Quote",
    icon: Home,
    image: landingServiceImageForSlug("residential-window-cleaning"),
  },
  {
    title: "Storefront & Office Cleaning",
    description: "Clean windows that make your business look professional and inviting.",
    href: "/services/commercial-window-cleaning",
    cta: "Get My Business Quote",
    icon: Building2,
    image: landingServiceImageForSlug("commercial-window-cleaning"),
  },
  {
    title: "Multi-Story Window Cleaning",
    description: "Safe, professional cleaning for apartments and taller buildings.",
    href: "/services/high-rise-window-cleaning",
    cta: "Request a Quote",
    icon: MapPin,
    image: landingServiceImageForSlug("high-rise-window-cleaning"),
  },
] as const;

const homepageFaqs = [
  {
    question: "Do I need to be home?",
    answer: "Not always. For exterior cleaning, we can work without you there. We&apos;ll confirm details first.",
  },
  {
    question: "What's included?",
    answer: "We clean glass inside and out, wipe frames, and clear tracks (based on your service).",
  },
  {
    question: "How much does it cost?",
    answer: "Pricing depends on window count and access. Fill out the form to get your exact price.",
  },
  {
    question: "Do you clean homes and businesses?",
    answer: "Yes. We clean homes, storefronts, and offices across Las Vegas.",
  },
] as const;

const processSteps = [
  {
    step: "1",
    title: "1. Tell Us About Your Windows",
    description: "Send your details. It takes less than a minute.",
  },
  {
    step: "2",
    title: "2. Get Your Exact Price",
    description: "We call or text you with a clear quote. You approve it first.",
  },
  {
    step: "3",
    title: "3. We Clean Your Windows",
    description: "We show up on time and leave your windows spotless.",
  },
] as const;

function splitContactName(full: string) {
  const tokens = full.trim().split(/\s+/).filter(Boolean);
  const firstName = tokens[0] ?? "";
  const lastName = tokens.slice(1).join(" ");
  return { firstName, lastName };
}

function isDirectFile(url: string | undefined) {
  if (!url) return false;
  return url.startsWith("/uploads/") || url.startsWith("/api/files?");
}

function getAverageRating(reviews: Review[]) {
  if (reviews.length === 0) return "5.0";
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / reviews.length).toFixed(1);
}

export default function CustomerQuoteLanding({ reviews, businessInfo }: CustomerQuoteLandingProps) {
  const formRef = useRef<HTMLElement | null>(null);
  const [form, setForm] = useState<LeadFormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accentBackgroundUrl, setAccentBackgroundUrl] = useState<string | null>(null);

  const heroBg = businessInfo.heroBackgroundImageUrl?.trim() ?? "";
  const heroBackdropSrc = heroBg || LANDING_HERO_IMAGE;
  const pageBackdrop = businessInfo.pageBackdropImageUrl?.trim() ?? "";

  const randomPoolKey = useMemo(() => {
    const admin = (businessInfo.randomBackgroundImageUrls ?? []).filter(Boolean);
    const pool = admin.length > 0 ? admin : [...LANDING_ACCENT_BACKGROUNDS];
    return pool.join("\u0001");
  }, [businessInfo.randomBackgroundImageUrls]);

  useEffect(() => {
    if (!randomPoolKey) {
      setAccentBackgroundUrl(null);
      return;
    }
    const pool = randomPoolKey.split("\u0001").filter(Boolean);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setAccentBackgroundUrl(pick || null);
  }, [randomPoolKey]);

  const comparisonReviews = reviews.filter((review) => review.houseAfterPhotoUrl).slice(0, 3);
  const featuredReviews =
    reviews.filter((review) => review.testimonial).slice(0, 3).length > 0
      ? reviews.filter((review) => review.testimonial).slice(0, 3)
      : reviews.slice(0, 3);
  const singleComparisonLayout = comparisonReviews.length === 1;
  const singleFeaturedLayout = featuredReviews.length === 1;
  const averageRating = getAverageRating(reviews);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateField<Key extends keyof LeadFormState>(key: Key, value: LeadFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.contactFullName.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Add your name, phone number, and service address.");
      return;
    }

    const { firstName, lastName } = splitContactName(form.contactFullName);

    setLoading(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: form.phone,
          address: form.address,
          notes: form.requestDetails.trim() || undefined,
          source: "customer_quote_landing",
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to request your quote.");
      }

      setSuccess(true);
      setForm(initialState);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to request your quote.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicMarketingShell backgroundImageUrl={pageBackdrop} theme="dark">
      <PublicSiteHeader theme="dark" />

      <main>
        <section className="relative isolate min-h-[max(100svh,100dvh)]">
          <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden>
            <Image
              src={heroBackdropSrc}
              alt=""
              fill
              className="object-cover object-[center_28%] sm:object-center"
              unoptimized={isDirectFile(heroBackdropSrc)}
              sizes="(max-width: 1024px) 100vw, min(1280px, 92vw)"
              priority
              fetchPriority="high"
            />
          </div>
          <div
            className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(3,7,18,0.88)_0%,rgba(3,7,18,0.78)_38%,rgba(3,7,18,0.45)_68%,rgba(3,7,18,0.72)_100%)]"
            aria-hidden
          />
          <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_top,rgba(18,91,255,0.18),transparent_28%)]" aria-hidden />

          <div className="marketing-container relative z-[2] pb-0 pt-10 sm:pt-14 lg:pt-18">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,26rem)] lg:items-start lg:gap-x-14 lg:gap-y-10">
              <div className="max-lg:order-1 lg:col-start-1 lg:row-start-1">
                <div className="max-w-[35rem] space-y-6 text-left text-white">
                  <p className="marketing-kicker">Las Vegas Window Cleaning</p>
                  <h1 className="marketing-display-xl">
                    Cleaner Than
                    <br />
                    Your Neighbors
                    <br />
                    <span className="text-[#125bff]">Windows</span>
                  </h1>
                  <p className="max-w-[32rem] text-lg font-medium leading-9 text-white/80 sm:text-xl">
                    Get a fast, exact quote for your window cleaning. You approve the price first. No surprises. No pressure.
                  </p>
                  <p className="marketing-display text-[1.05rem] tracking-[0.1em] text-white/62">
                    Homeowners | Property managers | Small businesses
                  </p>
                </div>
              </div>

              <section
                ref={formRef}
                id="quote-form"
                className="max-lg:order-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start lg:sticky lg:top-24"
              >
                <div className="overflow-hidden border border-black/10 bg-white shadow-[0_30px_80px_-42px_rgba(8,15,26,0.75)]">
                  <div className="h-1 w-full bg-[#125bff]" />
                  <div className="space-y-6 p-7 sm:p-8">
                    <div className="space-y-2 text-left">
                      <p className="marketing-kicker">Free quote</p>
                      <h2 className="marketing-display-md text-slate-900">Get Your Window Cleaning Quote</h2>
                    </div>

                    {reviews.length > 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/95 px-4 py-3 text-left">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <StarRating rating={Number.parseFloat(averageRating) || 5} className="text-amber-500" />
                            <span className="text-sm font-bold text-slate-900">{averageRating} avg</span>
                            <span className="text-sm text-slate-600">| {reviews.length}+ local reviews</span>
                          </div>
                          {featuredReviews[0]?.testimonial ? (
                            <p className="text-sm leading-snug text-slate-700 line-clamp-2">
                              &ldquo;{featuredReviews[0].testimonial}&rdquo;
                            </p>
                          ) : (
                            <p className="text-sm text-slate-700">Trusted by Las Vegas homeowners and businesses.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/95 px-4 py-3 text-left text-sm text-slate-700">
                        Local Las Vegas team | Licensed & insured | Fast quote by call or text
                      </div>
                    )}

                    {success ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5 text-emerald-950">
                        <p className="text-lg font-black">Your quote request is in.</p>
                        <p className="mt-2 text-sm font-medium">We&apos;ll call or text shortly with your price.</p>
                        <p className="mt-2 text-sm text-emerald-900">Clear quote first. Booking second.</p>
                      </div>
                    ) : null}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                      <div className="space-y-2 text-left">
                        <Label htmlFor="quote-full-name" className="text-base font-semibold text-slate-900">
                          Your Name
                        </Label>
                        <Input
                          id="quote-full-name"
                          autoComplete="name"
                          value={form.contactFullName}
                          onChange={(event) => updateField("contactFullName", event.target.value)}
                          placeholder="Alex Johnson"
                          className="marketing-form-input"
                          required
                        />
                      </div>

                      <div className="space-y-2 text-left">
                        <Label htmlFor="quote-phone" className="text-base font-semibold text-slate-900">
                          Phone Number (we text your quote)
                        </Label>
                        <Input
                          id="quote-phone"
                          type="tel"
                          autoComplete="tel"
                          inputMode="tel"
                          value={form.phone}
                          onChange={(event) => updateField("phone", event.target.value)}
                          placeholder="(702) 555-0148"
                          className="marketing-form-input marketing-form-emphasis"
                          required
                        />
                      </div>

                      <div className="space-y-2 text-left">
                        <Label htmlFor="quote-address" className="text-base font-semibold text-slate-900">
                          Service Address
                        </Label>
                        <Input
                          id="quote-address"
                          autoComplete="street-address"
                          value={form.address}
                          onChange={(event) => updateField("address", event.target.value)}
                          placeholder="1234 Main St, Las Vegas, NV"
                          className="marketing-form-input"
                          required
                        />
                      </div>

                      <div className="space-y-2 text-left">
                        <Label htmlFor="quote-details" className="text-base font-semibold text-slate-900">
                          Tell us what you need (home, storefront, number of windows)
                        </Label>
                        <Textarea
                          id="quote-details"
                          value={form.requestDetails}
                          onChange={(event) => updateField("requestDetails", event.target.value)}
                          placeholder="Example: 2-story home with 18 windows, inside and outside. Or storefront with front glass and entry doors."
                          className="marketing-form-input min-h-32 resize-y text-base text-slate-900 placeholder:text-slate-500"
                        />
                      </div>

                      {error ? (
                        <p className="text-sm font-medium text-destructive" role="alert">
                          {error}
                        </p>
                      ) : null}

                      <div className="space-y-2 pt-1">
                        <Button
                          type="submit"
                          size="lg"
                          className="marketing-button-primary h-14 w-full border-0 text-base shadow-none sm:text-lg"
                          disabled={loading}
                        >
                          {loading ? "Sending..." : "Get My Exact Price"}
                          <ArrowRight className="size-5" aria-hidden />
                        </Button>
                        <p className="text-center text-sm font-medium leading-snug text-slate-600">
                          Fast quote | No pressure | Local Las Vegas team
                        </p>
                      </div>
                    </form>
                  </div>
                </div>
              </section>

              <div className="max-lg:order-3 lg:col-start-1 lg:row-start-2">
                <div className="mx-auto max-w-[37.5rem] space-y-8 pb-7 text-left lg:mx-0">
                  <div className="grid gap-3 sm:max-w-2xl">
                    {[
                      "Fully insured window cleaning pros",
                      "Clear, upfront pricing for Las Vegas homes & businesses",
                      "Book evenings & weekends",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-white">
                        <span className="flex size-10 shrink-0 items-center justify-center bg-[#125bff] text-white">
                          <BadgeCheck className="size-4" />
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/12 pt-7">
                    <p className="marketing-kicker">Service areas</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {BUSINESS.serviceAreas.map((area) => (
                        <span key={area} className="marketing-chip-dark">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#125bff] bg-[#05070b]">
          <div className="marketing-container grid gap-px border-x border-[#125bff] bg-[#125bff] py-0 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: `${averageRating}-Star Rated by Local Customers`, icon: Star },
              { title: "Trusted Across Las Vegas", icon: Home },
              { title: "Fast Scheduling - Often Same Week", icon: ArrowRight },
              { title: "Licensed & Insured", icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-[#0b0c0f] px-5 py-5">
                  <div className="flex items-center gap-4">
                    <span className="flex size-11 items-center justify-center bg-[#125bff] text-white">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-base font-semibold leading-6 text-white sm:text-lg">{item.title}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="marketing-section-light py-18 sm:py-22">
          <div className="marketing-container">
            <div className="max-w-3xl space-y-4">
              <p className="marketing-kicker">What&apos;s Included</p>
              <h2 className="marketing-display-lg text-slate-950">Window Cleaning That Makes Your Glass Crystal Clear</h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                We clean inside and out so your windows look brand new and let in more light.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {includedServiceCards.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="marketing-card-light overflow-hidden">
                    <div className="relative h-44 w-full bg-slate-200">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        loading="lazy"
                      />
                    </div>
                    <div className="px-5 pb-5 pt-5">
                      <span className="flex size-11 items-center justify-center bg-[#125bff] text-white">
                        <Icon className="size-4" />
                      </span>
                      <h3 className="marketing-display mt-4 text-[2rem] text-slate-950">{item.title}</h3>
                      <p className="mt-3 text-base leading-7 text-slate-600">{item.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="marketing-section-dark py-18 sm:py-22">
          <div className="marketing-container">
            <div className="max-w-3xl space-y-4">
              <p className="marketing-kicker">Services</p>
              <h2 className="marketing-display-lg text-white">Window Cleaning for Homes, Stores & Buildings</h2>
              <p className="max-w-2xl text-lg leading-8 text-white/68">
                No matter your property, we make your windows spotless and streak-free.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {propertyServiceCards.map((service) => {
                const Icon = service.icon;
                return (
                  <article key={service.title} className="marketing-card-dark overflow-hidden">
                    <div className="relative h-52 w-full bg-slate-200">
                      <Image
                        src={service.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.02),rgba(2,6,23,0.72))]" aria-hidden />
                    </div>
                    <div className="px-5 pb-5 pt-5">
                      <span className="flex size-11 items-center justify-center bg-[#125bff] text-white">
                        <Icon className="size-4" />
                      </span>
                      <h3 className="marketing-display mt-4 text-[2rem] text-white">{service.title}</h3>
                      <p className="mt-3 text-base leading-7 text-white/66">{service.description}</p>
                      <Button asChild className="marketing-button-primary mt-5 border-0 bg-[#125bff] text-white shadow-none hover:bg-[#0f4fe0] hover:text-white">
                        <Link href={service.href}>
                          {service.cta}
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="marketing-section-light py-18 sm:py-22">
          <div className="marketing-container">
            <div className="max-w-3xl space-y-4">
              <p className="marketing-kicker">Before / After</p>
              <h2 className="marketing-display-lg text-slate-950">See the Difference Clean Windows Make</h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Real results from homes and businesses we&apos;ve cleaned in Las Vegas.
              </p>
            </div>

            <div
              className={
                singleComparisonLayout ? "mt-8 grid gap-5 lg:grid-cols-1 lg:justify-items-center" : "mt-8 grid gap-5 lg:grid-cols-3"
              }
            >
              {comparisonReviews.length ? (
                comparisonReviews.map((review) => (
                  <article
                    key={review.id}
                    className={singleComparisonLayout ? "marketing-card-light w-full max-w-xl overflow-hidden" : "marketing-card-light overflow-hidden"}
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
                          loading="lazy"
                        />
                        <span className="absolute left-3 top-3 bg-black/78 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
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
                            loading="lazy"
                          />
                        ) : null}
                        <span className="absolute left-3 top-3 bg-[#125bff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                          After
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 px-5 py-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="marketing-display text-[1.4rem] text-slate-950">{review.name}</p>
                          <p className="text-sm text-slate-500">Las Vegas</p>
                        </div>
                        <StarRating rating={review.rating} className="text-amber-500" />
                      </div>
                      <p className="text-base text-slate-600">
                        {review.testimonial || "Clean windows, clearer light, and a better-looking property."}
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="marketing-card-light col-span-full px-6 py-8 text-base leading-7 text-slate-600">
                  Before-and-after photo sets will appear here from submitted customer reviews.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="marketing-section-light border-t border-black/8 py-18 sm:py-22">
          <div className="marketing-container grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="marketing-card-light relative overflow-hidden px-7 py-8">
              {accentBackgroundUrl ? (
                <>
                  <div className="pointer-events-none absolute inset-0 z-0">
                    <Image
                      src={accentBackgroundUrl}
                      alt=""
                      fill
                      className="object-cover opacity-[0.18]"
                      unoptimized={isDirectFile(accentBackgroundUrl)}
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 z-[1] bg-gradient-to-br from-background/93 via-background/90 to-background/95" />
                </>
              ) : null}
              <div className={accentBackgroundUrl ? "relative z-[2]" : undefined}>
                <p className="marketing-kicker">Local Service</p>
                <h2 className="marketing-display-md mt-4 text-slate-950">We Serve Your Area</h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  We provide window cleaning across Las Vegas and nearby areas. Fast service, local team.
                </p>
                {businessInfo.callOnly || businessInfo.serviceAreaBusiness ? (
                  <p className="mt-4 text-lg leading-8 text-slate-600">
                    Call or text for a fast quote. We cover homes, storefronts, and businesses across the valley.
                  </p>
                ) : null}
                <Button asChild className="marketing-button-primary mt-6 border-0 px-6">
                  <Link href="/service-areas/las-vegas">
                    See Areas We Serve
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="marketing-card-light px-7 py-8">
              <p className="marketing-kicker">Areas We Serve</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {BUSINESS.serviceAreas.map((area) => (
                  <div key={area} className="marketing-chip-light justify-center">
                    {area}
                  </div>
                ))}
              </div>
              <div className="mt-5 border border-black/10 bg-white px-5 py-5">
                <p className="marketing-display text-[1.25rem] text-slate-950">Serving Las Vegas & nearby areas</p>
                <div className="mt-2 grid gap-1">
                  {businessInfo.publishedHoursSummary.map((line) => (
                    <p key={line} className="text-base text-slate-600">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section-dark py-18 sm:py-22">
          <div className="marketing-container">
            <div className="max-w-3xl space-y-4">
              <p className="marketing-kicker">How It Works</p>
              <h2 className="marketing-display-lg text-white">Simple Window Cleaning - Start to Finish</h2>
              <p className="text-lg leading-8 text-white/68">Get your quote fast, approve the price, and we handle the rest.</p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {processSteps.map((item) => (
                <article key={item.step} className="marketing-card-dark px-7 py-8">
                  <p className="marketing-display text-[3rem] text-[#125bff]">{item.step}</p>
                  <h3 className="marketing-display mt-4 text-[2rem] text-white">{item.title}</h3>
                  <p className="mt-3 text-base leading-7 text-white/66">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section-light py-18 sm:py-22">
          <div className="marketing-container">
            <div className="max-w-3xl space-y-4">
              <p className="marketing-kicker">FAQ</p>
              <h2 className="marketing-display-lg text-slate-950">Window Cleaning FAQs</h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">Quick answers before you book your window cleaning.</p>
            </div>

            <div className="mt-8 grid gap-4">
              {homepageFaqs.map((item) => (
                <article key={item.question} className="marketing-card-light px-6 py-6">
                  <h3 className="marketing-display text-[2rem] text-slate-950">{item.question}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">{item.answer}</p>
                </article>
              ))}
            </div>

            <Button asChild variant="outline" className="marketing-button-secondary mt-6 border-black/15 text-slate-950 hover:bg-black/4">
              <Link href="/faq">See All Questions</Link>
            </Button>
          </div>
        </section>

        <section className="marketing-section-light border-t border-black/8 py-16 sm:py-18">
          <div className="marketing-container">
            <div className="max-w-3xl space-y-4">
              <p className="marketing-kicker">Reviews</p>
              <h2 className="marketing-display-lg text-slate-950">Trusted by Las Vegas Customers</h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Real reviews from people who chose us for window cleaning.
              </p>
            </div>

            <div
              className={
                singleFeaturedLayout ? "mt-8 grid gap-4 lg:grid-cols-1 lg:justify-items-center" : "mt-8 grid gap-4 lg:grid-cols-3"
              }
            >
              {featuredReviews.map((review) => (
                <article
                  key={review.id}
                  className={singleFeaturedLayout ? "marketing-card-light w-full max-w-xl px-6 py-6" : "marketing-card-light px-6 py-6"}
                >
                  <StarRating rating={review.rating} className="text-amber-500" />
                  <p className="mt-5 text-base leading-7 text-slate-700">
                    &quot;{review.testimonial || "Fast quote, clear pricing, and clean windows that looked great when the job was done."}&quot;
                  </p>
                  <div className="mt-6 border-t border-black/8 pt-4">
                    <p className="marketing-display text-[1.4rem] text-slate-950">{review.name}</p>
                    <p className="mt-1 text-sm text-slate-500">Las Vegas</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-white/10 py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.08),transparent_34%)]" aria-hidden />
          <div className="marketing-container relative z-[1] text-center">
            <p className="marketing-kicker">Ready?</p>
            <h2 className="marketing-display-lg mt-4 text-white">Get Your Window Cleaning Quote Today</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/68">
              It only takes a minute. Get a clear price before you book.
            </p>
            <Button type="button" size="lg" className="marketing-button-primary mt-8 border-0 px-8" onClick={scrollToForm}>
              Get My Price Now
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      </main>

      <PublicSiteFooter businessInfo={businessInfo} theme="dark" />
    </PublicMarketingShell>
  );
}