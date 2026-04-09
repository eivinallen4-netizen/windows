"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Glasses,
  Handshake,
  HeartHandshake,
  Home,
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
import type { Review } from "@/lib/reviews";

type CustomerQuoteLandingProps = {
  reviews: Review[];
};

type LeadFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
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
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  bestTimeToCall: "As soon as possible",
  homeType: "Single-story home",
  paneCounts: {
    standard: "",
    specialty: "",
    french: "",
  },
  serviceType: "Inside and out",
};

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

export default function CustomerQuoteLanding({ reviews }: CustomerQuoteLandingProps) {
  const formRef = useRef<HTMLElement | null>(null);
  const [form, setForm] = useState<LeadFormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const comparisonReviews = reviews.filter((review) => review.houseAfterPhotoUrl).slice(0, 3);
  const featuredReviews = (reviews.filter((review) => review.testimonial).slice(0, 3).length
    ? reviews.filter((review) => review.testimonial).slice(0, 3)
    : reviews.slice(0, 3));
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

    const paneCounts = {
      standard: Number(form.paneCounts.standard) || 0,
      specialty: Number(form.paneCounts.specialty) || 0,
      french: Number(form.paneCounts.french) || 0,
    };
    const totalPaneCount = Object.values(paneCounts).reduce((sum, count) => sum + count, 0);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("First name, last name, phone number, and address are required.");
      return;
    }

    if (!Number.isFinite(totalPaneCount) || totalPaneCount <= 0) {
      setError("Add at least 1 pane before requesting a call.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
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
    <div className="app-page-shell overflow-hidden">
      <PublicSiteHeader />

      <main>
      <section className="relative isolate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(11,111,178,0.17),transparent_32%),radial-gradient(circle_at_88%_14%,rgba(56,189,248,0.16),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#edf5ff_56%,#eef4f8_100%)]" />
        <div className="absolute left-[-5rem] top-20 h-56 w-56 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-0 right-[-3rem] h-64 w-64 rounded-full bg-sky-300/15 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:items-start">
            <div className="space-y-8 pt-2 lg:pt-8">
              <div className="inline-flex animate-in fade-in slide-in-from-bottom-4 items-center rounded-full border border-primary/20 bg-white/75 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary shadow-sm backdrop-blur duration-500">
                PureBin LV
              </div>

              <div className="max-w-3xl space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <h1 className="max-w-4xl text-4xl font-black tracking-[-0.05em] text-balance text-foreground sm:text-5xl lg:text-6xl">
                  Las Vegas Window Cleaning - Streak-Free Results, Guaranteed Before You Pay
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  We clean screens, frames, tracks, sills, and all glass - top to bottom.
                </p>
              </div>

              <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 sm:max-w-2xl">
                {[
                  "You do not pay until you approve the job",
                  "5% of every job goes back to Las Vegas",
                  "We're already working in your area",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/88 px-4 py-4 text-sm font-semibold text-foreground shadow-[0_20px_50px_-36px_rgba(15,23,42,0.28)] backdrop-blur"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <BadgeCheck className="size-4" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="max-w-xl rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-4 text-sm text-amber-900 shadow-sm animate-in fade-in slide-in-from-bottom-10 duration-700">
                <p className="font-semibold">Our customer service team is currently busy - response times may be delayed</p>
              </div>
            </div>

            <section ref={formRef} id="quote-form" className="lg:sticky lg:top-6">
              <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/94 shadow-[0_28px_100px_-44px_rgba(15,23,42,0.38)] backdrop-blur animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="app-brand-strip" />
                <div className="space-y-6 p-6 sm:p-7">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Quote Request</p>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tight text-foreground">Get a fast quote - we&apos;ll call you</h2>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Quick form, local callback, exact pricing before anything is scheduled.
                      </p>
                    </div>
                  </div>

                  {success ? (
                    <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-5 text-emerald-900">
                      <p className="text-lg font-black">You&apos;re on the list - we&apos;ll be calling you shortly.</p>
                      <p className="mt-2 text-sm font-medium">Most calls happen within the next hour.</p>
                      <p className="mt-3 text-sm text-emerald-800">You&apos;ll get exact pricing before anything is scheduled.</p>
                    </div>
                  ) : null}

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="quote-first-name">First name</Label>
                        <Input id="quote-first-name" value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} placeholder="Theo" className="h-12 rounded-2xl border-border bg-white" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quote-last-name">Last name</Label>
                        <Input id="quote-last-name" value={form.lastName} onChange={(event) => updateField("lastName", event.target.value)} placeholder="Allen" className="h-12 rounded-2xl border-border bg-white" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quote-phone" className="text-[15px] font-semibold text-foreground">Phone number</Label>
                      <Input
                        id="quote-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(event) => updateField("phone", event.target.value)}
                        placeholder="(702) 555-0148"
                        className="h-14 rounded-2xl border-primary/40 bg-primary/[0.05] text-base font-semibold shadow-[0_0_0_1px_rgba(11,111,178,0.08)] placeholder:text-primary/55 focus-visible:ring-primary/25"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quote-email">Email (optional)</Label>
                      <Input
                        id="quote-email"
                        type="email"
                        value={form.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        placeholder="you@example.com"
                        className="h-12 rounded-2xl border-border bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quote-address">Address</Label>
                      <Input id="quote-address" value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="1234 Main St, Las Vegas, NV" className="h-12 rounded-2xl border-border bg-white" required />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="quote-best-time">Best time to call</Label>
                        <select id="quote-best-time" value={form.bestTimeToCall} onChange={(event) => updateField("bestTimeToCall", event.target.value)} className="h-12 w-full rounded-2xl border border-border bg-white px-3 text-sm font-medium text-foreground outline-none transition focus:border-ring focus:ring-[3px] focus:ring-ring/50">
                          <option>As soon as possible</option>
                          <option>This morning</option>
                          <option>This afternoon</option>
                          <option>This evening</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quote-home-type">Home type</Label>
                        <select id="quote-home-type" value={form.homeType} onChange={(event) => updateField("homeType", event.target.value)} className="h-12 w-full rounded-2xl border border-border bg-white px-3 text-sm font-medium text-foreground outline-none transition focus:border-ring focus:ring-[3px] focus:ring-ring/50">
                          <option>Single-story home</option>
                          <option>Two-story home</option>
                          <option>Condo or townhome</option>
                          <option>Custom property</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label>Pane types</Label>
                        <p className="text-sm text-muted-foreground">Add the pane counts that fit the home best.</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {paneFieldOptions.map((option) => (
                          <div key={option.id} className="space-y-2 rounded-[1.5rem] border border-border bg-white p-4">
                            <Label htmlFor={`quote-pane-${option.id}`}>{option.label}</Label>
                            <Input
                              id={`quote-pane-${option.id}`}
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={form.paneCounts[option.id]}
                              onChange={(event) => updatePaneCount(option.id, event.target.value)}
                              placeholder={option.placeholder}
                              className="h-12 rounded-2xl border-border bg-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="quote-service-type">Service type</Label>
                        <select id="quote-service-type" value={form.serviceType} onChange={(event) => updateField("serviceType", event.target.value)} className="h-12 w-full rounded-2xl border border-border bg-white px-3 text-sm font-medium text-foreground outline-none transition focus:border-ring focus:ring-[3px] focus:ring-ring/50">
                          <option>Inside and out</option>
                          <option>Exterior only</option>
                          <option>Glass, tracks, and screens</option>
                          <option>Need help choosing</option>
                        </select>
                      </div>
                    </div>

                    {error ? <p className="text-sm text-destructive">{error}</p> : null}

                    <div className="space-y-3 pt-2">
                      <Button type="submit" size="lg" className="h-14 w-full rounded-full text-base font-semibold" disabled={loading}>
                        {loading ? "Requesting your call..." : "Request My Quote Call"}
                        <ArrowRight className="size-4" />
                      </Button>
                      <p className="text-center text-sm text-muted-foreground">Takes 30 seconds - no obligation</p>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="border-y border-white/70 bg-white/70 backdrop-blur">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { value: averageRating, label: "Average rating", icon: Star },
            { value: `${reviews.length || 0}+`, label: "Homes served", icon: Home },
            { value: "5%", label: "Donated to charity", icon: HeartHandshake },
            { value: "100%", label: "Satisfaction guarantee", icon: ShieldCheck },
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
            },
            {
              title: "Frames, tracks, sills cleaned",
              description: "The edges get cleaned too, so the windows look finished instead of only wiped.",
              icon: Handshake,
            },
            {
              title: "All glass cleaned inside and out",
              description: "Clearer glass, sharper curb appeal, and brighter rooms without streaks left behind.",
              icon: Glasses,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[2rem] border border-white/80 bg-white/92 px-6 py-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.28)]">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-2xl font-black tracking-tight text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            );
          })}
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

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {comparisonReviews.length ? (
            comparisonReviews.map((review) => (
              <article key={review.id} className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/94 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.3)]">
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
            <div className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-8 text-sm leading-6 text-muted-foreground shadow-[0_24px_60px_-40px_rgba(15,23,42,0.3)] lg:col-span-3">
              Before-and-after photo sets will appear here from submitted customer reviews.
            </div>
          )}
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
          <p className="app-kicker">Reviews</p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Local proof that the process feels easy</h2>
          <p className="text-base leading-7 text-muted-foreground">
            Short reviews, real names, and real job photos from the existing review system.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {featuredReviews.map((review) => (
            <article key={review.id} className="rounded-[2rem] border border-white/80 bg-white/94 px-6 py-6 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
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

      <PublicSiteFooter />
    </div>
  );
}
