"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PaneCounts } from "@/lib/jobs";

type JobRecord = {
  id: string;
  customer?: { name?: string; email?: string; address?: string };
  pane_counts?: PaneCounts;
  pane_total?: number;
  service_date?: string;
  service_time?: string;
  payment_status?: string;
  started_at?: string;
  walkthrough_confirmed_at?: string;
  completed_at?: string;
  review_id?: string;
};

function getSortValue(job: JobRecord) {
  if (!job.service_date) {
    return Number.POSITIVE_INFINITY;
  }

  if (job.service_time) {
    return new Date(`${job.service_date}T${job.service_time}:00`).getTime();
  }

  return new Date(`${job.service_date}T23:59:59`).getTime();
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

function getHoursWorked(job: JobRecord) {
  if (!job.started_at || !job.completed_at) {
    return 0;
  }

  const started = new Date(job.started_at).getTime();
  const completed = new Date(job.completed_at).getTime();
  const diff = (completed - started) / (1000 * 60 * 60);
  return Number.isFinite(diff) && diff > 0 ? diff : 0;
}

function formatHours(hours: number) {
  if (!hours) {
    return "0.0";
  }
  return hours.toFixed(1);
}

function getScoreTitle(panes: number) {
  if (panes >= 250) return "Pane Beast";
  if (panes >= 150) return "Glass Closer";
  if (panes >= 75) return "Window Runner";
  if (panes >= 25) return "Field Starter";
  return "Clocked In";
}

export default function TechPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Tech Portal | PureBin Window Cleaning";
  }, []);

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/jobs");
        if (!response.ok) {
          throw new Error("Unable to load jobs.");
        }
        const payload = (await response.json()) as { jobs: JobRecord[] };
        setJobs(payload.jobs ?? []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load jobs.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, []);

  const completedJobs = useMemo(() => jobs.filter((job) => Boolean(job.completed_at)), [jobs]);

  const activeJobs = useMemo(() => {
    return jobs
      .filter((job) => !job.completed_at)
      .sort((a, b) => getSortValue(a) - getSortValue(b));
  }, [jobs]);

  const score = useMemo(() => {
    const totalPanes = completedJobs.reduce((sum, job) => sum + (job.pane_total || 0), 0);
    const totalHouses = completedJobs.length;
    const totalHours = completedJobs.reduce((sum, job) => sum + getHoursWorked(job), 0);
    const panesPerHour = totalHours > 0 ? totalPanes / totalHours : 0;
    const hoursPerPane = totalPanes > 0 ? totalHours / totalPanes : 0;

    return {
      totalPanes,
      totalHouses,
      totalHours,
      panesPerHour,
      hoursPerPane,
      title: getScoreTitle(totalPanes),
    };
  }, [completedJobs]);

  return (
    <div className="app-page-shell-soft">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        <section className="mb-6 overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(11,111,178,0.12),rgba(255,255,255,0.94)_38%,rgba(11,111,178,0.08))] shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
          <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div className="space-y-4">
              <span className="app-kicker">
                Tech Portal
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  {activeJobs.length === 0 ? "Queue clear." : "Focus on the next house."}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Completed jobs fall out of the active queue. Your score stays up top so the page feels like progress, not paperwork.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-slate-950 px-5 py-5 text-white shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Pane Score</p>
                <p className="mt-3 text-5xl font-black tracking-tight">{score.totalPanes}</p>
                <p className="mt-2 text-sm text-white/70">{score.title}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white px-5 py-5 text-slate-900 shadow-xl ring-1 ring-slate-200/80">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Completed Houses</p>
                <p className="mt-3 text-4xl font-black tracking-tight">{score.totalHouses}</p>
                <p className="mt-2 text-sm text-slate-500">{formatHours(score.totalHours)} total hours on the clock</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="border-white/70 bg-white/90 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
            <CardContent className="px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Panes</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-primary">{score.totalPanes}</p>
            </CardContent>
          </Card>
          <Card className="border-white/70 bg-white/90 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
            <CardContent className="px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Houses Done</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">{score.totalHouses}</p>
            </CardContent>
          </Card>
          <Card className="border-white/70 bg-white/90 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
            <CardContent className="px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Hours Worked</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">{formatHours(score.totalHours)}</p>
            </CardContent>
          </Card>
          <Card className="border-white/70 bg-white/90 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
            <CardContent className="px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pace</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                {score.panesPerHour ? `${score.panesPerHour.toFixed(1)} panes/hr` : "No pace yet"}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {score.hoursPerPane ? `${score.hoursPerPane.toFixed(2)} hrs per pane` : "Finish jobs to build your score"}
              </p>
            </CardContent>
          </Card>
        </section>

        <Card className="w-full border-white/70 bg-white/90 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
          <CardHeader className="pb-5">
            <CardTitle className="text-2xl">Active Jobs</CardTitle>
            <CardDescription>
              Only unfinished jobs stay here. When a job is done, it drops out and your score updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {loading ? <p className="text-sm text-muted-foreground">Loading jobs...</p> : null}

            {activeJobs.length === 0 && !loading ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-6 py-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">All Clear</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">No active jobs left.</h2>
                <p className="mt-3 text-sm text-slate-600">
                  You finished the queue. Pane score, houses done, and pace are still tracked above.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {activeJobs.map((job) => {
                  const paneBreakdown = formatPaneBreakdown(job.pane_counts);
                  const jobStatus = job.started_at ? "In progress" : "New";
                  const finishDisabled = !job.started_at;

                  return (
                    <Card key={job.id} className="overflow-hidden border border-slate-200 shadow-sm">
                      <CardHeader className="gap-4 bg-slate-50/80">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <CardTitle className="text-lg text-slate-900">
                              {job.customer?.name || "Customer"}
                            </CardTitle>
                            <div className="space-y-1 text-sm text-slate-600">
                              <p>{formatSchedule(job)}</p>
                              <p>{job.customer?.address || "Address not set"}</p>
                              <p>{job.pane_total ? `${job.pane_total} panes` : "Pane count not recorded"}</p>
                              {paneBreakdown ? <p className="text-xs text-slate-500">{paneBreakdown}</p> : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                              {jobStatus}
                            </span>
                            <span className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                              Payment: {job.payment_status || "pending"}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Button asChild variant="outline" className="rounded-full">
                            <Link href={`/tech/jobs/${job.id}`}>
                              {job.started_at ? "Open Job" : "Start Job"}
                            </Link>
                          </Button>
                          {finishDisabled ? (
                            <Button type="button" className="rounded-full bg-primary hover:bg-primary/90" disabled>
                              Finish Job
                            </Button>
                          ) : (
                            <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
                              <Link href={`/tech/jobs/${job.id}/finish`}>Finish Job</Link>
                            </Button>
                          )}
                        </div>
                        {finishDisabled ? (
                          <p className="text-xs text-muted-foreground">
                            Start the job before finishing and charging it.
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
