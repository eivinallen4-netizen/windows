import type { PaneType, Pricing, StoryLevel } from "@/lib/pricing";

export type AddOnSelection = {
  screen: boolean;
  track: boolean;
  hard_water: boolean;
  interior: boolean;
};

export type QuoteSelections = {
  paneCounts: Record<PaneType, number>;
  storyLevel: StoryLevel;
  addons: AddOnSelection;
};

export type QuoteTotals = {
  base: number;
  storySurcharge: number;
  addonsTotal: number;
  subtotal: number;
  total: number;
  minimumApplied: boolean;
};

export function computeQuote(pricing: Pricing, selections: QuoteSelections): QuoteTotals {
  const base = (Object.keys(pricing.paneTypes) as PaneType[]).reduce((sum, type) => {
    const count = selections.paneCounts[type] ?? 0;
    return sum + count * pricing.paneTypes[type];
  }, 0);
  const totalWindows = (Object.values(selections.paneCounts) ?? []).reduce((sum, count) => sum + count, 0);
  const storySurcharge =
    selections.storyLevel === "3+" ? totalWindows * pricing.storySurcharge.third_plus : 0;

  let addonsTotal = 0;
  if (selections.addons.screen) {
    addonsTotal += totalWindows * pricing.addons.screen;
  }
  if (selections.addons.track) {
    addonsTotal += totalWindows * pricing.addons.track;
  }
  if (selections.addons.hard_water) {
    addonsTotal += totalWindows * pricing.addons.hard_water;
  }
  if (selections.addons.interior) {
    addonsTotal += totalWindows * pricing.addons.interior;
  }

  const subtotal = base + storySurcharge + addonsTotal;
  const total = Math.max(subtotal, pricing.jobMinimum);

  return {
    base,
    storySurcharge,
    addonsTotal,
    subtotal,
    total,
    minimumApplied: total !== subtotal,
  };
}
