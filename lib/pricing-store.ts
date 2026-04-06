import "server-only";

import { type Pricing } from "@/lib/pricing";
import { readAppConfig, writeAppConfig } from "@/lib/app-config";

export async function readPricing(): Promise<Pricing> {
  const config = await readAppConfig();
  return config.pricing;
}

export async function writePricing(pricing: Pricing) {
  const config = await readAppConfig();
  await writeAppConfig({ ...config, pricing });
}
