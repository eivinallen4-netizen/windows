import {
  WEEKDAY_KEYS,
  defaultWeeklyAllowedWindows,
  formatMinuteLabel,
  normalizeWeeklyAllowedWindows,
  type WeekdayKey,
  type WeeklyAllowedWindows,
} from "@/lib/schedule-types";

export const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/purebinwindowclean/";

export type PublicBusinessConfig = {
  servingSinceYear: number;
  publishedHours: WeeklyAllowedWindows;
  serviceAreaBusiness: boolean;
  callOnly: boolean;
  licenseStatusPublic: boolean;
  insuredPublic: boolean;
  gbpUrl?: string;
  sameAsLinks: string[];
  commercialProofEnabled: boolean;
};

export const defaultPublicBusinessConfig: PublicBusinessConfig = {
  servingSinceYear: 2022,
  publishedHours: defaultWeeklyAllowedWindows,
  serviceAreaBusiness: true,
  callOnly: true,
  licenseStatusPublic: true,
  insuredPublic: false,
  gbpUrl: "",
  sameAsLinks: [DEFAULT_INSTAGRAM_URL],
  commercialProofEnabled: false,
};

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeSameAsLinks(value: unknown) {
  if (!Array.isArray(value)) {
    return [...defaultPublicBusinessConfig.sameAsLinks];
  }

  const deduped = new Set<string>();
  for (const entry of value) {
    const normalized = String(entry ?? "").trim();
    if (normalized) {
      deduped.add(normalized);
    }
  }

  return Array.from(deduped);
}

export function normalizePublicBusinessConfig(
  value: Partial<PublicBusinessConfig> | null | undefined,
  fallbackHours: WeeklyAllowedWindows = defaultWeeklyAllowedWindows,
): PublicBusinessConfig {
  return {
    servingSinceYear:
      isNumber(value?.servingSinceYear) && value.servingSinceYear >= 1900
        ? Math.floor(value.servingSinceYear)
        : defaultPublicBusinessConfig.servingSinceYear,
    publishedHours: normalizeWeeklyAllowedWindows(value?.publishedHours ?? fallbackHours),
    serviceAreaBusiness: value?.serviceAreaBusiness ?? defaultPublicBusinessConfig.serviceAreaBusiness,
    callOnly: value?.callOnly ?? defaultPublicBusinessConfig.callOnly,
    licenseStatusPublic: value?.licenseStatusPublic ?? defaultPublicBusinessConfig.licenseStatusPublic,
    insuredPublic: value?.insuredPublic ?? defaultPublicBusinessConfig.insuredPublic,
    gbpUrl: String(value?.gbpUrl ?? "").trim(),
    sameAsLinks: normalizeSameAsLinks(value?.sameAsLinks),
    commercialProofEnabled: value?.commercialProofEnabled ?? defaultPublicBusinessConfig.commercialProofEnabled,
  };
}

function formatMinuteValue(minute: number) {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${`${hours}`.padStart(2, "0")}:${`${minutes}`.padStart(2, "0")}`;
}

function formatDayHours(day: WeekdayKey, hours: WeeklyAllowedWindows) {
  const blocks = hours[day];
  if (!blocks.length) {
    return "Closed";
  }
  return blocks.map((block) => `${formatMinuteLabel(block.startMinute)} - ${formatMinuteLabel(block.endMinute)}`).join(", ");
}

export function getPublishedHoursLines(hours: WeeklyAllowedWindows) {
  return WEEKDAY_KEYS.map((day) => ({
    day,
    label: `${day.charAt(0).toUpperCase()}${day.slice(1, 3)}`,
    value: formatDayHours(day, hours),
  }));
}

export function getPublishedHoursSummary(hours: WeeklyAllowedWindows) {
  const [firstDay, ...restDays] = WEEKDAY_KEYS;
  const firstValue = formatDayHours(firstDay, hours);
  if (restDays.every((day) => formatDayHours(day, hours) === firstValue)) {
    return [`Mon-Sun: ${firstValue}`];
  }

  return getPublishedHoursLines(hours).map((entry) => `${entry.label}: ${entry.value}`);
}

const SCHEMA_DAY_OF_WEEK: Record<WeekdayKey, string> = {
  monday: "https://schema.org/Monday",
  tuesday: "https://schema.org/Tuesday",
  wednesday: "https://schema.org/Wednesday",
  thursday: "https://schema.org/Thursday",
  friday: "https://schema.org/Friday",
  saturday: "https://schema.org/Saturday",
  sunday: "https://schema.org/Sunday",
};

export function buildOpeningHoursSpecification(hours: WeeklyAllowedWindows) {
  return WEEKDAY_KEYS.flatMap((day) =>
    hours[day].map((block) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAY_OF_WEEK[day],
      opens: formatMinuteValue(block.startMinute),
      closes: formatMinuteValue(block.endMinute),
    })),
  );
}
