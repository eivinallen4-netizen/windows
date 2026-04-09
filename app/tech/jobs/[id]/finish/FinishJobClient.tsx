"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PaneCounts } from "@/lib/jobs";

type JobRecord = {
  id: string;
  customer?: { name?: string; email?: string; address?: string };
  pane_counts?: PaneCounts;
  pane_total?: number;
  service_date?: string;
  service_time?: string;
  payment_status?: string;
  start_photo_url?: string;
  started_at?: string;
  completed_at?: string;
  review_id?: string;
};

type ReviewDraft = {
  name: string;
  rating: string;
  panels: string;
  acquisitionType: "They called us" | "We knocked";
  testimonial: string;
  customerPhoto?: File | null;
  houseAfterPhoto?: File | null;
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

function buildDefaultDraft(job: JobRecord): ReviewDraft {
  return {
    name: job.customer?.name ?? "",
    rating: "5",
    panels: job.pane_total ? String(job.pane_total) : "",
    acquisitionType: "They called us",
    testimonial: "",
    customerPhoto: null,
    houseAfterPhoto: null,
  };
}

export default function FinishJobClient({ jobId }: { jobId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [job, setJob] = useState<JobRecord | null>(null);
  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentRetryLoading, setPaymentRetryLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Review saved and card charged.");

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
        if (!active) {
          return;
        }
        setJob(payload.job);
        setDraft(buildDefaultDraft(payload.job));
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load job.");
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

  useEffect(() => {
    if (searchParams.get("payment_retry_canceled") === "1") {
      setError("Replacement card collection was canceled. Collect another card to finish payment.");
    }
  }, [searchParams]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const reauthorized = searchParams.get("reauthorized");
    if (reauthorized !== "1" || !sessionId) {
      return;
    }

    let active = true;
    async function finalizeReplacementCard() {
      setPaymentRetryLoading(true);
      setError(null);
      try {
        const syncResponse = await fetch("/api/stripe/session-job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const syncPayload = (await syncResponse.json()) as { error?: string };
        if (!syncResponse.ok) {
          throw new Error(syncPayload.error || "Unable to sync replacement card.");
        }

        const captureResponse = await fetch("/api/stripe/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });
        const capturePayload = (await captureResponse.json()) as {
          error?: string;
          job?: JobRecord;
        };
        if (!captureResponse.ok) {
          throw new Error(capturePayload.error || "Replacement card authorized, but charge failed.");
        }

        if (!active) {
          return;
        }

        if (capturePayload.job) {
          setJob(capturePayload.job);
        }
        setSuccessMessage("Replacement card approved and charged.");
        setShowSuccess(true);
        router.replace(`/tech/jobs/${jobId}/finish`);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to finish replacement payment.");
        router.replace(`/tech/jobs/${jobId}/finish`);
      } finally {
        if (active) {
          setPaymentRetryLoading(false);
        }
      }
    }

    void finalizeReplacementCard();
    return () => {
      active = false;
    };
  }, [jobId, router, searchParams]);

  useEffect(() => {
    if (!showSuccess) {
      return;
    }

    const timer = setTimeout(() => {
      router.push("/tech");
    }, 1800);

    return () => clearTimeout(timer);
  }, [router, showSuccess]);

  async function handleSubmit() {
    if (!draft) {
      return;
    }

    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", draft.name);
    formData.set("rating", draft.rating);
    formData.set("panels", draft.panels);
    formData.set("acquisitionType", draft.acquisitionType);
    formData.set("testimonial", draft.testimonial);
    if (draft.customerPhoto) formData.set("customerPhoto", draft.customerPhoto);
    if (draft.houseAfterPhoto) formData.set("houseAfterPhoto", draft.houseAfterPhoto);

    try {
      const response = await fetch(`/api/jobs/${jobId}/finish`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        job?: JobRecord;
        message?: string;
        error?: string;
        partial?: boolean;
        retryCheckoutUrl?: string;
      };

      if (!response.ok) {
        if (payload.job) {
          setJob(payload.job);
        }
        if (payload.retryCheckoutUrl) {
          window.location.href = payload.retryCheckoutUrl;
          return;
        }
        throw new Error(payload.message || payload.error || "Unable to finish job.");
      }

      if (payload.job) {
        setJob(payload.job);
      }
      setSuccessMessage(payload.message || "Review saved and card charged.");
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to finish job.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRetryPayment() {
    setPaymentRetryLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/jobs/${jobId}/retry-payment`, {
        method: "POST",
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Unable to open replacement checkout.");
      }
      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open replacement checkout.");
      setPaymentRetryLoading(false);
    }
  }

  const paneBreakdown = formatPaneBreakdown(job?.pane_counts);
  const canFinish =
    Boolean(job?.started_at) &&
    Boolean(job?.start_photo_url) &&
    !job?.review_id &&
    job?.payment_status !== "captured" &&
    job?.payment_status !== "succeeded";
  const customerPhotoPreviewUrl = useMemo(() => {
    if (!draft?.customerPhoto) {
      return null;
    }
    return URL.createObjectURL(draft.customerPhoto);
  }, [draft?.customerPhoto]);
  const afterPhotoPreviewUrl = useMemo(() => {
    if (!draft?.houseAfterPhoto) {
      return null;
    }
    return URL.createObjectURL(draft.houseAfterPhoto);
  }, [draft?.houseAfterPhoto]);

  useEffect(() => {
    return () => {
      if (customerPhotoPreviewUrl) {
        URL.revokeObjectURL(customerPhotoPreviewUrl);
      }
      if (afterPhotoPreviewUrl) {
        URL.revokeObjectURL(afterPhotoPreviewUrl);
      }
    };
  }, [afterPhotoPreviewUrl, customerPhotoPreviewUrl]);

  return (
    <div className="app-page-shell-soft">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
        <Card className="border-white/70 bg-white/90 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
          <CardHeader>
            <CardTitle className="text-2xl">Finish Job</CardTitle>
            <CardDescription>Collect the review and charge the authorized card in one step.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {loading ? <p className="text-sm text-muted-foreground">Loading job...</p> : null}
            {paymentRetryLoading ? <p className="text-sm text-muted-foreground">Preparing payment retry...</p> : null}

            {job ? (
              <>
                <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Customer</p>
                    <p className="mt-2 text-sm font-semibold">{job.customer?.name || "Customer"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Schedule</p>
                    <p className="mt-2 text-sm font-semibold">{formatSchedule(job)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Address</p>
                    <p className="mt-2 text-sm font-semibold">{job.customer?.address || "Address not set"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Panes</p>
                    <p className="mt-2 text-sm font-semibold">
                      {job.pane_total ? `${job.pane_total} panes` : "Pane count not recorded"}
                    </p>
                    {paneBreakdown ? <p className="mt-1 text-xs text-slate-500">{paneBreakdown}</p> : null}
                  </div>
                </div>

                {job.review_id ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    This job already has a saved review.
                  </div>
                ) : null}

                {job.review_id && job.payment_status !== "captured" && job.payment_status !== "succeeded" ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Payment is still not complete. Collect a different card to finish the charge.
                  </div>
                ) : null}

                {!job.started_at ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    Start the job from the jobs list before finishing and charging it.
                  </div>
                ) : null}

                {job.started_at && !job.start_photo_url ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    This job is missing its before photo. Go back to the start page and capture it there first.
                  </div>
                ) : null}

                {job.payment_status === "captured" || job.payment_status === "succeeded" ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    This job has already been charged.
                  </div>
                ) : null}

                {draft && canFinish ? (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-sm font-semibold">Customer Review</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={draft.name}
                          onChange={(event) => setDraft((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Panels</Label>
                        <Input
                          type="number"
                          min={1}
                          value={draft.panels}
                          onChange={(event) => setDraft((prev) => (prev ? { ...prev, panels: event.target.value } : prev))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rating (1-5)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={draft.rating}
                          onChange={(event) => setDraft((prev) => (prev ? { ...prev, rating: event.target.value } : prev))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Acquisition Type</Label>
                        <select
                          value={draft.acquisitionType}
                          onChange={(event) =>
                            setDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    acquisitionType: event.target.value as ReviewDraft["acquisitionType"],
                                  }
                                : prev
                            )
                          }
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="They called us">They called us</option>
                          <option value="We knocked">We knocked</option>
                        </select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Testimonial</Label>
                        <Textarea
                          value={draft.testimonial}
                          onChange={(event) =>
                            setDraft((prev) => (prev ? { ...prev, testimonial: event.target.value } : prev))
                          }
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Customer Photo (optional)</Label>
                        <Input
                          id="customer-photo"
                          type="file"
                          accept="image/*"
                          className="h-11 file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2"
                          onChange={(event) =>
                            setDraft((prev) => (prev ? { ...prev, customerPhoto: event.target.files?.[0] ?? null } : prev))
                          }
                        />
                        {customerPhotoPreviewUrl ? (
                          <Image
                            src={customerPhotoPreviewUrl}
                            alt="Customer photo preview"
                            width={1200}
                            height={720}
                            className="h-44 w-full rounded-xl border border-slate-200 object-cover"
                            unoptimized
                          />
                        ) : null}
                        <p className="text-xs text-slate-500">
                          {draft.customerPhoto ? draft.customerPhoto.name : "No customer photo selected."}
                        </p>
                      </div>
                      {job.start_photo_url ? (
                        <div className="space-y-2">
                          <Label>House Before Photo</Label>
                          <Image
                            src={job.start_photo_url}
                            alt="Before job photo"
                            width={1200}
                            height={720}
                            className="h-44 w-full rounded-xl border border-slate-200 object-cover"
                            unoptimized
                          />
                          <p className="text-xs text-slate-500">Captured when the tech started the job.</p>
                        </div>
                      ) : null}
                      <div className="space-y-2 sm:col-span-2">
                        <Label>House After Photo</Label>
                        <Input
                          id="house-after-photo"
                          type="file"
                          accept="image/*"
                          className="h-11 file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2"
                          onChange={(event) =>
                            setDraft((prev) => (prev ? { ...prev, houseAfterPhoto: event.target.files?.[0] ?? null } : prev))
                          }
                        />
                        {afterPhotoPreviewUrl ? (
                          <Image
                            src={afterPhotoPreviewUrl}
                            alt="House after photo preview"
                            width={1200}
                            height={720}
                            className="h-44 w-full rounded-xl border border-slate-200 object-cover"
                            unoptimized
                          />
                        ) : null}
                        <p className="text-xs text-slate-500">
                          {draft.houseAfterPhoto
                            ? draft.houseAfterPhoto.name
                            : "Required. Capture the finished house before charging the card."}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button type="button" onClick={handleSubmit} disabled={saving || !draft.houseAfterPhoto}>
                      {saving ? "Finishing..." : "Finish Job, Save Review & Charge"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => router.push("/tech")} disabled={saving}>
                        Back to Jobs
                      </Button>
                    </div>
                  </div>
                ) : null}

                {job.review_id && job.payment_status !== "captured" && job.payment_status !== "succeeded" ? (
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={handleRetryPayment} disabled={paymentRetryLoading}>
                      {paymentRetryLoading ? "Opening Checkout..." : "Collect New Card"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.push("/tech")} disabled={paymentRetryLoading}>
                      Back to Jobs
                    </Button>
                  </div>
                ) : null}
              </>
            ) : null}
          </CardContent>
        </Card>
      </main>

      {showSuccess ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/70 bg-white p-6 text-center shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Success</p>
            <h2 className="mt-2 text-xl font-black text-slate-900">Job finished</h2>
            <p className="mt-3 text-sm text-slate-600">{successMessage}</p>
            <Button type="button" className="mt-5" onClick={() => router.push("/tech")}>
              Back to Jobs
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
