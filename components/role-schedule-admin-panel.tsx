"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { ScheduleBoard } from "@/components/schedule-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SCHEDULE_DEFAULT_SHIFT_MINUTES,
  createEmptyWeeklySchedule,
  fitShiftWithinAllowedBlock,
  formatWeekRangeLabel,
  getAllowedBlocksForDay,
  getShiftActiveUserIds,
  getWeekStartDateKey,
  isShiftWithinAllowedBlocks,
  setShiftActiveUserIds,
  type ScheduleWindowsConfig,
  type ScheduleRole,
  type ScheduleShift,
  type WeeklyScheduleRecord,
} from "@/lib/schedule-types";

type UserRecord = {
  id: string;
  email?: string;
  name?: string;
  role: "admin" | "rep" | "tech";
  is_admin: boolean;
  profile_completed_at?: string;
  invite_status?: "pending" | "expired" | "completed";
};

function shiftWeek(weekStart: string, delta: number) {
  const current = new Date(`${weekStart}T00:00:00`);
  current.setDate(current.getDate() + delta * 7);
  return getWeekStartDateKey(current);
}

function hasShiftConflict(shifts: ScheduleShift[], candidate: ScheduleShift) {
  return shifts.some(
    (shift) =>
      shift.id !== candidate.id &&
      shift.userId === candidate.userId &&
      shift.day === candidate.day &&
      shift.startMinute < candidate.endMinute &&
      candidate.startMinute < shift.endMinute
  );
}

type RoleScheduleAdminPanelProps = {
  role: ScheduleRole;
  title: string;
  description: string;
  boardTitle: string;
  boardDescription: string;
  settingsHref?: string;
};

