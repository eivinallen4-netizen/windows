"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlignJustify,
  Building2,
  Check,
  Droplets,
  Grid2x2,
  Home,
  Minus,
  Plus,
  ScanLine,
  Sparkles,
  Square,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { defaultPricing, type PaneType, type Pricing, type StoryLevel } from "@/lib/pricing";
import { computeQuote, type AddOnSelection, type QuoteSelections } from "@/lib/quote";

const paneTypeOptions: { id: PaneType; label: string; icon: typeof Square }[] = [
  { id: "standard", label: "Standard", icon: Square },
  { id: "specialty", label: "Sliding / Large", icon: Sparkles },
  { id: "french", label: "French Pane", icon: Grid2x2 },
];

const storyOptions: { id: StoryLevel; label: string; icon: typeof Building2 }[] = [
  { id: "1-2", label: "Easy Access", icon: Building2 },
  { id: "3+", label: "Difficult Access", icon: Building2 },
];

type AddonConfig = {
  id: keyof AddOnSelection;
  label: string;
  description: string;
  price: number;
  free: boolean;
};

const defaultAddonConfig: AddonConfig[] = [
  {
    id: "screen",
    label: "Screen Cleaning",
    description: "Clear debris and buildup for better airflow.",
    price: defaultPricing.addons.screen,
    free: false,
  },
  {
    id: "track",
    label: "Track Deep Cleaning",
    description: "Remove grime from tracks and sills.",
    price: defaultPricing.addons.track,
    free: false,
  },
  {
    id: "hard_water",
    label: "Hard Water Stain Removal",
    description: "Restore glass clarity from mineral deposits.",
    price: defaultPricing.addons.hard_water,
    free: false,
  },
  {
    id: "interior",
    label: "Interior Cleaning",
    description: "Both sides spotless, inside and out.",
    price: defaultPricing.addons.interior,
    free: false,
  },
];

const addonIcons: Record<keyof AddOnSelection, typeof ScanLine> = {
  screen: ScanLine,
  track: AlignJustify,
  hard_water: Droplets,
  interior: Home,
};

const emptySelections: QuoteSelections = {
  paneCounts: {
    standard: 0,
    specialty: 0,
    french: 0,
  },
  storyLevel: "1-2",
  addons: {
    screen: false,
    track: false,
    hard_water: false,
    interior: false,
  },
};

type QuoteDraft = {
  selections: QuoteSelections;
  totals: ReturnType<typeof computeQuote>;
  created_at: string;
};

type PriceCalculatorProps = {
  initialPricing?: Pricing | null;
  variant?: "dark" | "light";
  mode?: "portal" | "lead";
};

