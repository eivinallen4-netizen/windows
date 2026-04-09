import type { Metadata } from "next";
import { MySchedulePanel } from "@/components/my-schedule-panel";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "My Schedule",
};

export default function RepSchedulePage() {
  return (
    <div className="app-page-shell">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        <div className="space-y-6">
          <div className="app-surface-panel px-6 py-8 sm:px-10 sm:py-10">
            <div className="max-w-3xl space-y-4">
              <span className="app-kicker">
                Rep Schedule
              </span>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  See your knocking week at a glance.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  This view is read-only and only shows your assigned rep schedule for the selected week.
                </p>
              </div>
            </div>
          </div>

          <MySchedulePanel
            role="rep"
            title="Your Rep Schedule"
            description="Assigned knocking hours for the week."
          />
        </div>
      </main>
    </div>
  );
}
