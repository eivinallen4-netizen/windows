"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlignJustify,
  Building2,
  Copy,
  Droplets,
  ExternalLink,
  Grid2x2,
  Home,
  ScanLine,
  Sparkles,
  Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { ContactRecord } from "@/lib/contacts-store";
import {
  buildContactDraft,
  getSelectionPaneTotal,
  isValidLeadEmail,
  type ContactQuoteDraft,
} from "@/lib/contact-lead-helpers";
import type { PaneType, Pricing, StoryLevel } from "@/lib/pricing";
import { computeQuote, type AddOnSelection } from "@/lib/quote";

type AddonConfig = {
  id: keyof AddOnSelection;
  label: string;
  free: boolean;
};

const paneTypeOptions: { id: PaneType; label: string; icon: typeof Square }[] = [
  { id: "standard", label: "Standard", icon: Square },
  { id: "specialty", label: "Sliding / Large", icon: Sparkles },
  { id: "french", label: "French Pane", icon: Grid2x2 },
];

const storyOptions: { id: StoryLevel; label: string; icon: typeof Building2 }[] = [
  { id: "1-2", label: "Easy Access", icon: Building2 },
  { id: "3+", label: "Difficult Access", icon: Building2 },
];

const addonRows: { id: keyof AddOnSelection; label: string; icon: typeof ScanLine }[] = [
  { id: "screen", label: "Screen cleaning", icon: ScanLine },
  { id: "track", label: "Track cleaning", icon: AlignJustify },
  { id: "hard_water", label: "Hard water removal", icon: Droplets },
  { id: "interior", label: "Interior cleaning", icon: Home },
];

type AdminLeadQuoteWorkspaceProps = {
  contact: ContactRecord;
  pricing: Pricing;
  addonsConfig: AddonConfig[];
  onContactUpdated: (contact: ContactRecord) => void;
};

