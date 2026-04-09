"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Grid2x2, Sparkles, Square } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const addonOptions: { id: keyof AddOnSelection; label: string }[] = [
  { id: "screen", label: "Screen cleaning" },
  { id: "track", label: "Track cleaning" },
  { id: "hard_water", label: "Hard water removal" },
  { id: "interior", label: "Interior cleaning" },
];

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

function isValidEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

type QuoteUser = {
  name: string;
  email: string;
  address: string;
  addressDetails?: {
    line1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
};

type QuoteDraft = {
  selections: QuoteSelections;
  created_at: string;
  user?: QuoteUser;
  serviceDate?: string;
  serviceTime?: string;
};

type MapboxContextItem = {
  id: string;
  text?: string;
  short_code?: string;
};

type MapboxFeature = {
  id?: string;
  place_name: string;
  address?: string;
  text?: string;
  context?: MapboxContextItem[];
};

function getMapboxContextValue(
  context: MapboxContextItem[],
  prefix: string,
  kind: "text" | "short_code" = "text"
) {
  const item = context.find((entry) => entry.id.startsWith(prefix));
  return kind === "short_code" ? item?.short_code : item?.text;
}

function normalizeCode(value?: string) {
  if (!value) return undefined;
  const parts = value.split("-");
  return parts[parts.length - 1]?.toUpperCase() || undefined;
}

function parseMapboxFeature(feature: MapboxFeature) {
  const context = feature.context ?? [];
  const line1 = feature.address && feature.text ? `${feature.address} ${feature.text}` : feature.text ?? feature.place_name;
  const city = getMapboxContextValue(context, "place.");
  const state = normalizeCode(getMapboxContextValue(context, "region.", "short_code"));
  const postalCode = getMapboxContextValue(context, "postcode.");
  const country = normalizeCode(getMapboxContextValue(context, "country.", "short_code")) ?? "US";
  const label = [line1, city, state, postalCode].filter(Boolean).join(", ") || feature.place_name;

  return {
    label,
    details: {
      line1,
      city,
      state,
      postalCode,
      country,
    },
  };
}

export default function CloseDealClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pricing, setPricing] = useState<Pricing>(defaultPricing);
  const [selections, setSelections] = useState<QuoteSelections>(emptySelections);
  const [user, setUser] = useState<QuoteDraft["user"] | null>(null);
  const [knownUser, setKnownUser] = useState<QuoteDraft["user"] | null>(null);
  const [serviceDate, setServiceDate] = useState<string>("");
  const [serviceTime, setServiceTime] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<
    { id: string; label: string; details?: QuoteUser["addressDetails"] }[]
  >([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const emptyUser = user ?? { name: "", email: "", address: "" };
  const hasKnownName = Boolean(knownUser?.name?.trim());
  const hasKnownEmail = Boolean(knownUser?.email?.trim());
  const hasKnownAddress = Boolean(knownUser?.address?.trim());
  const shouldAskForName = !hasKnownName;
  const shouldAskForEmail = !hasKnownEmail;
  const shouldAskForAddress = !hasKnownAddress;

  const totals = useMemo(() => computeQuote(pricing, selections), [pricing, selections]);
  const totalWindows = useMemo(
    () => Object.values(selections.paneCounts).reduce((sum, count) => sum + count, 0),
    [selections.paneCounts]
  );
  const breakdownItems = useMemo(
    () =>
      paneTypeOptions
        .map((option) => ({ ...option, count: selections.paneCounts[option.id] ?? 0 }))
        .filter((item) => item.count > 0),
    [selections.paneCounts]
  );

  useEffect(() => {
    async function loadPricing() {
      try {
        const response = await fetch("/api/pricing");
        if (response.ok) {
          const data = (await response.json()) as Pricing;
          setPricing(data);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadPricing();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("window_quote_draft");
      if (stored) {
        const draft = JSON.parse(stored) as QuoteDraft;
        const incoming = draft.selections ?? emptySelections;
        if ("paneCount" in incoming && "paneType" in incoming) {
          const legacy = incoming as unknown as { paneCount: number; paneType: PaneType };
          setSelections({
            paneCounts: {
              standard: legacy.paneType === "standard" ? legacy.paneCount : 0,
              specialty: legacy.paneType === "specialty" ? legacy.paneCount : 0,
              french: legacy.paneType === "french" ? legacy.paneCount : 0,
            },
            storyLevel: incoming.storyLevel,
            addons: incoming.addons,
          });
        } else {
          setSelections(incoming as QuoteSelections);
        }
        setUser(draft.user ?? null);
        setKnownUser(draft.user ?? null);
        if (draft.serviceDate) {
          setServiceDate(draft.serviceDate);
        }
        if (draft.serviceTime) {
          setServiceTime(draft.serviceTime);
        }
        if (draft.user?.address) {
          setAddressQuery(draft.user.address);
        }
      } else {
        setError("No quote data found. Start a quote first.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not load the saved quote.");
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("canceled") === "1") {
      setStatus("Checkout was canceled. Review your details and try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!shouldAskForAddress || !addressQuery.trim()) {
      setAddressSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setAddressLoading(true);
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;
        const encoded = encodeURIComponent(addressQuery.trim());
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&autocomplete=true&types=address&limit=5&country=US&proximity=ip`,
          { signal: controller.signal }
        );
        if (!response.ok) return;
        const data = (await response.json()) as { features?: MapboxFeature[] };

        const suggestions =
          data.features?.map((feature) => {
            const parsed = parseMapboxFeature(feature);

            return {
              id: feature.id ?? feature.place_name,
              label: parsed.label,
              details: parsed.details,
            };
          }) ?? [];

        setAddressSuggestions(suggestions);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error(err);
        }
      } finally {
        setAddressLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [addressQuery, shouldAskForAddress]);

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setError(null);
    setAddressLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          if (!token) {
            setError("Mapbox token is not configured.");
            return;
          }
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=address&limit=1`
          );
          if (!response.ok) {
            throw new Error("Unable to lookup address.");
          }
          const data = (await response.json()) as { features?: MapboxFeature[] };
          const feature = data.features?.[0];
          if (!feature) {
            throw new Error("No address found for current location.");
          }
          const parsed = parseMapboxFeature(feature);

          setUser((prev) => ({
            ...(prev ?? { name: "", email: "", address: "" }),
            address: parsed.label,
            addressDetails: parsed.details,
          }));
          setAddressQuery(parsed.label);
          setAddressSuggestions([]);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unable to use current location.";
          setError(message);
        } finally {
          setAddressLoading(false);
        }
      },
      () => {
        setError("Unable to access your location.");
        setAddressLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSubmit() {
    setError(null);
    setStatus(null);

    const resolvedUser = {
      ...emptyUser,
      name: emptyUser.name.trim(),
      email: emptyUser.email.trim(),
      address: emptyUser.address.trim(),
    };

    if (!resolvedUser.name || !resolvedUser.email || !resolvedUser.address) {
      setError("Name, email, and address are required.");
      return;
    }

    if (!isValidEmail(resolvedUser.email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (totalWindows <= 0) {
      setError("Window count must be greater than 0.");
      return;
    }

    if (!serviceDate || !serviceTime) {
      setError("Service date and time are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: { ...resolvedUser, address: resolvedUser.address || "Auto-Blob" },
          selections,
          serviceDate,
          serviceTime,
        }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to start checkout.");
      }

      if (payload.url) {
        localStorage.setItem(
          "window_quote_draft",
          JSON.stringify({
            selections,
            user: resolvedUser,
            serviceDate,
            serviceTime,
            created_at: new Date().toISOString(),
          })
        );
        window.location.href = payload.url;
        return;
      }

      setStatus("Checkout session created. Continue in the Stripe window.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start checkout.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const handleCanceledStatus = useCallback(() => {
    setStatus("Checkout was canceled. Review your details and try again.");
  }, []);

  useEffect(() => {
    if (searchParams.get("canceled") === "1") {
      handleCanceledStatus();
    }
  }, [handleCanceledStatus, searchParams]);

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
        <Card className="w-full border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Close Deal</CardTitle>
            <CardDescription>Review everything included, then continue to checkout.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

            {hasKnownName || hasKnownEmail || hasKnownAddress ? (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-semibold">Customer on file</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {hasKnownName ? (
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Name</p>
                      <p className="mt-2 text-sm font-semibold">{knownUser?.name}</p>
                    </div>
                  ) : null}
                  {hasKnownEmail ? (
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</p>
                      <p className="mt-2 text-sm font-semibold break-all">{knownUser?.email}</p>
                    </div>
                  ) : null}
                  {hasKnownAddress ? (
                    <div className="rounded-lg bg-muted/40 p-3 sm:col-span-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Address</p>
                      <p className="mt-2 text-sm font-semibold">{knownUser?.address}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {shouldAskForName || shouldAskForEmail || shouldAskForAddress ? (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-semibold">Missing Booking Details</p>
                <div className="grid gap-3 sm:grid-cols-2">
                {shouldAskForName ? (
                  <div className="space-y-2">
                    <Label htmlFor="close-name">Full name</Label>
                    <Input
                      id="close-name"
                      value={emptyUser.name}
                      onChange={(event) =>
                        setUser((prev) => ({ ...(prev ?? { name: "", email: "", address: "" }), name: event.target.value }))
                      }
                      className="h-12"
                    />
                  </div>
                ) : null}
                {shouldAskForEmail ? (
                  <div className="space-y-2">
                    <Label htmlFor="close-email">Email</Label>
                    <Input
                      id="close-email"
                      type="email"
                      value={emptyUser.email}
                      onChange={(event) =>
                        setUser((prev) => ({ ...(prev ?? { name: "", email: "", address: "" }), email: event.target.value }))
                      }
                      className="h-12"
                    />
                  </div>
                ) : null}
                {shouldAskForAddress ? (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="close-address">Billing address</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="flex-1">
                        <Input
                          id="close-address"
                          value={addressQuery}
                          onChange={(event) => {
                            setAddressQuery(event.target.value);
                            setUser((prev) => ({
                              ...(prev ?? { name: "", email: "", address: "" }),
                              address: event.target.value,
                              addressDetails: undefined,
                            }));
                          }}
                          placeholder="Start typing your address..."
                          className="h-12"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUseCurrentLocation}
                        disabled={addressLoading}
                        className="h-12"
                      >
                        {addressLoading ? "Locating..." : "Use Current Location"}
                      </Button>
                    </div>
                    {addressSuggestions.length > 0 ? (
                      <div className="rounded-md border bg-background shadow-sm">
                        {addressSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => {
                              setAddressQuery(suggestion.label);
                              setAddressSuggestions([]);
                              setUser((prev) => ({
                                ...(prev ?? { name: "", email: "", address: "" }),
                                address: suggestion.label,
                                addressDetails: suggestion.details,
                              }));
                            }}
                          >
                            {suggestion.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {addressLoading ? <p className="text-xs text-muted-foreground">Looking up address...</p> : null}
                  </div>
                ) : null}
                </div>
              </div>
            ) : null}

            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-semibold">Preferred Service Date</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="service-date">Pick a date</Label>
                  <Input
                    id="service-date"
                    type="date"
                    value={serviceDate}
                    onChange={(event) => setServiceDate(event.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-time">Pick a time</Label>
                  <Input
                    id="service-time"
                    type="time"
                    value={serviceTime}
                    onChange={(event) => setServiceTime(event.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-semibold">Everything in your quote</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Windows</p>
                  <p className="mt-2 text-2xl font-semibold">{totalWindows}</p>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {breakdownItems.length ? (
                      breakdownItems.map((item) => (
                        <p key={item.id}>
                          {item.count} {item.label}
                        </p>
                      ))
                    ) : (
                      <p>No windows selected.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Property access</p>
                  <p className="mt-2 text-base font-semibold">
                    {storyOptions.find((option) => option.id === selections.storyLevel)?.label ?? "1st or 2nd floor"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Quote total</p>
                  <p className="mt-2 text-2xl font-semibold">${totals.total.toLocaleString()}</p>
                  {totals.minimumApplied ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Minimum job charge applied (${pricing.jobMinimum.toLocaleString()}).
                    </p>
                  ) : null}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Add-ons included</p>
                <div className="flex flex-wrap gap-2">
                  {addonOptions
                    .filter((option) => selections.addons[option.id])
                    .map((option) => (
                      <Badge key={option.id} variant="secondary" className="text-sm">
                        {option.label}
                      </Badge>
                    ))}
                  {addonOptions.every((option) => !selections.addons[option.id]) ? (
                    <p className="text-xs text-muted-foreground">No add-ons selected.</p>
                  ) : null}
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="link"
                className="h-12 px-0 text-base"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? "Starting Checkout..." : "Continue to Stripe checkout"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/")} className="h-12">
                Back to Quote
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
