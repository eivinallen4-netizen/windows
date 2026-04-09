import type { Metadata } from "next";
import { MySchedulePanel } from "@/components/my-schedule-panel";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tech Schedule",
};

export default function TechSchedulePage() {
  return (
    <div className="app-page-shell-soft">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        <div className="space-y-6">
          <div className="app-surface-panel px-6 py-8 sm:px-10 sm:py-10">
            <div className="max-w-3xl space-y-4">
              <span className="app-kicker">
                Tech Schedule
              </span>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                  Track your assigned service week.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  This view only shows your own tech schedule for the selected week.
                </p>
              </div>
            </div>
          </div>

          <MySchedulePanel
            role="tech"
            title="Your Tech Schedule"
            description="Assigned tech hours for the week."
          />
        </div>
      </main>
    </div>
  );
}
