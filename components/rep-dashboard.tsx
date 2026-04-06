"use client";

import { useEffect, useState } from "react";
import { BadgeDollarSign, Clock3, Crown, Trophy, Users, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type RepStatEntry = {
  key: string;
  name: string;
  email: string;
  quoteCount: number;
  quoteRevenue: number;
  paidJobCount: number;
  pendingJobCount: number;
  paidRevenue: number;
  pendingRevenue: number;
  paidPanes: number;
  pendingPanes: number;
  repCut: number;
  pendingCut: number;
  recentWins: number;
  averageTicket: number;
  conversionRate: number;
  score: number;
  tier: string;
  rank: number;
};

type RepStatsPayload = {
  leaderboard: RepStatEntry[];
  myStats: RepStatEntry | null;
  myJobs: Array<{
    jobId: string;
    stripeSessionId: string | null;
    paymentIntentId: string;
    customerName: string;
    amountTotal: number;
    paneTotal: number;
    serviceDate: string | null;
    serviceTime: string | null;
    paymentStatus: "authorized" | "captured" | "succeeded";
    repCut: number;
    lineItems: Array<{
      name: string;
      quantity: number;
      unit_amount: number;
      total_amount: number;
    }>;
  }>;
  viewerEmail: string | null;
  teamSummary: {
    totalReps: number;
    totalQuotes: number;
    totalPaidBookings: number;
    totalPendingBookings: number;
    totalPaidRevenue: number;
    totalPendingRevenue: number;
    totalPaidPanes: number;
    totalPendingPanes: number;
    topCloserName: string | null;
  };
  repCommissionPercent: number;
  repCommissionRate: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function shortId(value: string | null) {
  if (!value) return "Missing";
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export function RepDashboard() {
  const [stats, setStats] = useState<RepStatsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        const response = await fetch("/api/rep-stats", { cache: "no-store" });
        if (!response.ok) {
          if (response.status === 401) {
            if (mounted) setStats(null);
            return;
          }
          throw new Error("Unable to load rep stats.");
        }

        const payload = (await response.json()) as RepStatsPayload;
        if (mounted) {
          setStats(payload);
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setStats(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadStats();
    const interval = window.setInterval(() => {
      void loadStats();
    }, 15000);
    function handleFocus() {
      void loadStats();
    }
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.25)]">
          <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-5 h-20 animate-pulse rounded-3xl bg-slate-100" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.25)]">
          <div className="h-6 w-36 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-5 space-y-3">
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!stats?.myStats) {
    return null;
  }

  const myStats = stats.myStats;
  const teammates = stats.leaderboard.filter((entry) => entry.email !== stats.viewerEmail).slice(0, 5);

  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
      <div className="overflow-hidden rounded-[2rem] border border-[#0b6fb2]/10 bg-[linear-gradient(145deg,#0f172a_0%,#10213d_42%,#12345a_100%)] p-6 text-white shadow-[0_28px_90px_-42px_rgba(11,111,178,0.55)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Badge className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white">
              Rep Cut Board
            </Badge>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
                {myStats.tier}
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
                ${formatCurrency(myStats.repCut).replace("$", "")} earned
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/74 sm:text-base">
                {myStats.name}, this page is locked to your paid cut, panes sold, pending authorized money, and where you sit on the team board.
              </p>
            </div>
          </div>
          <div className="rounded-[1.6rem] border border-white/12 bg-white/8 px-5 py-4 text-right backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Leaderboard Rank</p>
            <p className="mt-2 text-4xl font-black">#{myStats.rank}</p>
            <p className="mt-1 text-sm text-emerald-300">{myStats.paidJobCount} paid jobs closed</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/10 bg-white/8 py-0 text-white shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 text-white/72">
                <BadgeDollarSign className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Your Cut</span>
              </div>
              <p className="mt-4 text-3xl font-black">{formatCurrency(myStats.repCut)}</p>
              <p className="mt-2 text-sm text-white/62">
                {stats.repCommissionPercent}% of {formatCurrency(myStats.paidRevenue)} paid revenue
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/8 py-0 text-white shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 text-white/72">
                <Trophy className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Panels Sold</span>
              </div>
              <p className="mt-4 text-3xl font-black">{myStats.paidPanes}</p>
              <p className="mt-2 text-sm text-white/62">paid panes across {myStats.paidJobCount} booked jobs</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/8 py-0 text-white shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 text-white/72">
                <Clock3 className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Pending Cut</span>
              </div>
              <p className="mt-4 text-3xl font-black">{formatCurrency(myStats.pendingCut)}</p>
              <p className="mt-2 text-sm text-white/62">
                {myStats.pendingJobCount} authorized jobs worth {formatCurrency(myStats.pendingRevenue)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/8 py-0 text-white shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 text-white/72">
                <Wallet className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Pending Panels</span>
              </div>
              <p className="mt-4 text-3xl font-black">{myStats.pendingPanes}</p>
              <p className="mt-2 text-sm text-white/62">authorized but not captured yet</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 rounded-[1.6rem] border border-white/12 bg-black/15 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Status Split</p>
              <p className="mt-1 text-lg font-semibold">Paid jobs count toward cut. Authorized jobs stay pending.</p>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-200">Paid</Badge>
              <Badge className="bg-amber-500/15 text-amber-200">Authorized</Badge>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Paid</p>
              <p className="mt-2 text-2xl font-black text-white">{formatCurrency(myStats.paidRevenue)}</p>
              <p className="mt-1 text-sm text-white/68">{myStats.paidPanes} panes sold and fully paid</p>
            </div>
            <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Authorized</p>
              <p className="mt-2 text-2xl font-black text-white">{formatCurrency(myStats.pendingRevenue)}</p>
              <p className="mt-1 text-sm text-white/68">{myStats.pendingPanes} panes waiting on capture</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0b6fb2]">Team Board</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">See the room</h3>
            </div>
            <Users className="mt-1 size-5 text-[#0b6fb2]" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-3xl bg-slate-950 px-4 py-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Paid Revenue</p>
              <p className="mt-2 text-3xl font-black">{formatCurrency(stats.teamSummary.totalPaidRevenue)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Paid Panes</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{stats.teamSummary.totalPaidPanes}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pending Revenue</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{formatCurrency(stats.teamSummary.totalPendingRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0b6fb2]">Leaderboard</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Teammate stats</h3>
            </div>
            <Crown className="mt-1 size-5 text-amber-500" />
          </div>

          <div className="mt-5 space-y-3">
            {stats.leaderboard.slice(0, 6).map((entry) => {
              const mine = entry.email === stats.viewerEmail;
              return (
                <div
                  key={entry.key}
                  className={`rounded-3xl border px-4 py-4 transition-colors ${
                    mine
                      ? "border-[#0b6fb2]/25 bg-[#eef6ff]"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900">#{entry.rank}</span>
                        <p className="truncate text-sm font-semibold text-slate-900">{entry.name}</p>
                        {mine ? <Badge className="bg-[#0b6fb2] text-white">You</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{entry.tier}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-slate-900">{entry.score.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">score</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Cut</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatCurrency(entry.repCut)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Panes</p>
                      <p className="mt-1 font-semibold text-slate-900">{entry.paidPanes}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pending</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatCurrency(entry.pendingCut)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {teammates.length > 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Top teammate right now: <span className="font-semibold text-slate-900">{teammates[0]?.name}</span>
            </p>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0b6fb2]">Stripe Linked Jobs</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Your paid and authorized jobs</h3>
            </div>
            <Wallet className="mt-1 size-5 text-[#0b6fb2]" />
          </div>

          <div className="mt-5 space-y-3">
            {stats.myJobs.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No Stripe-linked jobs yet.
              </div>
            ) : (
              stats.myJobs.map((job) => (
                <div key={job.paymentIntentId} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{job.customerName}</p>
                        <Badge className={job.paymentStatus === "authorized" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
                          {job.paymentStatus === "authorized" ? "Authorized" : "Paid"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {job.serviceDate || "No date"}{job.serviceTime ? ` at ${job.serviceTime}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">{formatCurrency(job.amountTotal)}</p>
                      <p className="text-xs text-slate-500">
                        cut {formatCurrency(job.repCut)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-900">Panes:</span> {job.paneTotal}
                    </p>
                    {job.lineItems.length ? (
                      <p>
                        <span className="font-semibold text-slate-900">Items:</span>{" "}
                        {job.lineItems.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                      </p>
                    ) : null}
                    <p>
                      <span className="font-semibold text-slate-900">Payment Intent:</span> {shortId(job.paymentIntentId)}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Checkout Session:</span> {shortId(job.stripeSessionId)}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Job ID:</span> {shortId(job.jobId)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
