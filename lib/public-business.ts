import {
  WEEKDAY_KEYS,
  defaultWeeklyAllowedWindows,
  formatMinuteLabel,
  normalizeWeeklyAllowedWindows,
  type WeekdayKey,
  type WeeklyAllowedWindows,
} from "@/lib/schedule-types";

export const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/purebinwindowclean/";

const MAX_MEDIA_URL_LEN = 2048;
const MAX_SERVICE_SECTION_IMAGES = 12;
const MAX_RANDOM_BACKGROUNDS = 24;

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
  /** Stored ref: `r2:…`, `/uploads/…`, or `https://` image URL. */
  heroBackgroundImageUrl: string;
  /** Subtle full-page backdrop behind public content. */
  pageBackdropImageUrl: string;
  /** Shown on the homepage services / gallery strip. */
  serviceSectionImageUrls: string[];
  /** Pool; one image is picked per page load (client) for an accent section. */
  randomBackgroundImageUrls: string[];
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
  heroBackgroundImageUrl: "",
  pageBackdropImageUrl: "",
  serviceSectionImageUrls: [],
  randomBackgroundImageUrls: [],
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

function normalizeStoredMediaUrl(raw: unknown): string {
  const trimmed = String(raw ?? "").trim().slice(0, MAX_MEDIA_URL_LEN);
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("r2:")) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("/api/files")) {
    return trimmed;
  }
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }
  return "";
}

function normalizeStoredMediaUrlList(raw: unknown, maxItems: number): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    const url = normalizeStoredMediaUrl(entry);
    if (!url || seen.has(url)) {
      continue;
    }
    seen.add(url);
    out.push(url);
    if (out.length >= maxItems) {
      break;
    }
  }
  return out;
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
    heroBackgroundImageUrl:
      normalizeStoredMediaUrl(value?.heroBackgroundImageUrl) ||
      defaultPublicBusinessConfig.heroBackgroundImageUrl,
    pageBackdropImageUrl:
      normalizeStoredMediaUrl(value?.pageBackdropImageUrl) ||
      defaultPublicBusinessConfig.pageBackdropImageUrl,
    serviceSectionImageUrls: normalizeStoredMediaUrlList(
      value?.serviceSectionImageUrls,
      MAX_SERVICE_SECTION_IMAGES,
    ),
    randomBackgroundImageUrls: normalizeStoredMediaUrlList(
      value?.randomBackgroundImageUrls,
      MAX_RANDOM_BACKGROUNDS,
    ),
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