export function RoleScheduleAdminPanel({
  role,
  title,
  description,
  boardTitle,
  boardDescription,
  settingsHref,
}: RoleScheduleAdminPanelProps) {
  const [weekStart, setWeekStart] = useState(() => getWeekStartDateKey());
  const [record, setRecord] = useState<WeeklyScheduleRecord>(() => createEmptyWeeklySchedule(getWeekStartDateKey()));
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [scheduleWindows, setScheduleWindows] = useState<ScheduleWindowsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [scheduleResponse, usersResponse] = await Promise.all([
          fetch(`/api/schedules?weekStart=${encodeURIComponent(weekStart)}`, { cache: "no-store" }),
          fetch("/api/users?all=true", { cache: "no-store" }),
        ]);

        if (!scheduleResponse.ok) {
          throw new Error("Unable to load weekly schedule.");
        }
        if (!usersResponse.ok) {
          throw new Error("Unable to load team members.");
        }

        const schedulePayload = (await scheduleResponse.json()) as {
          record: WeeklyScheduleRecord;
          scheduleWindows?: ScheduleWindowsConfig;
        };
        const usersPayload = (await usersResponse.json()) as { users: UserRecord[] };

        if (!cancelled) {
          setRecord(schedulePayload.record ?? createEmptyWeeklySchedule(weekStart));
          setScheduleWindows(schedulePayload.scheduleWindows ?? null);
          setUsers(usersPayload.users ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load schedule.");
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

  const workers = useMemo(
    () =>
      users
        .filter(
          (user) =>
            user.role === role &&
            Boolean(user.email) &&
            (Boolean(user.profile_completed_at) || user.invite_status === "completed")
        )
        .map((user) => ({
          id: user.id,
          name: user.name || user.email || (role === "rep" ? "Rep" : "Tech"),
          email: user.email,
        })),
    [role, users]
  );

  function updateRecord(mutator: (current: WeeklyScheduleRecord) => WeeklyScheduleRecord) {
    setStatus(null);
    setError(null);
    setRecord((current) => {
      const next = mutator(current);
      return { ...next, updated_at: new Date().toISOString() };
    });
  }

  function toggleActiveUser(userId: string) {
    updateRecord((current) => {
      const activeUserIds = getShiftActiveUserIds(current, role);
      const nextActiveUserIds = activeUserIds.includes(userId)
        ? activeUserIds.filter((entry) => entry !== userId)
        : [...activeUserIds, userId];

      const nextRecord = setShiftActiveUserIds(current, role, nextActiveUserIds);
      if (!nextActiveUserIds.includes(userId)) {
        return {
          ...nextRecord,
          shifts: nextRecord.shifts.filter((shift) => !(shift.role === role && shift.userId === userId)),
        };
      }
      return nextRecord;
    });
  }

  function createShift(userId: string, day: string, startMinute: number, endMinute?: number) {
    updateRecord((current) => {
      const blocks = getAllowedBlocksForDay(scheduleWindows as ScheduleWindowsConfig, role, day);
      const candidateWindow =
        typeof endMinute === "number"
          ? { startMinute, endMinute }
          : fitShiftWithinAllowedBlock(blocks, startMinute, SCHEDULE_DEFAULT_SHIFT_MINUTES);
      if (
        !candidateWindow ||
        candidateWindow.endMinute - candidateWindow.startMinute < 30 ||
        !isShiftWithinAllowedBlocks(blocks, candidateWindow.startMinute, candidateWindow.endMinute)
      ) {
        setError("That slot is outside the allowed window.");
        return current;
      }
      const candidate: ScheduleShift = {
        id: crypto.randomUUID(),
        userId,
        role,
        day,
        startMinute: candidateWindow.startMinute,
        endMinute: candidateWindow.endMinute,
      };

      if (hasShiftConflict(current.shifts, candidate)) {
        setError("That worker already has overlapping hours in that slot.");
        return current;
      }

      const nextActive = getShiftActiveUserIds(current, role);
      const withUserActive = nextActive.includes(userId)
        ? current
        : setShiftActiveUserIds(current, role, [...nextActive, userId]);

      return {
        ...withUserActive,
        shifts: [...withUserActive.shifts, candidate],
      };
    });
  }

  function moveShiftGroup(shiftIds: string[], day: string, startMinute: number) {
    updateRecord((current) => {
      const scopedShifts = current.shifts.filter((entry) => shiftIds.includes(entry.id) && entry.role === role);
      if (scopedShifts.length === 0) {
        return current;
      }
      const duration = scopedShifts[0].endMinute - scopedShifts[0].startMinute;
      const blocks = getAllowedBlocksForDay(scheduleWindows as ScheduleWindowsConfig, role, day);
      const fitted = fitShiftWithinAllowedBlock(blocks, startMinute, duration);
      if (!fitted) {
        setError("That move falls outside the allowed window.");
        return current;
      }
      const nextCandidates = scopedShifts.map((shift) => ({
        ...shift,
        day,
        startMinute: fitted.startMinute,
        endMinute: fitted.endMinute,
      }));
      if (nextCandidates.some((candidate) => hasShiftConflict(current.shifts, candidate))) {
        setError("That move would overlap existing hours.");
        return current;
      }

      return {
        ...current,
        shifts: current.shifts.map((entry) => nextCandidates.find((candidate) => candidate.id === entry.id) ?? entry),
      };
    });
  }

  function resizeShiftGroup(shiftIds: string[], day: string, startMinute: number, endMinute: number) {
    updateRecord((current) => {
      const scopedShifts = current.shifts.filter((entry) => shiftIds.includes(entry.id) && entry.role === role);
      if (scopedShifts.length === 0) {
        return current;
      }

      const blocks = getAllowedBlocksForDay(scheduleWindows as ScheduleWindowsConfig, role, day);
      if (endMinute - startMinute < 30 || !isShiftWithinAllowedBlocks(blocks, startMinute, endMinute)) {
        setError("That resize falls outside the allowed window.");
        return current;
      }
      const nextCandidates = scopedShifts.map((shift) => ({
        ...shift,
        day,
        startMinute,
        endMinute,
      }));
      if (nextCandidates.some((candidate) => hasShiftConflict(current.shifts, candidate))) {
        setError("That change would overlap another shift.");
        return current;
      }

      return {
        ...current,
        shifts: current.shifts.map((entry) => nextCandidates.find((candidate) => candidate.id === entry.id) ?? entry),
      };
    });
  }

  function deleteShift(shiftId: string) {
    updateRecord((current) => ({
      ...current,
      shifts: current.shifts.filter((entry) => entry.id !== shiftId),
    }));
  }

  async function saveSchedule() {
    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch("/api/schedules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record }),
      });
      const payload = (await response.json()) as { error?: string; record?: WeeklyScheduleRecord };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save schedule.");
      }
      setRecord(payload.record ?? record);
      setStatus("Schedule saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save schedule.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border border-slate-200 bg-white text-slate-900 shadow-lg">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
            onClick={() => startTransition(() => setWeekStart((current) => shiftWeek(current, -1)))}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <div className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200">
            {formatWeekRangeLabel(weekStart)}
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
            onClick={() => startTransition(() => setWeekStart((current) => shiftWeek(current, 1)))}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
          <Button type="button" onClick={saveSchedule} disabled={saving || loading} className="rounded-full">
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Save Week"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {settingsHref ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Time frames still live in admin settings.</p>
              <p className="text-xs text-slate-600">
                Drag a shift from its center to move it, or stretch the top and bottom edges to resize in live 30-minute snaps.
                Update allowed windows in settings, then return here to place hours inside those boundaries.
              </p>
            </div>
            <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100">
              <Link href={settingsHref}>Adjust Time Frames</Link>
            </Button>
          </div>
        ) : null}
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        {status ? <p className="text-sm text-emerald-400">{status}</p> : null}
        {loading ? <p className="text-sm text-slate-600">Loading schedule...</p> : null}
        {!loading && scheduleWindows ? (
          <ScheduleBoard
            title={boardTitle}
            description={boardDescription}
            role={role}
            weekStart={weekStart}
            shifts={record.shifts}
            workers={workers}
            activeUserIds={role === "rep" ? record.repActiveUserIds : record.techActiveUserIds}
            allowedWindows={scheduleWindows}
            canEdit
            onToggleActiveUser={toggleActiveUser}
            onCreateShift={({ userId, day, startMinute, endMinute }) => createShift(userId, day, startMinute, endMinute)}
            onMoveShiftGroup={({ shiftIds, day, startMinute }) => moveShiftGroup(shiftIds, day, startMinute)}
            onResizeShiftGroup={({ shiftIds, day, startMinute, endMinute }) =>
              resizeShiftGroup(shiftIds, day, startMinute, endMinute)
            }
            onDeleteShift={deleteShift}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
