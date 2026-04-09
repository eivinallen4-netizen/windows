export type ScheduleRole = "rep" | "tech";
export type WeekdayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type AllowedTimeBlock = {
  startMinute: number;
  endMinute: number;
};

export type AllowedDayWindows = AllowedTimeBlock[];
export type WeeklyAllowedWindows = Record<WeekdayKey, AllowedDayWindows>;
export type ScheduleWindowsConfig = {
  rep: WeeklyAllowedWindows;
  tech: WeeklyAllowedWindows;
};

export type ScheduleShift = {
  id: string;
  userId: string;
  role: ScheduleRole;
  day: string;
  startMinute: number;
  endMinute: number;
};

export type WeeklyScheduleRecord = {
  weekStart: string;
  repActiveUserIds: string[];
  techActiveUserIds: string[];
  shifts: ScheduleShift[];
  updated_at: string;
  updated_by?: string;
};

export const SCHEDULE_SLOT_MINUTES = 30;
export const SCHEDULE_START_MINUTE = 13 * 60;
export const SCHEDULE_END_MINUTE = 21 * 60;
export const SCHEDULE_DEFAULT_SHIFT_MINUTES = 120;
export const WEEKDAY_KEYS: WeekdayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const defaultWeeklyAllowedWindows: WeeklyAllowedWindows = {
  monday: [{ startMinute: SCHEDULE_START_MINUTE, endMinute: SCHEDULE_END_MINUTE }],
  tuesday: [{ startMinute: SCHEDULE_START_MINUTE, endMinute: SCHEDULE_END_MINUTE }],
  wednesday: [{ startMinute: SCHEDULE_START_MINUTE, endMinute: SCHEDULE_END_MINUTE }],
  thursday: [{ startMinute: SCHEDULE_START_MINUTE, endMinute: SCHEDULE_END_MINUTE }],
  friday: [{ startMinute: SCHEDULE_START_MINUTE, endMinute: SCHEDULE_END_MINUTE }],
  saturday: [{ startMinute: SCHEDULE_START_MINUTE, endMinute: SCHEDULE_END_MINUTE }],
  sunday: [{ startMinute: SCHEDULE_START_MINUTE, endMinute: SCHEDULE_END_MINUTE }],
};

export const defaultScheduleWindows: ScheduleWindowsConfig = {
  rep: defaultWeeklyAllowedWindows,
  tech: defaultWeeklyAllowedWindows,
};

export function toDateKey(input: Date) {
  const year = input.getFullYear();
  const month = `${input.getMonth() + 1}`.padStart(2, "0");
  const day = `${input.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function getWeekdayKeyFromDateKey(value: string): WeekdayKey {
  const date = parseDateKey(value);
  const day = (date.getDay() + 6) % 7;
  return WEEKDAY_KEYS[day] ?? "monday";
}

function normalizeBlockValue(value: unknown): AllowedTimeBlock | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const block = value as Partial<AllowedTimeBlock>;
  const startMinute = Number(block.startMinute);
  const endMinute = Number(block.endMinute);

  if (
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endMinute) ||
    startMinute < 0 ||
    endMinute > 24 * 60 ||
    endMinute <= startMinute
  ) {
    return null;
  }

  return { startMinute, endMinute };
}

export function normalizeAllowedDayWindows(value: unknown): AllowedDayWindows {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeBlockValue(entry))
    .filter((entry): entry is AllowedTimeBlock => Boolean(entry))
    .toSorted((a, b) => a.startMinute - b.startMinute);
}

export function normalizeWeeklyAllowedWindows(value: Partial<WeeklyAllowedWindows> | null | undefined): WeeklyAllowedWindows {
  return {
    monday: normalizeAllowedDayWindows(value?.monday ?? defaultWeeklyAllowedWindows.monday),
    tuesday: normalizeAllowedDayWindows(value?.tuesday ?? defaultWeeklyAllowedWindows.tuesday),
    wednesday: normalizeAllowedDayWindows(value?.wednesday ?? defaultWeeklyAllowedWindows.wednesday),
    thursday: normalizeAllowedDayWindows(value?.thursday ?? defaultWeeklyAllowedWindows.thursday),
    friday: normalizeAllowedDayWindows(value?.friday ?? defaultWeeklyAllowedWindows.friday),
    saturday: normalizeAllowedDayWindows(value?.saturday ?? defaultWeeklyAllowedWindows.saturday),
    sunday: normalizeAllowedDayWindows(value?.sunday ?? defaultWeeklyAllowedWindows.sunday),
  };
}

export function normalizeScheduleWindowsConfig(
  value: Partial<ScheduleWindowsConfig> | null | undefined
): ScheduleWindowsConfig {
  return {
    rep: normalizeWeeklyAllowedWindows(value?.rep),
    tech: normalizeWeeklyAllowedWindows(value?.tech),
  };
}

export function getWeekStartDateKey(value?: string | Date) {
  const seed =
    value instanceof Date
      ? new Date(value)
      : typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? parseDateKey(value)
        : new Date();

  if (Number.isNaN(seed.getTime())) {
    return getWeekStartDateKey(new Date());
  }

  seed.setHours(0, 0, 0, 0);
  const offset = (seed.getDay() + 6) % 7;
  seed.setDate(seed.getDate() - offset);
  return toDateKey(seed);
}

export function getWeekDateKeys(weekStart: string) {
  const start = parseDateKey(getWeekStartDateKey(weekStart));
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return toDateKey(current);
  });
}

export function createEmptyWeeklySchedule(weekStart: string): WeeklyScheduleRecord {
  return {
    weekStart: getWeekStartDateKey(weekStart),
    repActiveUserIds: [],
    techActiveUserIds: [],
    shifts: [],
    updated_at: new Date().toISOString(),
  };
}

export function formatMinuteLabel(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${`${minute}`.padStart(2, "0")} ${suffix}`;
}

