import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { hasTursoConfig, tursoExecute } from "@/lib/turso";
import {
  createEmptyWeeklySchedule,
  getWeekDateKeys,
  getWeekStartDateKey,
  type ScheduleRole,
  type ScheduleShift,
  type WeeklyScheduleRecord,
} from "@/lib/schedule-types";

const SCHEDULES_PATH = path.join(process.cwd(), "data", "schedules.json");

function isRole(value: unknown): value is ScheduleRole {
  return value === "rep" || value === "tech";
}

function normalizeShift(value: unknown, weekStart: string): ScheduleShift | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as Partial<ScheduleShift>;
  const weekDays = new Set(getWeekDateKeys(weekStart));
  const startMinute = Number(entry.startMinute);
  const endMinute = Number(entry.endMinute);

  if (
    typeof entry.id !== "string" ||
    typeof entry.userId !== "string" ||
    !isRole(entry.role) ||
    typeof entry.day !== "string" ||
    !weekDays.has(entry.day) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endMinute) ||
    startMinute < 0 ||
    endMinute > 24 * 60 ||
    endMinute <= startMinute
  ) {
    return null;
  }

  return {
    id: entry.id,
    userId: entry.userId,
    role: entry.role,
    day: entry.day,
    startMinute,
    endMinute,
  };
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

export function normalizeWeeklyScheduleRecord(
  value: Partial<WeeklyScheduleRecord> | null | undefined,
  requestedWeekStart?: string
): WeeklyScheduleRecord {
  const weekStart = getWeekStartDateKey(value?.weekStart ?? requestedWeekStart);
  const fallback = createEmptyWeeklySchedule(weekStart);

  return {
    weekStart,
    repActiveUserIds: normalizeStringArray(value?.repActiveUserIds),
    techActiveUserIds: normalizeStringArray(value?.techActiveUserIds),
    shifts: Array.isArray(value?.shifts)
      ? value.shifts
          .map((shift) => normalizeShift(shift, weekStart))
          .filter((shift): shift is ScheduleShift => Boolean(shift))
      : [],
    updated_at:
      typeof value?.updated_at === "string" && value.updated_at.trim().length
        ? value.updated_at
        : fallback.updated_at,
    updated_by:
      typeof value?.updated_by === "string" && value.updated_by.trim().length ? value.updated_by : undefined,
  };
}

async function readAllSchedules(): Promise<WeeklyScheduleRecord[]> {
  if (hasTursoConfig()) {
    const result = await tursoExecute("SELECT data FROM schedules ORDER BY week_start ASC");
    return result.rows
      .map((row) => {
        try {
          return normalizeWeeklyScheduleRecord(JSON.parse(String(row.data)) as Partial<WeeklyScheduleRecord>);
        } catch {
          return null;
        }
      })
      .filter((record): record is WeeklyScheduleRecord => Boolean(record));
  }

  try {
    const payload = await fs.readFile(SCHEDULES_PATH, "utf8");
    const parsed = JSON.parse(payload);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((entry) => normalizeWeeklyScheduleRecord(entry as Partial<WeeklyScheduleRecord>))
      .filter((record): record is WeeklyScheduleRecord => Boolean(record));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function readWeeklySchedule(weekStart?: string) {
  const normalizedWeekStart = getWeekStartDateKey(weekStart);
  const schedules = await readAllSchedules();
  return schedules.find((record) => record.weekStart === normalizedWeekStart) ?? createEmptyWeeklySchedule(normalizedWeekStart);
}

export async function writeWeeklySchedule(record: WeeklyScheduleRecord) {
  const normalized = normalizeWeeklyScheduleRecord(record, record.weekStart);

  if (hasTursoConfig()) {
    await tursoExecute({
      sql: "INSERT OR REPLACE INTO schedules (week_start, updated_at, data) VALUES (?, ?, ?)",
      args: [normalized.weekStart, normalized.updated_at, JSON.stringify(normalized)],
    });
    return;
  }

  const schedules = await readAllSchedules();
  const next = schedules.filter((entry) => entry.weekStart !== normalized.weekStart);
  next.push(normalized);
  next.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  await fs.mkdir(path.dirname(SCHEDULES_PATH), { recursive: true });
  await fs.writeFile(SCHEDULES_PATH, JSON.stringify(next, null, 2), "utf8");
}
