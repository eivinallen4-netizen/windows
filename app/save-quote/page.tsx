"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Grid2x2, Sparkles, Square } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { defaultPricing, type PaneType, type Pricing, type StoryLevel } from "@/lib/pricing";
import { computeQuote, type AddOnSelection, type QuoteSelections } from "@/lib/quote";

export const dynamic = "force-dynamic";

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

type QuoteDraft = {
  selections: QuoteSelections;
  created_at: string;
};

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

function isValidEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

export default function SaveQuotePage() {
  const router = useRouter();
  const [pricing, setPricing] = useState<Pricing>(defaultPricing);
  const [selections, setSelections] = useState<QuoteSelections>(emptySelections);
  const [user, setUser] = useState<QuoteUser>({ name: "", email: "", address: "" });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");

  useEffect(() => {
    document.title = "Save Quote | PureBin Window Cleaning";
  }, []);
  const [addressSuggestions, setAddressSuggestions] = useState<
    { id: string; label: string; details?: QuoteUser["addressDetails"] }[]
  >([]);
  const [addressLoading, setAddressLoading] = useState(false);

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
        const draft = JSON.parse(stored) as QuoteDraft & { user?: QuoteUser };
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
        if (draft.user) {
          setUser(draft.user);
          setAddressQuery(draft.user.address ?? "");
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
    if (!addressQuery.trim()) {
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
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&autocomplete=true&types=address&limit=5&country=US`,
          { signal: controller.signal }
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          features?: Array<{
            id: string;
            place_name: string;
            address?: string;
            text?: string;
            context?: Array<{ id: string; text: string }>;
          }>;
        };

        const suggestions =
          data.features?.map((feature) => {
            const context = feature.context ?? [];
            const city = context.find((item) => item.id.startsWith("place."))?.text;
            const state = context.find((item) => item.id.startsWith("region."))?.text;
            const postal = context.find((item) => item.id.startsWith("postcode."))?.text;
            const country = context.find((item) => item.id.startsWith("country."))?.text;
            const line1 = feature.address && feature.text ? `${feature.address} ${feature.text}` : undefined;

            return {
              id: feature.id,
              label: feature.place_name,
              details: {
                line1,
                city,
                state,
                postalCode: postal,
                country,
              },
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
  }, [addressQuery]);

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
          const data = (await response.json()) as {
            features?: Array<{
              place_name: string;
              address?: string;
              text?: string;
              context?: Array<{ id: string; text: string }>;
            }>;
          };
          const feature = data.features?.[0];
          if (!feature) {
            throw new Error("No address found for current location.");
          }
          const context = feature.context ?? [];
          const city = context.find((item) => item.id.startsWith("place."))?.text;
          const state = context.find((item) => item.id.startsWith("region."))?.text;
          const postal = context.find((item) => item.id.startsWith("postcode."))?.text;
          const country = context.find((item) => item.id.startsWith("country."))?.text;
          const line1 =
            feature.address && feature.text ? `${feature.address} ${feature.text}` : feature.place_name;

          setUser((prev) => ({
            ...prev,
            address: feature.place_name,
            addressDetails: {
              line1,
              city,
              state,
              postalCode: postal,
              country,
            },
          }));
          setAddressQuery(feature.place_name);
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

    if (!user.name.trim() || !user.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    if (!isValidEmail(user.email)) {
      setError("Enter a valid email address.");
      return;
    }

    const resolvedAddress = user.address.trim() || "Auto-Blob";

    if (totalWindows <= 0) {
      setError("Pane count must be greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: { ...user, address: resolvedAddress },
          selections,
          totals,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to save quote.");
      }

      const emailResponse = await fetch("/api/send-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          selections,
          totals,
        }),
      });

      if (!emailResponse.ok) {
        const payload = (await emailResponse.json()) as { error?: string };
        throw new Error(payload.error || "Quote saved, but email failed to send.");
      }

      localStorage.setItem(
        "window_quote_draft",
        JSON.stringify({ selections, user: { ...user, address: resolvedAddress }, created_at: new Date().toISOString() })
      );
      router.push("/success?type=quote");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save quote.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
        <Card className="w-full border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Save Quote</CardTitle>
            <CardDescription>Confirm your details before saving the quote.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-semibold">Customer Details</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="save-name">Full name</Label>
                  <Input
                    id="save-name"
                    value={user.name}
                    onChange={(event) => setUser((prev) => ({ ...prev, name: event.target.value }))}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="save-email">Email</Label>
                  <Input
                    id="save-email"
                    type="email"
                    value={user.email}
                    onChange={(event) => setUser((prev) => ({ ...prev, email: event.target.value }))}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="save-address">Billing address</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex-1">
                      <Input
                        id="save-address"
                        value={addressQuery}
                        onChange={(event) => {
                          setAddressQuery(event.target.value);
                          setUser((prev) => ({
                            ...prev,
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
                              ...prev,
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
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-semibold">Everything in your quote</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Panes</p>
                  <p className="mt-2 text-2xl font-semibold">{totalWindows}</p>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {breakdownItems.length ? (
                      breakdownItems.map((item) => (
                        <p key={item.id}>
                          {item.count} {item.label}
                        </p>
                      ))
                    ) : (
                      <p>No panes selected.</p>
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

            <div className="flex flex-wrap gap-3">
              <Button type="button" disabled={loading} onClick={handleSubmit} className="h-12">
                {loading ? "Saving..." : "Save Quote"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/")} className="h-12">
                Back to Quote
              </Button>
            </div>

            {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
