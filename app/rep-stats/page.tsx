import type { Metadata } from "next";
import { RepDashboard } from "@/components/rep-dashboard";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Rep Stats",
};

export default function RepStatsPage() {
  return (
    <div className="app-page-shell">
      <SiteHeader />
      <main className="px-4 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="app-surface-panel px-6 py-8 sm:px-10 sm:py-10">
            <div className="max-w-3xl space-y-4">
              <span className="app-kicker">
                Rep Stats
              </span>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                  Track your board and see the team race live.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
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
