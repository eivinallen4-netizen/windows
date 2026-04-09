"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaneCounts } from "@/lib/jobs";

type JobRecord = {
  id: string;
  customer?: { name?: string; email?: string; address?: string };
  pane_counts?: PaneCounts;
  pane_total?: number;
  amount_total?: number;
  currency?: string;
  service_date?: string;
  service_time?: string;
  payment_status?: string;
  start_photo_url?: string;
  started_at?: string;
  completed_at?: string;
  review_id?: string;
};

function formatPaneBreakdown(paneCounts?: PaneCounts) {
  if (!paneCounts) {
    return null;
  }

  const labels: Array<[keyof PaneCounts, string]> = [
    ["standard", "Standard"],
    ["specialty", "Sliding / Large"],
    ["french", "French"],
  ];

  const parts = labels
    .map(([key, label]) => {
      const count = paneCounts[key];
      return count ? `${count} ${label}` : null;
    })
    .filter(Boolean);

  return parts.length ? parts.join(" | ") : null;
}

function formatSchedule(job: JobRecord) {
  if (!job.service_date && !job.service_time) {
    return "Schedule not set";
  }
  if (job.service_date && job.service_time) {
    return `${job.service_date} at ${job.service_time}`;
  }
  if (job.service_date) {
    return `${job.service_date} time TBD`;
  }
  return `Time only: ${job.service_time}`;
}

