"use client";

import { useState } from "react";
import { CheckCircle2, Home, PhoneCall, Shield, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type LeadFormState = {
  firstName: string;
  phone: string;
  address: string;
  paneCount: string;
  email: string;
  notes: string;
};

const initialState: LeadFormState = {
  firstName: "",
  phone: "",
  address: "",
  paneCount: "",
  email: "",
  notes: "",
};

export default function LeadFunnel() {
  const [form, setForm] = useState<LeadFormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField<Key extends keyof LeadFormState>(key: Key, value: LeadFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const paneCount = Number(form.paneCount);
    if (!form.phone.trim() || !form.address.trim() || !form.paneCount.trim()) {
      setError("Phone, address, and pane count are required.");
      setLoading(false);
      return;
    }

    if (!Number.isFinite(paneCount) || paneCount <= 0) {
      setError("Pane count must be a valid number.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          phone: form.phone,
          address: form.address,
          paneCount,
          email: form.email,
          notes: form.notes,
          source: "customer_quote_funnel",
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save lead.");
      }

      setSuccess("Thanks. We got your request and will reach out soon.");
      setForm(initialState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save lead.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4efe5] text-slate-900">
      <section className="relative isolate min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(19,78,74,0.18),_transparent_34%),radial-gradient(circle_at_80%_18%,_rgba(217,119,6,0.18),_transparent_26%),linear-gradient(180deg,_#f6f1e8_0%,_#efe6d8_100%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.14)),url('https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center lg:block" />
        <div className="absolute left-6 top-6 h-24 w-24 rounded-full bg-[#0f766e]/12 blur-2xl sm:left-10 sm:top-10 sm:h-40 sm:w-40" />
        <div className="absolute bottom-8 left-[38%] h-28 w-28 rounded-full bg-[#d97706]/14 blur-3xl sm:h-40 sm:w-40" />

        <div className="relative mx-auto grid min-h-screen w-full max-w-7xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:px-10 lg:py-10">
          <div className="flex flex-col justify-between gap-12">
            <div className="max-w-2xl space-y-8">
              <div className="inline-flex w-fit items-center rounded-full border border-slate-900/10 bg-white/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-700 backdrop-blur">
                PureBin Window Cleaning
              </div>

              <div className="space-y-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0f766e]">Window Cleaning Request</p>
                <h1 className="max-w-xl text-4xl font-black tracking-[-0.04em] text-balance sm:text-6xl">
                  Make your windows look bright, clear, and streak-free again.
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-700 sm:text-lg">
                  Tell us a little about your home and we will reach out with the next step. It is a simple way to get help without calling around or filling out a long form.
                </p>
              </div>

              <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
                <div className="border-t border-slate-900/15 pt-4">
                  <PhoneCall className="size-5 text-[#0f766e]" />
                  <p className="mt-3 text-sm font-semibold">Simple to request</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">A few quick details and our team can take it from there.</p>
                </div>
                <div className="border-t border-slate-900/15 pt-4">
                  <Sparkles className="size-5 text-[#0f766e]" />
                  <p className="mt-3 text-sm font-semibold">Fresh, polished finish</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Cleaner glass helps your home feel brighter inside and look sharper outside.</p>
                </div>
                <div className="border-t border-slate-900/15 pt-4">
                  <Shield className="size-5 text-[#0f766e]" />
                  <p className="mt-3 text-sm font-semibold">Fast follow-up</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">We reach out directly so you can keep things moving without the back and forth.</p>
                </div>
              </div>
            </div>

            <div className="grid max-w-2xl gap-4 rounded-[2rem] border border-white/60 bg-white/55 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur sm:grid-cols-3 sm:p-6">
              <div>
                <Star className="size-5 text-[#0f766e]" />
                <p className="mt-3 text-sm font-semibold">Made for homeowners</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Clear, direct, and easy to fill out from your phone.</p>
              </div>
              <div>
                <Home className="size-5 text-[#0f766e]" />
                <p className="mt-3 text-sm font-semibold">Built around your home</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Share the address and rough pane count so we know what you need.</p>
              </div>
              <div>
                <PhoneCall className="size-5 text-[#0f766e]" />
                <p className="mt-3 text-sm font-semibold">Personal response</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">A real person follows up to help you get scheduled.</p>
              </div>
            </div>
          </div>

          <div className="relative flex items-center lg:justify-end">
            <div className="w-full max-w-xl rounded-[2rem] border border-slate-900/10 bg-[#111827] p-6 text-white shadow-[0_40px_120px_-50px_rgba(15,23,42,0.8)] sm:p-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f6bd60]">Request A Callback</p>
                <h2 className="text-3xl font-black tracking-tight">Tell us about your home and we will reach out soon.</h2>
                <p className="max-w-md text-sm leading-6 text-slate-300">
                  Leave your info here and we will follow up to help you get your windows cleaned without wasting your time.
                </p>
              </div>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lead-name" className="text-slate-200">
                      First name
                    </Label>
                    <Input
                      id="lead-name"
                      value={form.firstName}
                      onChange={(event) => updateField("firstName", event.target.value)}
                      placeholder="Alex"
                      className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-phone" className="text-slate-200">
                      Phone number
                    </Label>
                    <Input
                      id="lead-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      placeholder="(702) 555-0148"
                      className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead-address" className="text-slate-200">
                    Home address
                  </Label>
                  <Input
                    id="lead-address"
                    value={form.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    placeholder="1234 Main St, Las Vegas, NV"
                    className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    required
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lead-panes" className="text-slate-200">
                      Approximate number of panes
                    </Label>
                    <Input
                      id="lead-panes"
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={form.paneCount}
                      onChange={(event) => updateField("paneCount", event.target.value)}
                      placeholder="24"
                      className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-email" className="text-slate-200">
                      Email
                    </Label>
                    <Input
                      id="lead-email"
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="Optional"
                      className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead-notes" className="text-slate-200">
                    Extra details
                  </Label>
                  <Textarea
                    id="lead-notes"
                    value={form.notes}
                    onChange={(event) => updateField("notes", event.target.value)}
                    placeholder="Screens, tracks, access notes, gate code, or the best time to reach you."
                    className="min-h-24 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>

                {error ? <p className="text-sm text-rose-300">{error}</p> : null}
                {success ? (
                  <p className="inline-flex items-center gap-2 text-sm text-emerald-300">
                    <CheckCircle2 className="size-4" />
                    {success}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 rounded-full bg-[#f6bd60] px-6 text-slate-950 hover:bg-[#f3c777]"
                    disabled={loading}
                  >
                    {loading ? "Sending request..." : "Request my callback"}
                  </Button>
                </div>
              </form>

              <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 text-sm text-slate-300">
                <p>No account required.</p>
                <p>Quick request. Personal follow-up. No long signup process.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
