import { RepDashboard } from "@/components/rep-dashboard";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default function RepStatsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(11,111,178,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f3f7fb_55%,_#eef4f8_100%)]">
      <SiteHeader />
      <main className="px-4 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 px-6 py-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur sm:px-10 sm:py-10">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center rounded-full border border-[#0b6fb2]/20 bg-[#0b6fb2]/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#0b6fb2]">
                Rep Stats
              </span>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  Track your board and see the team race live.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Closed jobs, panes sold, close rate, and team rank all live here now, away from the quote page.
                </p>
              </div>
            </div>
          </div>

          <RepDashboard />
        </div>
      </main>
    </div>
  );
}
