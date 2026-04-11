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
  HeartHandshake,
  Home,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/star-rating";
import {
  LANDING_ACCENT_BACKGROUNDS,
  LANDING_HERO_IMAGE,
  LANDING_INCLUDED_IMAGES,
  landingServiceImageForSlug,
} from "@/lib/landing-stock-media";
import { BUSINESS, CORE_FAQS, SERVICE_PAGES } from "@/lib/marketing-content";
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
  email: string;
  phone: string;
  address: string;
  /** Primary hero field; maps to pane counts unless optional breakdown is used. */
  estimatedPanes: string;
  bestTimeToCall: string;
  homeType: string;
  paneCounts: {
    standard: string;
    specialty: string;
    french: string;
  };
  serviceType: string;
};

const initialState: LeadFormState = {
  contactFullName: "",
  email: "",
  phone: "",
  address: "",
  estimatedPanes: "",
  bestTimeToCall: "As soon as possible",
  homeType: "Single-story home",
  paneCounts: {
    standard: "",
    specialty: "",
    french: "",
  },
  serviceType: "Inside and out",
};

function splitContactName(full: string) {
  const tokens = full.trim().split(/\s+/).filter(Boolean);
  const firstName = tokens[0] ?? "";
  const lastName = tokens.slice(1).join(" ");
  return { firstName, lastName };
}