export function AdminLeadQuoteWorkspace({
  contact,
  pricing,
  addonsConfig,
  onContactUpdated,
}: AdminLeadQuoteWorkspaceProps) {
  const [contactDraft, setContactDraft] = useState<ContactQuoteDraft>(() => buildContactDraft(contact));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);
  const [creatingPaymentLink, setCreatingPaymentLink] = useState(false);
  const [emailingPaymentLink, setEmailingPaymentLink] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");

  useEffect(() => {
    setContactDraft(buildContactDraft(contact));
    setStatus(null);
    setError(null);
    setPaymentUrl("");
  }, [contact.id]);

  const includedAddons = useMemo(() => {
    return {
      screen: addonsConfig.find((a) => a.id === "screen")?.free ?? false,
      track: addonsConfig.find((a) => a.id === "track")?.free ?? false,
      hard_water: addonsConfig.find((a) => a.id === "hard_water")?.free ?? false,
      interior: addonsConfig.find((a) => a.id === "interior")?.free ?? false,
    };
  }, [addonsConfig]);

  const totals = useMemo(() => computeQuote(pricing, contactDraft.selections), [pricing, contactDraft.selections]);

  function updateUser(field: "name" | "email" | "address", value: string) {
    setContactDraft((prev) => (prev ? { ...prev, user: { ...prev.user, [field]: value } } : prev));
  }

  function updatePaneCount(type: PaneType, value: number) {
    setContactDraft((prev) =>
      prev
        ? {
            ...prev,
            selections: {
              ...prev.selections,
              paneCounts: { ...prev.selections.paneCounts, [type]: Math.max(0, value) },
            },
          }
        : prev,
    );
  }

  function updateStoryLevel(storyLevel: StoryLevel) {
    setContactDraft((prev) =>
      prev ? { ...prev, selections: { ...prev.selections, storyLevel } } : prev,
    );
  }

  function updateAddon(id: keyof AddOnSelection) {
    setContactDraft((prev) =>
      prev
        ? {
            ...prev,
            selections: {
              ...prev.selections,
              addons: { ...prev.selections.addons, [id]: !prev.selections.addons[id] },
            },
          }
        : prev,
    );
  }

  function updateField(field: "serviceDate" | "serviceTime" | "notes", value: string) {
    setContactDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSave() {
    setError(null);
    setStatus(null);
    const [firstName, ...rest] = contactDraft.user.name.trim().split(/\s+/).filter(Boolean);
    const lastName = rest.join(" ");
    const totalPanes = getSelectionPaneTotal(contactDraft.selections);
    setSaving(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contact.id,
          updates: {
            email: contactDraft.user.email.trim() || undefined,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            phone: contact.phone,
            address: contactDraft.user.address.trim() || undefined,
            paneCounts: contactDraft.selections.paneCounts,
            paneCount: totalPanes || undefined,
            bestTimeToCall: contact.bestTimeToCall,
            homeType: contact.homeType,
            serviceType: contact.serviceType,
            notes: contactDraft.notes.trim() || undefined,
            source: contact.source,
          },
        }),
      });
      const payload = (await response.json()) as { contact?: ContactRecord; error?: string };
      if (!response.ok || !payload.contact) {
        throw new Error(payload.error || "Unable to update contact.");
      }
      onContactUpdated(payload.contact);
      setContactDraft(buildContactDraft(payload.contact));
      setStatus("Lead saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendQuote() {
    setError(null);
    setStatus(null);
    const trimmedUser = {
      name: contactDraft.user.name.trim(),
      email: contactDraft.user.email.trim(),
      address: contactDraft.user.address.trim(),
    };
    const totalPanes = getSelectionPaneTotal(contactDraft.selections);
    if (!trimmedUser.name || !trimmedUser.email || !trimmedUser.address) {
      setError("Name, email, and address are required before sending a quote.");
      return;
    }
    if (!isValidLeadEmail(trimmedUser.email)) {
      setError("Enter a valid email before sending a quote.");
      return;
    }
    if (totalPanes <= 0) {
      setError("Add at least 1 pane before sending a quote.");
      return;
    }
    const quoteTotals = computeQuote(pricing, contactDraft.selections);
    setSendingQuote(true);
    try {
      const quoteResponse = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: trimmedUser,
          selections: contactDraft.selections,
          totals: quoteTotals,
        }),
      });
      const quotePayload = (await quoteResponse.json()) as { error?: string };
      if (!quoteResponse.ok) {
        throw new Error(quotePayload.error || "Unable to save quote.");
      }
      const emailResponse = await fetch("/api/send-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: trimmedUser,
          selections: contactDraft.selections,
          totals: quoteTotals,
        }),
      });
      const emailPayload = (await emailResponse.json()) as { error?: string };
      if (!emailResponse.ok) {
        throw new Error(emailPayload.error || "Quote saved, but email failed.");
      }
      setStatus(`Quote saved and emailed to ${trimmedUser.email}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send quote.");
    } finally {
      setSendingQuote(false);
    }
  }

  async function createCheckoutLink() {
    const trimmedUser = {
      name: contactDraft.user.name.trim(),
      email: contactDraft.user.email.trim(),
      address: contactDraft.user.address.trim(),
    };
    const totalPanes = Object.values(contactDraft.selections.paneCounts).reduce((s, n) => s + n, 0);
    if (!trimmedUser.name || !trimmedUser.email || !trimmedUser.address) {
      throw new Error("Name, email, and address are required before creating a payment link.");
    }
    if (!isValidLeadEmail(trimmedUser.email)) {
      throw new Error("Enter a valid email before creating a payment link.");
    }
    if (totalPanes <= 0) {
      throw new Error("Add at least 1 pane before creating a payment link.");
    }
    if (!contactDraft.serviceDate || !contactDraft.serviceTime) {
      throw new Error("Service date and time are required before creating a payment link.");
    }
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: trimmedUser,
        selections: contactDraft.selections,
        serviceDate: contactDraft.serviceDate,
        serviceTime: contactDraft.serviceTime,
      }),
    });
    const payload = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !payload.url) {
      throw new Error(payload.error || "Unable to create payment link.");
    }
    setPaymentUrl(payload.url);
    return payload.url;
  }

  async function handleCreatePaymentLink(openInNewTab = false) {
    setError(null);
    setStatus(null);
    setCreatingPaymentLink(true);
    try {
      const url = await createCheckoutLink();
      if (openInNewTab) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      setStatus("Payment link created.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create payment link.");
    } finally {
      setCreatingPaymentLink(false);
    }
  }

  async function handleEmailPaymentLink() {
    setError(null);
    setStatus(null);
    setEmailingPaymentLink(true);
    try {
      const url = paymentUrl || (await createCheckoutLink());
      const t = computeQuote(pricing, contactDraft.selections);
      const message = [
        `Hi ${contactDraft.user.name || "there"},`,
        "",
        "Here is your PureBin LV payment link.",
        `Service date: ${contactDraft.serviceDate}`,
        `Service time: ${contactDraft.serviceTime}`,
        `Total: $${t.total.toLocaleString()}`,
        "",
        `Pay here: ${url}`,
        "",
        "Reply to this email or call us if you need anything changed.",
      ].join("\n");
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: contactDraft.user.email.trim(),
          subject: "PureBin LV payment link",
          message,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to email payment link.");
      }
      setStatus(`Payment link emailed to ${contactDraft.user.email.trim()}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to email payment link.");
    } finally {
      setEmailingPaymentLink(false);
    }
  }

  async function handleCopyPaymentLink() {
    if (!paymentUrl) return;
    try {
      await navigator.clipboard.writeText(paymentUrl);
      setStatus("Payment link copied.");
    } catch {
      setError("Unable to copy payment link.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-semibold text-slate-900">Quote &amp; payment</h2>
        <p className="mt-1 text-sm text-slate-600">
          Adjust pricing inputs below, then save, email a quote, or create a Stripe link.
        </p>
      </div>

      {error ? <p className="mb-4 text-sm font-medium text-destructive">{error}</p> : null}
      {status ? <p className="mb-4 text-sm text-slate-600">{status}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Quote inputs</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="wq-name">Customer name</Label>
                <Input
                  id="wq-name"
                  value={contactDraft.user.name}
                  onChange={(e) => updateUser("name", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wq-email">Email</Label>
                <Input
                  id="wq-email"
                  type="email"
                  value={contactDraft.user.email}
                  onChange={(e) => updateUser("email", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="wq-address">Address</Label>
                <Input
                  id="wq-address"
                  value={contactDraft.user.address}
                  onChange={(e) => updateUser("address", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wq-date">Service date</Label>
                <Input
                  id="wq-date"
                  type="date"
                  value={contactDraft.serviceDate}
                  onChange={(e) => updateField("serviceDate", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wq-time">Service time</Label>
                <Input
                  id="wq-time"
                  type="time"
                  value={contactDraft.serviceTime}
                  onChange={(e) => updateField("serviceTime", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="wq-notes">Internal notes</Label>
                <Textarea
                  id="wq-notes"
                  rows={3}
                  value={contactDraft.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Pane counts</h3>
            <div className="space-y-3">
              {paneTypeOptions.map((option) => (
                <div key={option.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <span className="text-sm font-medium text-slate-800">{option.label}</span>
                  <Input
                    type="number"
                    min={0}
                    value={contactDraft.selections.paneCounts?.[option.id] ?? 0}
                    onChange={(e) => updatePaneCount(option.id, Number(e.target.value) || 0)}
                    className="h-9 w-24 bg-white text-right"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Access</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {storyOptions.map((option) => {
                const Icon = option.icon;
                const active = contactDraft.selections.storyLevel === option.id;
                return (
                  <Button
                    key={option.id}
                    type="button"
                    variant={active ? "default" : "outline"}
                    className="h-10 justify-start gap-2"
                    onClick={() => updateStoryLevel(option.id)}
                  >
                    <Icon className="size-4" />
                    <span className="text-sm">{option.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Add-ons</h3>
            <div className="grid gap-2">
              {addonRows.map((row) => {
                const Icon = row.icon;
                const active = contactDraft.selections.addons[row.id];
                const included = includedAddons[row.id];
                return (
                  <Button
                    key={row.id}
                    type="button"
                    variant={active || included ? "default" : "outline"}
                    className="h-10 justify-start gap-2"
                    disabled={included}
                    onClick={() => updateAddon(row.id)}
                  >
                    <Icon className="size-4" />
                    <span className="text-sm">{row.label}</span>
                    {included ? (
                      <Badge variant="secondary" className="ml-auto">
                        Free
                      </Badge>
                    ) : null}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:border-l lg:border-slate-100 lg:pl-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live total</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">${totals.total.toLocaleString()}</p>
            <p className="mt-2 text-sm text-slate-600">
              {(
                (["standard", "specialty", "french"] as const).reduce(
                  (s, k) => s + (contactDraft.selections.paneCounts[k] ?? 0),
                  0,
                )
              )}{" "}
              panes
            </p>
            {totals.minimumApplied ? <p className="mt-2 text-xs text-slate-500">Minimum job charge applied.</p> : null}
          </div>

          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Saving…" : "Save quote fields to lead"}
            </Button>
            <Button type="button" onClick={() => void handleSendQuote()} disabled={sendingQuote}>
              {sendingQuote ? "Sending…" : "Save + email quote"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => void handleCreatePaymentLink(true)} disabled={creatingPaymentLink}>
              {creatingPaymentLink ? "Creating…" : "Create payment link"}
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleEmailPaymentLink()} disabled={emailingPaymentLink}>
              {emailingPaymentLink ? "Sending…" : "Email payment link"}
            </Button>
          </div>

          {paymentUrl ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Latest link</p>
              <p className="mt-2 break-all text-xs text-slate-700">{paymentUrl}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => void handleCopyPaymentLink()}>
                  <Copy className="size-4" />
                  Copy
                </Button>
                <Button asChild type="button" size="sm" variant="outline">
                  <a href={paymentUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    Open
                  </a>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