function formatCurrency(amount?: number, currency?: string) {
  if (typeof amount !== "number") {
    return "Amount not set";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format(amount);
}

export default function StartJobClient({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingBeforePhoto, setUploadingBeforePhoto] = useState(false);
  const [starting, setStarting] = useState(false);
  const [beforePhoto, setBeforePhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadJob() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        const payload = (await response.json()) as { job?: JobRecord; error?: string };
        if (!response.ok || !payload.job) {
          throw new Error(payload.error || "Unable to load job.");
        }
        if (active) {
          setJob(payload.job);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load job.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadJob();
    return () => {
      active = false;
    };
  }, [jobId]);

  async function handleBeforePhotoChange(file: File | null) {
    setBeforePhoto(file);
    if (!file) {
      return;
    }

    setUploadingBeforePhoto(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("action", "saveStartPhoto");
      formData.set("beforePhoto", file);

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        body: formData,
      });
      const payload = (await response.json()) as { job?: JobRecord; error?: string };
      if (!response.ok || !payload.job) {
        throw new Error(payload.error || "Unable to save before photo.");
      }

      setJob(payload.job);
      setBeforePhoto(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save before photo.");
    } finally {
      setUploadingBeforePhoto(false);
    }
  }

  async function handleStartJob() {
    if (!job?.start_photo_url) {
      setError("Take the before photo before starting the job.");
      return;
    }

    setStarting(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const payload = (await response.json()) as { job?: JobRecord; error?: string };
      if (!response.ok || !payload.job) {
        throw new Error(payload.error || "Unable to start job.");
      }
      setJob(payload.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start job.");
    } finally {
      setStarting(false);
    }
  }

  const paneBreakdown = formatPaneBreakdown(job?.pane_counts);
  const beforePhotoPreviewUrl = useMemo(() => {
    if (!beforePhoto) {
      return null;
    }
    return URL.createObjectURL(beforePhoto);
  }, [beforePhoto]);

  useEffect(() => {
    return () => {
      if (beforePhotoPreviewUrl) {
        URL.revokeObjectURL(beforePhotoPreviewUrl);
      }
    };
  }, [beforePhotoPreviewUrl]);

  return (
    <div className="app-page-shell-soft">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
        {loading ? <p className="text-sm text-muted-foreground">Loading job...</p> : null}

        {job ? (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(11,111,178,0.12),rgba(255,255,255,0.92)_45%,rgba(11,111,178,0.08))] shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
              <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Active Job</p>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                      {job.customer?.address || "Address not set"}
                    </h1>
                    <p className="max-w-2xl text-base font-medium text-slate-600 sm:text-lg">
                      {job.customer?.name || "Customer"} {job.customer?.email ? `- ${job.customer.email}` : ""}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-slate-950 px-5 py-5 text-white shadow-xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">Pane Count</p>
                    <p className="mt-3 text-5xl font-black tracking-tight">
                      {job.pane_total ?? "--"}
                    </p>
                    <p className="mt-2 text-sm text-white/70">Most important field for the job.</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-white px-5 py-5 text-slate-900 shadow-xl ring-1 ring-slate-200/80">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Schedule</p>
                    <p className="mt-3 text-xl font-black tracking-tight">{formatSchedule(job)}</p>
                    <p className="mt-2 text-sm text-slate-500">Show up with the full address and pane count first.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
              <div className="space-y-4">
                <Card className="border-white/70 bg-white/90 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
                  <CardContent className="space-y-5 px-6 py-6">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Address</p>
                      <p className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                        {job.customer?.address || "Address not set"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pane Count</p>
                      <p className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
                        {job.pane_total ? `${job.pane_total} panes` : "Pane count not recorded"}
                      </p>
                      {paneBreakdown ? (
                        <p className="text-sm font-medium text-slate-600">{paneBreakdown}</p>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/70 bg-white/90 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
                  <CardContent className="grid gap-5 px-6 py-6 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Customer</p>
                      <p className="mt-2 text-lg font-bold text-slate-900">{job.customer?.name || "Customer"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</p>
                      <p className="mt-2 text-lg font-bold break-all text-slate-900">
                        {job.customer?.email || "No email"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Scheduled Time</p>
                      <p className="mt-2 text-lg font-bold text-slate-900">{formatSchedule(job)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Job Amount</p>
                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {formatCurrency(job.amount_total, job.currency)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <aside className="space-y-4">
                <Card className="border-white/70 bg-slate-950 text-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.55)]">
                  <CardContent className="space-y-4 px-6 py-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Job Status</p>
                    <p className="text-2xl font-black tracking-tight">
                      {job.completed_at ? "Completed" : job.started_at ? "In Progress" : "Ready to Start"}
                    </p>
                    <p className="text-sm text-white/70">
                      Payment status: {job.payment_status || "pending"}
                    </p>
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Before Photo</p>
                        <p className="text-sm text-white/70">
                          Capture the house before anything starts. The finish page will use this shot automatically.
                        </p>
                      </div>
                      {job.start_photo_url ? (
                        <div className="space-y-3">
                          <Image
                            src={job.start_photo_url}
                            alt="Before job photo"
                            width={1200}
                            height={720}
                            className="h-44 w-full rounded-xl object-cover ring-1 ring-white/10"
                            unoptimized
                          />
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
                            Before photo saved
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="before-photo" className="text-white">
                            Before Photo Camera
                          </Label>
                          <Input
                            id="before-photo"
                            type="file"
                            accept="image/*"
                            className="h-11 border-white/15 bg-white/10 text-white file:mr-3 file:rounded-md file:border-0 file:bg-white/15 file:px-3 file:py-2 file:text-white"
                            onChange={(event) => {
                              void handleBeforePhotoChange(event.target.files?.[0] ?? null);
                              event.currentTarget.value = "";
                            }}
                          />
                          {beforePhotoPreviewUrl ? (
                            <Image
                              src={beforePhotoPreviewUrl}
                              alt="New before photo preview"
                              width={1200}
                              height={720}
                              className="h-44 w-full rounded-xl object-cover ring-1 ring-white/10"
                              unoptimized
                            />
                          ) : null}
                          <p className="text-xs text-white/60">
                            {uploadingBeforePhoto
                              ? "Uploading before photo..."
                              : job.start_photo_url
                                ? "Before photo saved to the job."
                                : beforePhoto
                                  ? beforePhoto.name
                                  : "No before photo selected yet."}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      <Button
                        type="button"
                        className="h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleStartJob}
                        disabled={starting || uploadingBeforePhoto || !job.start_photo_url}
                      >
                        {starting
                          ? "Saving..."
                          : job.started_at && job.start_photo_url
                            ? "Job Started"
                            : job.started_at
                              ? "Save Before Photo"
                              : "Mark Job Started"}
                      </Button>
                      {job.started_at ? (
                        <Button asChild type="button" variant="outline" className="h-12 border-white/20 bg-white/5 text-white hover:bg-white/10">
                          <Link href={`/tech/jobs/${job.id}/finish`}>
                            Finish Job
                          </Link>
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" className="h-12 border-white/20 bg-white/5 text-white hover:bg-white/10" disabled>
                          Finish Job
                        </Button>
                      )}
                      <Button asChild type="button" variant="ghost" className="h-12 text-white/80 hover:bg-white/10 hover:text-white">
                        <Link href="/tech">Back to Jobs</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </aside>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
