"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";
import { ScheduleBoard } from "@/components/schedule-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatWeekRangeLabel,
  getWeekStartDateKey,
  type ScheduleWindowsConfig,
  type ScheduleRole,
  type ScheduleShift,
  type WeeklyScheduleRecord,
} from "@/lib/schedule-types";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "rep" | "tech";
};

function shiftWeek(weekStart: string, delta: number) {
  const current = new Date(`${weekStart}T00:00:00`);
  current.setDate(current.getDate() + delta * 7);
  return getWeekStartDateKey(current);
}

type MySchedulePanelProps = {
  role: ScheduleRole;
  title: string;
  description: string;
};

export function MySchedulePanel({ role, title, description }: MySchedulePanelProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [weekStart, setWeekStart] = useState(() => getWeekStartDateKey());
  const [record, setRecord] = useState<WeeklyScheduleRecord | null>(null);
  const [scheduleWindows, setScheduleWindows] = useState<ScheduleWindowsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [userResponse, scheduleResponse] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch(`/api/schedules?weekStart=${encodeURIComponent(weekStart)}`, { cache: "no-store" }),
        ]);

        if (!userResponse.ok) {
          throw new Error("You need to sign in to view your schedule.");
        }
        if (!scheduleResponse.ok) {
          throw new Error("Unable to load your schedule.");
        }

        const userPayload = (await userResponse.json()) as { user?: AuthUser };
        const schedulePayload = (await scheduleResponse.json()) as {
          record?: WeeklyScheduleRecord;
          scheduleWindows?: ScheduleWindowsConfig;
        };

        if (!cancelled) {
          setUser(userPayload.user ?? null);
          setRecord(schedulePayload.record ?? null);
          setScheduleWindows(schedulePayload.scheduleWindows ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load your schedule.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  const ownShifts = useMemo<ScheduleShift[]>(() => record?.shifts ?? [], [record?.shifts]);
  const ownWorker = useMemo(
    () =>
      user
        ? [{ id: user.id, name: user.name || user.email, email: user.email }]
        : [],
    [user]
  );

  return (
    <Card className="border-white/70 bg-white/90 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => startTransition(() => setWeekStart((current) => shiftWeek(current, -1)))}>
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <div className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            {formatWeekRangeLabel(weekStart)}
          </div>
          <Button type="button" variant="outline" onClick={() => startTransition(() => setWeekStart((current) => shiftWeek(current, 1)))}>
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading ? <p className="text-sm text-slate-500">Loading schedule...</p> : null}
        {!loading && !error && ownShifts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-8 text-center">
            <p className="text-sm text-slate-600">No hours scheduled for this week yet.</p>
          </div>
        ) : null}
        {!loading && !error && record && user && scheduleWindows ? (
          <ScheduleBoard
            title="Your Week"
            description="This is your assigned weekly schedule."
            role={role}
            weekStart={weekStart}
            shifts={ownShifts}
            workers={ownWorker}
            activeUserIds={[user.id]}
            allowedWindows={scheduleWindows}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