const paneFieldOptions = [
  { id: "standard", label: "Standard panes", placeholder: "16" },
  { id: "specialty", label: "Sliding / large panes", placeholder: "4" },
  { id: "french", label: "French panes", placeholder: "0" },
] as const;

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
  /** Single full-viewport hero photo: admin override or default stock image (no duplicate inline hero). */
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
  const featuredReviews = (reviews.filter((review) => review.testimonial).slice(0, 3).length
    ? reviews.filter((review) => review.testimonial).slice(0, 3)
    : reviews.slice(0, 3));
  const singleComparisonLayout = comparisonReviews.length === 1;
  const singleFeaturedLayout = featuredReviews.length === 1;
  const averageRating = getAverageRating(reviews);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateField<Key extends keyof LeadFormState>(key: Key, value: LeadFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updatePaneCount(key: keyof LeadFormState["paneCounts"], value: string) {
    setForm((current) => ({
      ...current,
      paneCounts: {
        ...current.paneCounts,
        [key]: value,
      },
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const { firstName, lastName } = splitContactName(form.contactFullName);
    const pStandard = Number(form.paneCounts.standard) || 0;
    const pSpecialty = Number(form.paneCounts.specialty) || 0;
    const pFrench = Number(form.paneCounts.french) || 0;
    const totalFromBreakdown = pStandard + pSpecialty + pFrench;
    const mainEstimate = Number(form.estimatedPanes) || 0;
    const paneCounts =
      totalFromBreakdown > 0
        ? { standard: pStandard, specialty: pSpecialty, french: pFrench }
        : { standard: mainEstimate, specialty: 0, french: 0 };
    const totalPaneCount = paneCounts.standard + paneCounts.specialty + paneCounts.french;

    if (!firstName.trim() || !lastName.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Add your first and last name, phone number, and street address.");
      return;
    }

    if (!Number.isFinite(totalPaneCount) || totalPaneCount <= 0) {
      setError("Add an estimated pane count (or use optional breakdown below).");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone,
          address: form.address,
          bestTimeToCall: form.bestTimeToCall,
          homeType: form.homeType,
          serviceType: form.serviceType,
          paneCounts,
          windowCount: totalPaneCount,
          paneCount: totalPaneCount,
          source: "customer_quote_landing",
          notes: `Best time to call: ${form.bestTimeToCall} | Home type: ${form.homeType} | Service type: ${form.serviceType}`,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to request your quote call.");
      }

      setSuccess(true);
      setForm(initialState);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to request your quote call.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-page-shell relative overflow-hidden">
      {pageBackdrop ? (
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <Image
            src={pageBackdrop}
            alt=""
            fill
            className="object-cover opacity-[0.06] sm:opacity-[0.09]"
            unoptimized={isDirectFile(pageBackdrop)}
            sizes="100vw"
            priority={false}
          />
        </div>
      ) : null}

      <div className="relative z-[1]">
      <PublicSiteHeader />

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
        {/* Readability: darken photo, then strong left scrim so copy avoids busy areas (WCAG-friendly contrast). */}
        <div
          className="absolute inset-0 z-[1] bg-gradient-to-br from-slate-950/55 via-slate-900/28 to-slate-900/50"
          aria-hidden
        />
        <div
          className="absolute inset-0 z-[1] bg-[linear-gradient(100deg,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.94)_min(28rem,72%)_32%,rgba(255,255,255,0.72)_55%,rgba(255,255,255,0.2)_78%,transparent_100%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_85%_65%_at_0%_0%,rgba(11,111,178,0.11),transparent_58%),radial-gradient(ellipse_55%_50%_at_100%_12%,rgba(56,189,248,0.1),transparent_52%)]"
          aria-hidden
        />

        <div className="relative z-[2] mx-auto w-full max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26.5rem)] lg:items-start lg:gap-x-14 lg:gap-y-10">
            <div className="max-lg:order-1 lg:col-start-1 lg:row-start-1">
              <div className="max-w-[37.5rem] space-y-5 text-left text-slate-900">
                <h1 className="text-balance text-4xl font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.06]">
                  Las Vegas Window Cleaning You Approve Before You Pay
                </h1>
                <p className="text-lg font-medium leading-relaxed text-slate-800 sm:text-xl">
                  We call you back with exact pricing for your panes before anything is scheduled—no surprise bills.
                </p>
                <p className="text-base font-semibold text-slate-700">
                  PureBin LV · Las Vegas · Since {businessInfo.servingSinceYear}
                </p>
              </div>
            </div>

            <section
              ref={formRef}
              id="quote-form"
              className="max-lg:order-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start lg:sticky lg:top-6"
            >
              <div className="overflow-hidden rounded-3xl border border-slate-200/95 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.06),0_22px_50px_-18px_rgba(15,23,42,0.2),0_48px_90px_-36px_rgba(15,23,42,0.14)]">
                <div className="app-brand-strip" />
                <div className="space-y-6 p-7 sm:p-8">
                  <div className="space-y-2 text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Free quote</p>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-[1.75rem]">
                      Get a callback with your price
                    </h2>
                  </div>

                  {reviews.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/95 px-4 py-3 text-left">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <StarRating rating={Number.parseFloat(averageRating) || 5} className="text-amber-500" />
                          <span className="text-sm font-bold text-slate-900">{averageRating} avg</span>
                          <span className="text-sm text-slate-600">· {reviews.length}+ local reviews</span>
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
                      Local Las Vegas team · Licensed & insured · You approve before you pay
                    </div>
                  )}

                  {success ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5 text-emerald-950">
                      <p className="text-lg font-black">You&apos;re on the list—we&apos;ll call shortly.</p>
                      <p className="mt-2 text-sm font-medium">Most callbacks happen within an hour.</p>
                      <p className="mt-2 text-sm text-emerald-900">Exact pricing before we schedule anything.</p>
                    </div>
                  ) : null}

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2 text-left">
                      <Label htmlFor="quote-full-name" className="text-base font-semibold text-slate-900">
                        Full name
                      </Label>
                      <Input
                        id="quote-full-name"
                        autoComplete="name"
                        value={form.contactFullName}
                        onChange={(event) => updateField("contactFullName", event.target.value)}
                        placeholder="Alex Johnson"
                        className="h-12 min-h-[48px] rounded-2xl border-slate-200 bg-white text-base text-slate-900"
                        required
                      />
                    </div>

                    <div className="space-y-2 text-left">
                      <Label htmlFor="quote-phone" className="text-base font-semibold text-slate-900">
                        Phone
                      </Label>
                      <Input
                        id="quote-phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        value={form.phone}
                        onChange={(event) => updateField("phone", event.target.value)}
                        placeholder="(702) 555-0148"
                        className="h-14 min-h-[52px] rounded-2xl border-primary/35 bg-primary/[0.06] text-base font-semibold text-slate-900 shadow-[0_0_0_1px_rgba(11,111,178,0.08)]"
                        required
                      />
                    </div>

                    <div className="space-y-2 text-left">
                      <Label htmlFor="quote-address" className="text-base font-semibold text-slate-900">
                        Property address
                      </Label>
                      <Input
                        id="quote-address"
                        autoComplete="street-address"
                        value={form.address}
                        onChange={(event) => updateField("address", event.target.value)}
                        placeholder="1234 Main St, Las Vegas, NV"
                        className="h-12 min-h-[48px] rounded-2xl border-slate-200 bg-white text-base text-slate-900"
                        required
                      />
                    </div>

                    <div className="space-y-2 text-left">
                      <Label htmlFor="quote-estimated-panes" className="text-base font-semibold text-slate-900">
                        Estimated panes (total)
                      </Label>
                      <Input
                        id="quote-estimated-panes"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={form.estimatedPanes}
                        onChange={(event) => updateField("estimatedPanes", event.target.value)}
                        placeholder="e.g. 16"
                        className="h-12 min-h-[48px] rounded-2xl border-slate-200 bg-white text-base text-slate-900"
                      />
                      <p className="text-sm leading-snug text-slate-600">Rough count is fine—we confirm on the call.</p>
                    </div>

                    <details className="group rounded-2xl border border-slate-200 bg-slate-50/80 text-left [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 text-sm font-semibold text-slate-900 min-h-[48px]">
                        <span>More details (optional)</span>
                        <span className="text-xs font-bold text-primary group-open:rotate-180 motion-safe:transition">▼</span>
                      </summary>
                      <div className="space-y-4 border-t border-slate-200/90 px-4 pb-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="quote-email">Email</Label>
                          <Input
                            id="quote-email"
                            type="email"
                            autoComplete="email"
                            value={form.email}
                            onChange={(event) => updateField("email", event.target.value)}
                            placeholder="you@example.com"
                            className="h-12 min-h-[48px] rounded-2xl border-slate-200 bg-white text-base"
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="quote-best-time">Best time to call</Label>
                            <select
                              id="quote-best-time"
                              value={form.bestTimeToCall}
                              onChange={(event) => updateField("bestTimeToCall", event.target.value)}
                              className="h-12 min-h-[48px] w-full rounded-2xl border border-slate-200 bg-white px-3 text-base font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            >
                              <option>As soon as possible</option>
                              <option>This morning</option>
                              <option>This afternoon</option>
                              <option>This evening</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="quote-home-type">Property type</Label>
                            <select
                              id="quote-home-type"
                              value={form.homeType}
                              onChange={(event) => updateField("homeType", event.target.value)}
                              className="h-12 min-h-[48px] w-full rounded-2xl border border-slate-200 bg-white px-3 text-base font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            >
                              <option>Single-story home</option>
                              <option>Two-story home</option>
                              <option>Condo or townhome</option>
                              <option>Custom property</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quote-service-type">Service focus</Label>
                          <select
                            id="quote-service-type"
                            value={form.serviceType}
                            onChange={(event) => updateField("serviceType", event.target.value)}
                            className="h-12 min-h-[48px] w-full rounded-2xl border border-slate-200 bg-white px-3 text-base font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          >
                            <option>Inside and out</option>
                            <option>Exterior only</option>
                            <option>Glass, tracks, and screens</option>
                            <option>Need help choosing</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Fine-tune pane counts</Label>
                          <p className="text-sm text-slate-600">If filled, these override the single estimate above.</p>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {paneFieldOptions.map((option) => (
                              <div key={option.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                                <Label htmlFor={`quote-pane-${option.id}`} className="text-sm">
                                  {option.label}
                                </Label>
                                <Input
                                  id={`quote-pane-${option.id}`}
                                  type="number"
                                  min="0"
                                  inputMode="numeric"
                                  value={form.paneCounts[option.id]}
                                  onChange={(event) => updatePaneCount(option.id, event.target.value)}
                                  placeholder={option.placeholder}
                                  className="h-12 min-h-[48px] rounded-xl border-slate-200 bg-white text-base"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </details>

                    {error ? (
                      <p className="text-sm font-medium text-destructive" role="alert">
                        {error}
                      </p>
                    ) : null}

                    <div className="space-y-2 pt-1">
                      <Button
                        type="submit"
                        size="lg"
                        className="h-14 min-h-[52px] w-full rounded-full text-base font-bold shadow-md sm:text-lg"
                        disabled={loading}
                      >
                        {loading ? "Sending…" : "Get my free quote call"}
                        <ArrowRight className="size-5" aria-hidden />
                      </Button>
                      <p className="text-center text-sm font-medium leading-snug text-slate-600">
                        Free quote in about 60 seconds · No obligation · Local Las Vegas team
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            <div className="max-lg:order-3 lg:col-start-1 lg:row-start-2">
              <div className="mx-auto max-w-[37.5rem] space-y-8 text-left lg:mx-0">
                <div className="grid gap-3 sm:max-w-2xl">
                  {[
                    "You do not pay until you approve the job",
                    "5% of every job goes back to Las Vegas",
                    `Serving Las Vegas since ${businessInfo.servingSinceYear}`,
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-4 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur-sm"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                        <BadgeCheck className="size-5" />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white/90 px-5 py-5 shadow-sm backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Service areas</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {BUSINESS.serviceAreas.map((area) => (
                      <span key={area} className="app-chip">
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

      <section className="border-y border-white/70 bg-white/70 backdrop-blur">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { value: averageRating, label: "Average rating", icon: Star },
            { value: `${reviews.length || 0}+`, label: "Reviews on site", icon: Home },
            { value: "5%", label: "Donated to charity", icon: HeartHandshake },
            {
              value: businessInfo.licenseStatusPublic ? "Licensed" : "Local",
              label: businessInfo.licenseStatusPublic ? "Business status" : "Las Vegas service",
              icon: ShieldCheck,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-[1.6rem] border border-white/80 bg-white/90 px-5 py-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.26)]">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-2xl font-black tracking-tight text-foreground">{item.value}</p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl space-y-3">
          <p className="app-kicker">What&apos;s Included</p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Everything needed for a clean, bright finish</h2>
          <p className="text-base leading-7 text-muted-foreground">
            The service is simple: we clean the details homeowners notice first and keep the scope easy to understand.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Screens cleaned",
              description: "Dust, buildup, and loose debris removed so airflow and visibility feel fresh again.",
              icon: Sparkles,
              image: LANDING_INCLUDED_IMAGES[0],
            },
            {
              title: "Frames, tracks, sills cleaned",
              description: "The edges get cleaned too, so the windows look finished instead of only wiped.",
              icon: Handshake,
              image: LANDING_INCLUDED_IMAGES[1],
            },
            {
              title: "All glass cleaned inside and out",
              description: "Clearer glass, sharper curb appeal, and brighter rooms without streaks left behind.",
              icon: Glasses,
              image: LANDING_INCLUDED_IMAGES[2],
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.28)]"
              >
                <div className="relative h-36 w-full bg-slate-200">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/20 to-transparent" aria-hidden />
                </div>
                <div className="px-6 pb-6 pt-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-2xl font-black tracking-tight text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-10">
        <div className="max-w-3xl space-y-3">
          <p className="app-kicker">Services</p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Residential, commercial, storefront, and high-rise support
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            Separate service pages spell out residential, commercial, storefront, and high-rise details so you can match the right page
            to your property before you call.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {SERVICE_PAGES.map((service) => (
            <article
              key={service.slug}
              className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.28)]"
            >
              <div className="relative h-40 w-full bg-slate-200">
                <Image
                  src={landingServiceImageForSlug(service.slug)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/25 to-transparent" aria-hidden />
              </div>
              <div className="px-6 pb-6 pt-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {service.slug === "commercial-window-cleaning" ? (
                    <Building2 className="size-5" />
                  ) : service.slug === "high-rise-window-cleaning" ? (
                    <MapPin className="size-5" />
                  ) : (
                    <Home className="size-5" />
                  )}
                </span>
                <h3 className="mt-5 text-2xl font-black tracking-tight text-foreground">{service.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.summary}</p>
                <Button asChild variant="outline" className="mt-5 rounded-full">
                  <Link href={`/services/${service.slug}`}>
                    Explore Service Page
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-3">
          <p className="app-kicker">Before / After</p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Real windows. Real cleanup. Easy to see.</h2>
          <p className="text-base leading-7 text-muted-foreground">
            These are real customer results pulled from the same review gallery already on the site.
          </p>
        </div>

        <div
          className={
            singleComparisonLayout
              ? "mt-8 grid gap-5 lg:grid-cols-1 lg:justify-items-center"
              : "mt-8 grid gap-5 lg:grid-cols-3"
          }
        >
          {comparisonReviews.length ? (
            comparisonReviews.map((review) => (
              <article
                key={review.id}
                className={
                  singleComparisonLayout
                    ? "w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/94 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.3)]"
                    : "overflow-hidden rounded-[2rem] border border-white/80 bg-white/94 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.3)]"
                }
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
                        loading="lazy"
                      />
                    ) : null}
                    <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground">
                      After
                    </span>
                  </div>
                </div>
                <div className="space-y-3 px-5 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-foreground">{review.name}</p>
                      <p className="text-sm text-muted-foreground">Las Vegas</p>
                    </div>
                    <StarRating rating={review.rating} className="text-amber-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {review.testimonial || "Clearer glass, cleaner edges, and a finish the homeowner approved before paying."}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full rounded-[2rem] border border-white/80 bg-white/94 px-6 py-8 text-sm leading-6 text-muted-foreground shadow-[0_24px_60px_-40px_rgba(15,23,42,0.3)]">
              Before-and-after photo sets will appear here from submitted customer reviews.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
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
            <p className="app-kicker">Las Vegas Focus</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Why local Las Vegas window cleaning pages matter
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Valley windows deal with dust, hard water spotting, traffic film, and strong sun year-round. Local pages let us speak
              directly to those conditions and show how we cover the neighborhoods you care about.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Start with the dedicated Las Vegas service-area page, then jump to services, reviews, before-and-after photos, and FAQs
              when you want more detail.
            </p>
            {businessInfo.callOnly || businessInfo.serviceAreaBusiness ? (
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Call to book. We do not have a storefront right now, so every quote starts with a phone call and service-area review.
              </p>
            ) : null}
            <Button asChild className="mt-6 rounded-full px-6">
              <Link href="/service-areas/las-vegas">
                View Las Vegas Service Area
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
            <p className="app-kicker">Nearby Areas</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {BUSINESS.serviceAreas.map((area) => (
                <div key={area} className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-sm font-semibold text-foreground">
                  {area}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[1.4rem] border border-border bg-background px-4 py-4">
              <p className="text-sm font-semibold text-foreground">Published hours</p>
              <div className="mt-2 grid gap-1">
                {businessInfo.publishedHoursSummary.map((line) => (
                  <p key={line} className="text-sm text-muted-foreground">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="rounded-[2.25rem] border border-white/80 bg-white/94 px-6 py-8 shadow-[0_26px_80px_-46px_rgba(15,23,42,0.32)] sm:px-8 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="app-kicker">How It Works</p>
            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Fast, clear, and easy to approve</h2>
            <p className="text-base leading-7 text-muted-foreground">No surprises. No pressure.</p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {[
              { step: "01", title: "Fill out form", description: "Give us the basics so we know the home, the scope, and the best number to call." },
              { step: "02", title: "We call and confirm price", description: "Our team walks through the quote with you and gives exact pricing before anything moves forward." },
              { step: "03", title: "You approve before anything is done", description: "You stay in control. If the quote works for you, we set the next step." },
            ].map((item) => (
              <article key={item.step} className="rounded-[1.75rem] border border-border bg-background px-5 py-6">
                <p className="text-sm font-black tracking-[0.24em] text-primary">{item.step}</p>
                <h3 className="mt-4 text-2xl font-black tracking-tight text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-3">
          <p className="app-kicker">FAQ</p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Questions people ask before booking window cleaning in Las Vegas
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            Answering these here saves a phone call and makes scope, pricing, and coverage easier to understand before you book.
          </p>
        </div>

        <div className="mt-8 grid gap-4">
          {CORE_FAQS.slice(0, 4).map((item) => (
            <article key={item.question} className="rounded-[1.8rem] border border-white/80 bg-white/94 px-6 py-6 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
              <h3 className="text-2xl font-black tracking-tight text-foreground">{item.question}</h3>
              <p className="mt-3 text-base leading-7 text-muted-foreground">{item.answer}</p>
            </article>
          ))}
        </div>

        <Button asChild variant="outline" className="mt-6 rounded-full px-6">
          <Link href="/faq">Read All FAQs</Link>
        </Button>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-3">
          <p className="app-kicker">Reviews</p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Local proof that the process feels easy</h2>
          <p className="text-base leading-7 text-muted-foreground">
            Short reviews, real names, and real job photos from the existing review system.
          </p>
        </div>

        <div
          className={
            singleFeaturedLayout
              ? "mt-8 grid gap-4 lg:grid-cols-1 lg:justify-items-center"
              : "mt-8 grid gap-4 lg:grid-cols-3"
          }
        >
          {featuredReviews.map((review) => (
            <article
              key={review.id}
              className={
                singleFeaturedLayout
                  ? "w-full max-w-xl rounded-[2rem] border border-white/80 bg-white/94 px-6 py-6 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]"
                  : "rounded-[2rem] border border-white/80 bg-white/94 px-6 py-6 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]"
              }
            >
              <StarRating rating={review.rating} className="text-amber-500" />
              <p className="mt-5 text-base leading-7 text-foreground">
                &quot;{review.testimonial || "Clear communication, clean windows, and a final walkthrough before anything was paid."}&quot;
              </p>
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-sm font-black text-foreground">{review.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">Las Vegas</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl rounded-[2.4rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(11,111,178,0.12),rgba(255,255,255,0.94)_46%,rgba(56,189,248,0.12))] px-6 py-10 text-center shadow-[0_28px_90px_-48px_rgba(15,23,42,0.34)] sm:px-10">
          <h2 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-5xl">Want a fast quote?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Request a call, get exact pricing, and approve the job before anything is scheduled.
          </p>
          <Button type="button" size="lg" className="mt-7 rounded-full px-8 text-base" onClick={scrollToForm}>
            Request a Call
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      </main>

      <PublicSiteFooter businessInfo={businessInfo} />
      </div>
    </div>
  );
}