export function PriceCalculator({ initialPricing = null, variant = "dark", mode = "portal" }: PriceCalculatorProps) {
  const router = useRouter();
  const [pricing, setPricing] = useState<Pricing | null>(initialPricing);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [addonsConfig, setAddonsConfig] = useState<AddonConfig[]>(defaultAddonConfig);
  const [selections, setSelections] = useState<QuoteSelections>(emptySelections);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadConfig() {
      try {
        const response = await fetch("/api/app-config", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load app config.");
        }
        const data = (await response.json()) as {
          pricing: Pricing;
          addonsConfig?: AddonConfig[];
        };
        if (mounted) {
          setPricing(data.pricing);
          setAddonsConfig(data.addonsConfig?.length ? data.addonsConfig : defaultAddonConfig);
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setPricing((prev) => prev ?? defaultPricing);
          setAddonsConfig(defaultAddonConfig);
          setPricingError("Live config unavailable. Using default rates.");
        }
      }
    }

    loadConfig();
    return () => {
      mounted = false;
    };
  }, []);

  const effectivePricing = useMemo(() => {
    const activePricing = pricing ?? defaultPricing;
    const overrides = { ...activePricing.addons };
    addonsConfig.forEach((addon) => {
      overrides[addon.id] = addon.free ? 0 : addon.price;
    });
    return { ...activePricing, addons: overrides };
  }, [pricing, addonsConfig]);

  const totals = useMemo(() => {
    return computeQuote(effectivePricing, selections);
  }, [effectivePricing, selections]);

  const includedAddons = useMemo(() => {
    return {
      screen: addonsConfig.find((addon) => addon.id === "screen")?.free ?? false,
      track: addonsConfig.find((addon) => addon.id === "track")?.free ?? false,
      hard_water: addonsConfig.find((addon) => addon.id === "hard_water")?.free ?? false,
      interior: addonsConfig.find((addon) => addon.id === "interior")?.free ?? false,
    };
  }, [addonsConfig]);

  useEffect(() => {
    setSelections((prev) => ({
      ...prev,
      addons: {
        screen: includedAddons.screen ? true : prev.addons.screen,
        track: includedAddons.track ? true : prev.addons.track,
        hard_water: includedAddons.hard_water ? true : prev.addons.hard_water,
        interior: includedAddons.interior ? true : prev.addons.interior,
      },
    }));
  }, [includedAddons]);

  function updateSelection(next: Partial<QuoteSelections>) {
    setSelections((prev) => ({ ...prev, ...next }));
  }

  function updatePaneCount(type: PaneType, nextCount: number) {
    setSelections((prev) => ({
      ...prev,
      paneCounts: {
        ...prev.paneCounts,
        [type]: Math.max(0, nextCount),
      },
    }));
  }

  function updateAddon(id: keyof AddOnSelection) {
    if (includedAddons[id]) {
      return;
    }
    setSelections((prev) => ({
      ...prev,
      addons: {
        ...prev.addons,
        [id]: !prev.addons[id],
      },
    }));
  }

  function resetAll() {
    setSelections(emptySelections);
    setActionError(null);
  }

  function persistDraft(destination: string) {
    setActionError(null);

    const totalWindows = Object.values(selections.paneCounts).reduce((sum, count) => sum + count, 0);
    if (totalWindows <= 0) {
      setActionError("Add at least 1 pane to continue.");
      return;
    }

    const draft: QuoteDraft = {
      selections,
      totals,
      created_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem("window_quote_draft", JSON.stringify(draft));
    } catch (error) {
      console.error(error);
      setActionError("Could not store this quote locally.");
      return;
    }

    router.push(destination);
  }

  const activePricing = effectivePricing;
  const storyLabel = storyOptions.find((option) => option.id === selections.storyLevel)?.label ?? "Easy Access";
  const totalWindows = Object.values(selections.paneCounts).reduce((sum, count) => sum + count, 0);
  const breakdownItems = paneTypeOptions
    .map((option) => ({ ...option, count: selections.paneCounts[option.id] ?? 0 }))
    .filter((item) => item.count > 0);
  const breakdownText = breakdownItems.length
    ? breakdownItems.map((item) => `${item.count} ${item.label}`).join(", ")
    : "No panes yet";
  const breakdownShort = breakdownItems.length
    ? breakdownItems.map((item) => `${item.count} ${item.label}`).join(" | ")
    : "No panes";
  const isLeadMode = mode === "lead";

  const isLight = variant === "light";
  const cardClass = isLight
    ? "w-full border border-border bg-white text-card-foreground shadow-lg"
    : "w-full border border-slate-800 bg-slate-950 text-white shadow-lg";
  const titleClass = isLight ? "text-2xl text-foreground" : "text-2xl text-white";
  const descClass = isLight ? "text-muted-foreground" : "text-slate-400";
  const stepTextClass = isLight
    ? "text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
    : "text-xs font-semibold uppercase tracking-[0.2em] text-slate-400";
  const labelClass = isLight ? "text-base font-semibold text-foreground" : "text-base font-semibold text-white";
  const stepperButtonClass = isLight
    ? "h-12 w-12 rounded-xl border border-border bg-white text-foreground hover:bg-accent"
    : "h-12 w-12 rounded-xl border border-slate-800 bg-slate-950 text-white hover:bg-slate-900";
  const stepperValueClass = isLight
    ? "h-12 w-20 rounded-xl border border-border bg-white text-center text-lg font-semibold text-foreground"
    : "h-12 w-20 rounded-xl border border-slate-800 bg-slate-950 text-center text-lg font-semibold text-white";
  const optionActiveClass = isLight
    ? "h-auto justify-between rounded-2xl border border-primary bg-primary/8 px-4 py-4 text-left text-foreground shadow-sm"
    : "h-auto justify-between rounded-2xl border border-primary/35 bg-primary/15 px-4 py-4 text-left text-white shadow-sm";
  const optionInactiveClass = isLight
    ? "h-auto justify-between rounded-2xl border border-border bg-white px-4 py-4 text-left text-foreground shadow-sm hover:bg-accent/40"
    : "h-auto justify-between rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 text-left text-white shadow-sm hover:bg-slate-900";
  const subMutedClass = isLight ? "text-muted-foreground" : "text-slate-400";
  const addonCardBase = isLight
    ? "border border-border bg-white shadow-sm"
    : "border border-slate-800 bg-slate-950 shadow-sm";
  const addonIncluded = isLight
    ? "border-primary bg-primary/8"
    : "border-primary/35 bg-primary/15";
  const addonSelected = isLight
    ? "border-border bg-accent/45"
    : "border-slate-700 bg-slate-900";
  const badgeIncluded = isLight
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  const badgeSelected = isLight
    ? "border-border bg-white text-muted-foreground"
    : "border-slate-700 bg-slate-900 text-slate-200";
  const badgeOptional = isLight ? "border-border text-muted-foreground" : "border-slate-700 text-slate-300";
  const primaryButton = isLight
    ? "h-12 text-base bg-primary text-primary-foreground hover:bg-primary/90"
    : "h-12 text-base bg-primary text-primary-foreground hover:bg-primary/90";
  const secondaryButton = isLight
    ? "h-12 text-base border border-border bg-white text-foreground hover:bg-accent"
    : "h-12 text-base border border-slate-800 bg-slate-950 text-white hover:bg-slate-900";
  const outlineButton = isLight
    ? "h-12 w-full text-base border border-border bg-white text-foreground hover:bg-accent"
    : "h-12 w-full text-base border border-slate-800 bg-slate-950 text-white hover:bg-slate-900";
  const summaryCard = "rounded-xl bg-primary text-primary-foreground";

  return (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className={titleClass}>Job Details</CardTitle>
        <CardDescription className={descClass}>
          Tell us about the panes. Your estimate updates instantly.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 pb-28 sm:pb-8 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-8">
          {pricingError ? (
            <p className={`text-sm ${isLight ? "text-rose-600" : "text-rose-400"}`}>{pricingError}</p>
          ) : null}
          <div className="space-y-4">
            <p className={stepTextClass}>Step 1</p>
            <h3 className="text-xl font-semibold text-foreground">Job Details</h3>
            <div className="space-y-3">
              <Label className={labelClass}>Pane Types</Label>
              <div className="grid gap-3">
                {paneTypeOptions.map((option) => {
                  const Icon = option.icon;
                  const count = selections.paneCounts[option.id] ?? 0;
                  return (
                    <div
                      key={option.id}
                      className={`${optionInactiveClass} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white">
                          <Icon className="size-4 text-primary" />
                        </span>
                        <div>
                          <p className={`text-sm font-semibold ${isLight ? "text-slate-900" : ""}`}>{option.label}</p>
                          <p className="text-xs text-muted-foreground">
                            ${activePricing.paneTypes[option.id].toFixed(2)} / pane
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className={stepperButtonClass}
                          onClick={() => updatePaneCount(option.id, count - 1)}
                        >
                          <Minus className="size-4" />
                        </Button>
                        <Input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={Number.isNaN(count) ? "" : count}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            updatePaneCount(option.id, Number.isNaN(value) ? 0 : value);
                          }}
                          className={`${stepperValueClass} w-20 text-center`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className={stepperButtonClass}
                          onClick={() => updatePaneCount(option.id, count + 1)}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className={labelClass}>Property Access</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {storyOptions.map((option) => {
                const Icon = option.icon;
                const active = selections.storyLevel === option.id;
                return (
                  <Button
                    key={option.id}
                    type="button"
                    variant={active ? "default" : "outline"}
                    className={
                      active
                        ? optionActiveClass.replace("justify-between", "justify-start gap-3")
                        : optionInactiveClass.replace("justify-between", "justify-start gap-3")
                    }
                    onClick={() => updateSelection({ storyLevel: option.id })}
                  >
                    <span className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white">
                      <Icon className="size-4 text-primary" />
                    </span>
                    <span className={`text-sm font-semibold ${isLight ? "text-slate-900" : ""}`}>{option.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <p className={stepTextClass}>Step 2</p>
            <h3 className="text-xl font-semibold text-foreground">Optional Add-ons</h3>
            <div className="grid gap-3">
              {addonsConfig.map((option) => {
                const Icon = addonIcons[option.id];
                const active = selections.addons[option.id];
                const included = includedAddons[option.id];
                const addonRate = option.free ? 0 : option.price;
                const cardStyles = included ? addonIncluded : active ? addonSelected : addonCardBase;
                const badgeStyles = included ? badgeIncluded : active ? badgeSelected : badgeOptional;

                return (
                  <Card key={option.id} className={`rounded-2xl p-4 ${cardStyles}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white">
                          <Icon className="size-4 text-primary" />
                        </span>
                        <div>
                          <p className={`text-sm font-semibold ${isLight ? "text-slate-900" : ""}`}>{option.label}</p>
                          <p className={`text-xs ${subMutedClass}`}>{option.description}</p>
                          <p className="mt-2 text-xs font-semibold text-primary">
                            {included ? "Included" : addonRate === 0 ? "Free" : `+ $${addonRate.toFixed(2)} / pane`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {included ? (
                          <Badge variant="outline" className={badgeStyles}>
                            Included
                          </Badge>
                        ) : active ? (
                          <Badge variant="outline" className={badgeStyles}>
                            Added
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={badgeStyles}>
                            Optional
                          </Badge>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 rounded-full border border-border bg-white text-muted-foreground hover:bg-accent"
                          onClick={() => updateAddon(option.id)}
                          disabled={included}
                          aria-label={active ? "Remove add-on" : "Add add-on"}
                        >
                          {active || included ? <Check className="size-4" /> : <Plus className="size-4" />}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <Card className="rounded-2xl border border-border bg-white shadow-sm lg:hidden">
            <CardHeader className="pb-3 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Estimated Total</p>
              <CardTitle className="text-3xl font-black text-foreground">${totals.total.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {breakdownItems.length ? (
                breakdownItems.map((item) => {
                  const lineTotal = item.count * activePricing.paneTypes[item.id];
                  return (
                    <div key={item.id} className="flex items-center justify-between border-t pt-3 text-muted-foreground">
                      <span>
                        {item.count} x {item.label}
                      </span>
                      <span>${lineTotal.toFixed(2)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-between border-t pt-3 text-muted-foreground">
                  <span>No panes yet</span>
                  <span>$0.00</span>
                </div>
              )}
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{storyLabel}</span>
                <span>{totals.storySurcharge ? `$${totals.storySurcharge.toFixed(2)}` : "-"}</span>
              </div>
              {addonsConfig
                .filter((option) => selections.addons[option.id])
                .map((option) => {
                  const addonTotal = totalWindows * activePricing.addons[option.id];
                  const normalAddonPrice = option.price;
                  const isFree = addonTotal === 0;
                  return (
                    <div key={option.id} className="flex items-center justify-between text-muted-foreground">
                      <span>{option.label}</span>
                      <span className="flex items-center gap-2">
                        <span>{isFree ? "Free" : `$${addonTotal.toFixed(2)}`}</span>
                        {isFree && normalAddonPrice > 0 ? (
                          <span className="text-xs text-muted-foreground">${normalAddonPrice.toFixed(2)}</span>
                        ) : null}
                      </span>
                    </div>
                  );
                })}
              {addonsConfig.every((option) => !selections.addons[option.id]) ? (
                <div className="text-xs text-muted-foreground">No add-ons selected.</div>
              ) : null}
              {totals.minimumApplied ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  Service charge: Free.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="hidden space-y-3 sm:block">
            {isLeadMode ? (
              <Button
                type="button"
                size="lg"
                className={primaryButton}
                onClick={() => router.push("/#quote-form")}
              >
                Request a Call
              </Button>
            ) : (
              <div className="grid gap-3 sm:grid-rows-2">
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  className={secondaryButton}
                  onClick={() => persistDraft("/save-quote")}
                >
                  Save This Quote
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className={primaryButton}
                  onClick={() => persistDraft("/close-deal")}
                >
                  Continue to Booking
                </Button>
              </div>
            )}

            {actionError ? (
              <p className={`text-sm ${isLight ? "text-rose-600" : "text-rose-400"}`}>{actionError}</p>
            ) : null}

            {isLeadMode ? (
              <p className={`text-sm ${subMutedClass}`}>Use this estimate as a starting point. We confirm exact pricing by phone before scheduling.</p>
            ) : null}

            <Button type="button" variant="outline" className={outlineButton} onClick={resetAll}>
              Start over
            </Button>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className={`${summaryCard} px-5 py-6 shadow-lg`}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/90">
                Today&apos;s total
              </p>
              <p className="mt-2 text-4xl font-black tracking-tight text-primary-foreground">
                ${totals.total.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-primary-foreground/85">
                {breakdownText} - {storyLabel}
              </p>
              {totals.minimumApplied ? (
                <p className="mt-2 text-xs text-primary-foreground/85">Service charge: Free.</p>
              ) : null}
            </div>

            <Card
              className={
                isLight ? "border border-slate-200 bg-white text-slate-900 shadow-sm" : "border-slate-800 bg-slate-950"
              }
            >
              <CardHeader className="pb-3">
                <CardTitle className={isLight ? "text-lg text-foreground" : "text-lg text-white"}>
                  Quote summary
                </CardTitle>
                <CardDescription className={descClass}>Everything included in this estimate.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${isLight ? "border border-slate-200 bg-slate-50 text-slate-800" : "bg-white/5"}`}
                >
                  {breakdownText} - {storyLabel}
                </div>
                <div className="flex flex-wrap gap-2">
                  {addonsConfig
                    .filter((option) => selections.addons[option.id])
                    .map((option) => (
                      <Badge
                        key={option.id}
                        variant="secondary"
                        className={`text-xs ${isLight ? "border-slate-200 bg-slate-100 text-slate-800" : ""}`}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  {addonsConfig.every((option) => !selections.addons[option.id]) ? (
                    <p className={`text-xs ${subMutedClass}`}>No add-ons selected.</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </CardContent>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-4 shadow-lg sm:hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">${totals.total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                {breakdownShort}
              </p>
            </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-10"
            onClick={isLeadMode ? resetAll : () => persistDraft("/save-quote")}
          >
            {isLeadMode ? "Reset" : "Save"}
          </Button>
          </div>
          <Button
            type="button"
            size="lg"
            className={primaryButton}
            onClick={isLeadMode ? () => router.push("/#quote-form") : () => persistDraft("/close-deal")}
          >
            {isLeadMode ? "Request a Call" : "Continue"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
