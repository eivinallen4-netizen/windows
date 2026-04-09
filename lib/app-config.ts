import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { defaultPricing, type Pricing } from "@/lib/pricing";
import { defaultScheduleWindows, normalizeScheduleWindowsConfig, type ScheduleWindowsConfig } from "@/lib/schedule-types";
import { hasTursoConfig, tursoExecute } from "@/lib/turso";

export type AppPlan = "free" | "pro";

export type AppConfig = {
  pricing: Pricing;
  addonsConfig: AddonConfig[];
  repCommissionPercent: number;
  scheduleWindows: ScheduleWindowsConfig;
  plans: {
    activePlan: AppPlan;
    free: {
      addonsFree: boolean;
    };
  };
};

const APP_CONFIG_PATH = path.join(process.cwd(), "data", "app-config.json");
const LEGACY_PRICING_PATH = path.join(process.cwd(), "data", "pricing.json");

export type AddonConfig = {
  id: keyof Pricing["addons"];
  label: string;
  description: string;
  price: number;
  free: boolean;
};

const defaultAddonsConfig: AddonConfig[] = [
  {
    id: "screen",
    label: "Screen cleaning",
    description: "Clear debris and buildup for better airflow.",
    price: defaultPricing.addons.screen,
    free: false,
  },
  {
    id: "track",
    label: "Track cleaning",
    description: "Remove grit and grime from window tracks.",
    price: defaultPricing.addons.track,
    free: false,
  },
  {
    id: "hard_water",
    label: "Hard water removal",
    description: "Lift mineral deposits and water spots.",
    price: defaultPricing.addons.hard_water,
    free: false,
  },
  {
    id: "interior",
    label: "Interior cleaning",
    description: "Freshen glass and frames from the inside.",
    price: defaultPricing.addons.interior,
    free: false,
  },
];

export const defaultAppConfig: AppConfig = {
  pricing: defaultPricing,
  addonsConfig: defaultAddonsConfig,
  repCommissionPercent: 25,
  scheduleWindows: defaultScheduleWindows,
  plans: {
    activePlan: "pro",
    free: {
      addonsFree: true,
    },
  },
};

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPricing(value: unknown): value is Pricing {
  if (!value || typeof value !== "object") return false;
  const pricing = value as Pricing;
  return (
    isNumber(pricing.paneTypes?.standard) &&
    isNumber(pricing.paneTypes?.specialty) &&
    isNumber(pricing.paneTypes?.french) &&
    isNumber(pricing.storySurcharge?.third_plus) &&
    isNumber(pricing.addons?.screen) &&
    isNumber(pricing.addons?.track) &&
    isNumber(pricing.addons?.hard_water) &&
    isNumber(pricing.addons?.interior) &&
    isNumber(pricing.jobMinimum)
  );
}

function isAppConfig(value: unknown): value is AppConfig {
  if (!value || typeof value !== "object") return false;
  const config = value as AppConfig;
  return (
    isPricing(config.pricing) &&
    (config.repCommissionPercent === undefined || isNumber(config.repCommissionPercent)) &&
    (config.scheduleWindows === undefined || typeof config.scheduleWindows === "object") &&
    (config.plans?.activePlan === "free" || config.plans?.activePlan === "pro") &&
    typeof config.plans?.free?.addonsFree === "boolean"
  );
}

function normalizeAddonsConfig(input?: AddonConfig[]) {
  const byId = new Map<AddonConfig["id"], AddonConfig>();
  for (const item of input ?? []) {
    if (!item || typeof item !== "object") continue;
    if (!["screen", "track", "hard_water", "interior"].includes(item.id)) continue;
    const fallback = defaultAddonsConfig.find((entry) => entry.id === item.id);
    byId.set(item.id, {
      id: item.id,
      label: item.label || fallback?.label || item.id,
      description: item.description || fallback?.description || "",
      price: isNumber(item.price) ? item.price : fallback?.price ?? 0,
      free: Boolean(item.free),
    });
  }

  return defaultAddonsConfig.map((entry) => byId.get(entry.id) ?? entry);
}

async function tryReadLegacyPricing(): Promise<Pricing | null> {
  try {
    const data = await fs.readFile(LEGACY_PRICING_PATH, "utf8");
    const parsed = JSON.parse(data) as unknown;
    return isPricing(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeConfig(config: AppConfig): AppConfig {
  const normalizedAddons = normalizeAddonsConfig(config.addonsConfig);
  return {
    ...config,
    repCommissionPercent: isNumber(config.repCommissionPercent)
      ? config.repCommissionPercent
      : defaultAppConfig.repCommissionPercent,
    scheduleWindows: normalizeScheduleWindowsConfig(config.scheduleWindows),
    pricing: {
      ...config.pricing,
      addons: normalizedAddons.reduce<Pricing["addons"]>((acc, addon) => {
        acc[addon.id] = addon.free ? 0 : addon.price;
        return acc;
      }, { ...config.pricing.addons }),
    },
    addonsConfig: normalizedAddons,
  };
}

async function getSeededConfig() {
  const legacyPricing = await tryReadLegacyPricing();
  const seeded = {
    ...defaultAppConfig,
    pricing: legacyPricing ?? defaultAppConfig.pricing,
  };
  return normalizeConfig(seeded);
}

export async function readAppConfig(): Promise<AppConfig> {
  if (hasTursoConfig()) {
    try {
      const result = await tursoExecute("SELECT data FROM app_config WHERE id = 1");
      const raw = result.rows[0]?.data;
      if (raw) {
        const parsed = JSON.parse(String(raw)) as unknown;
        if (isAppConfig(parsed)) {
          return normalizeConfig(parsed);
        }
      }
    } catch {
      // Fall through to defaults.
    }

    const seeded = await getSeededConfig();
    await tursoExecute({
      sql: "INSERT OR REPLACE INTO app_config (id, data) VALUES (1, ?)",
      args: [JSON.stringify(seeded)],
    });
    return seeded;
  }

  try {
    const data = await fs.readFile(APP_CONFIG_PATH, "utf8");
    const parsed = JSON.parse(data) as unknown;
    if (!isAppConfig(parsed)) {
      throw new Error("Invalid app config.");
    }
    return normalizeConfig(parsed);
  } catch {
    return getSeededConfig();
  }
}

export async function writeAppConfig(config: AppConfig) {
  const normalized = normalizeConfig(config);

  if (hasTursoConfig()) {
    await tursoExecute({
      sql: "INSERT OR REPLACE INTO app_config (id, data) VALUES (1, ?)",
      args: [JSON.stringify(normalized)],
    });
    return;
  }

  await fs.mkdir(path.dirname(APP_CONFIG_PATH), { recursive: true });
  await fs.writeFile(APP_CONFIG_PATH, JSON.stringify(normalized, null, 2), "utf8");
}