export function formatDayLabel(value: string) {
  const date = parseDateKey(value);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatWeekdayLabel(value: WeekdayKey) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1, 3)}`;
}

export function formatWeekRangeLabel(weekStart: string) {
  const [firstDay, , , , , , lastDay] = getWeekDateKeys(weekStart);
  const start = parseDateKey(firstDay);
  const end = parseDateKey(lastDay);
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endLabel = end.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} - ${endLabel}`;
}

export function getShiftActiveUserIds(record: WeeklyScheduleRecord, role: ScheduleRole) {
  return role === "rep" ? record.repActiveUserIds : record.techActiveUserIds;
}

export function setShiftActiveUserIds(record: WeeklyScheduleRecord, role: ScheduleRole, userIds: string[]) {
  return role === "rep"
    ? { ...record, repActiveUserIds: userIds }
    : { ...record, techActiveUserIds: userIds };
}

export function getAllowedBlocksForDay(
  scheduleWindows: ScheduleWindowsConfig | WeeklyAllowedWindows,
  roleOrDay: ScheduleRole | WeekdayKey,
  maybeDay?: string
) {
  if (typeof maybeDay === "string") {
    const role = roleOrDay as ScheduleRole;
    const dayKey = getWeekdayKeyFromDateKey(maybeDay);
    return normalizeScheduleWindowsConfig(scheduleWindows as ScheduleWindowsConfig)[role][dayKey];
  }

  return normalizeWeeklyAllowedWindows(scheduleWindows as WeeklyAllowedWindows)[roleOrDay as WeekdayKey];
}

export function findAllowedBlockContainingMinute(blocks: AllowedDayWindows, minute: number) {
  return blocks.find((block) => minute >= block.startMinute && minute < block.endMinute) ?? null;
}

export function fitShiftWithinAllowedBlock(
  blocks: AllowedDayWindows,
  startMinute: number,
  desiredDuration: number
) {
  const block = findAllowedBlockContainingMinute(blocks, startMinute);
  if (!block) {
    return null;
  }

  const endMinute = Math.min(block.endMinute, startMinute + desiredDuration);
  if (endMinute - startMinute < SCHEDULE_SLOT_MINUTES) {
    return null;
  }

  return {
    startMinute,
    endMinute,
    block,
  };
}

export function isShiftWithinAllowedBlocks(
  blocks: AllowedDayWindows,
  startMinute: number,
  endMinute: number
) {
  return blocks.some((block) => startMinute >= block.startMinute && endMinute <= block.endMinute);
}
