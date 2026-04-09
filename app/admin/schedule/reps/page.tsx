import type { Metadata } from "next";
import Link from "next/link";
import { RoleScheduleAdminPanel } from "@/components/role-schedule-admin-panel";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Rep Schedule Admin",
};

export default function AdminRepSchedulePage() {
  return (
    <div className="app-page-shell px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="app-surface-panel flex flex-wrap items-center justify-between gap-3 px-6 py-6 sm:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Admin Schedule</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Rep Schedule</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Select which reps are working for the week and drag their knocking hours onto the board.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100">
              <Link href="/admin?section=pricing#schedule-windows">Adjust Time Frames</Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100">
              <Link href="/admin">Back to Admin</Link>
            </Button>
          </div>
        </div>

        <RoleScheduleAdminPanel
          role="rep"
          title="Weekly Rep Schedule"
          description="Week-by-week rep scheduling with live move and stretch interactions."
          boardTitle="Rep Board"
          boardDescription="Choose who is working this week, drag shifts into place, and stretch the top or bottom edge to adjust hours live."
          settingsHref="/admin?section=pricing#schedule-windows"
        />
      </div>
    </div>
  );
}
