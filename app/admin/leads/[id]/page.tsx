"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Mail, Phone } from "lucide-react";
import { AdminLeadQuoteWorkspace } from "@/components/admin-lead-quote-workspace";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import type { AddonConfig } from "@/lib/app-config";
import type { ContactRecord } from "@/lib/contacts-store";
import {
  getContactDisplayName,
  getContactPaneTotal,
  getPaneTotal,
} from "@/lib/contact-lead-helpers";
import { defaultPricing, type Pricing } from "@/lib/pricing";

type AppConfigPayload = {
  pricing: Pricing;
  addonsConfig: AddonConfig[];
};

function DataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b border-slate-100 px-4 py-3 last:border-b-0 sm:grid sm:grid-cols-[minmax(8rem,0.35fr)_1fr] sm:gap-4 sm:px-5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900 sm:mt-0">{value ?? "—"}</dd>
    </div>
  );
}

export default function AdminLeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [config, setConfig] = useState<AppConfigPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contact = useMemo(
    () => contacts.find((c) => c.id === rawId) ?? null,
    [contacts, rawId],
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!mounted) return;
        if (!res.ok) {
          setIsAdmin(false);
          return;
        }
        const data = (await res.json()) as { user?: { is_admin?: boolean } };
        setIsAdmin(Boolean(data.user?.is_admin));
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [cRes, cfgRes] = await Promise.all([
        fetch("/api/contacts", { cache: "no-store" }),
        fetch("/api/app-config", { cache: "no-store" }),
      ]);
      if (!cRes.ok) throw new Error("Unable to load leads.");
      if (!cfgRes.ok) throw new Error("Unable to load app config.");
      const cData = (await cRes.json()) as { contacts?: ContactRecord[] };
      const cfgData = (await cfgRes.json()) as AppConfigPayload;
      setContacts(cData.contacts ?? []);
      setConfig({
        pricing: cfgData.pricing ?? defaultPricing,
        addonsConfig: cfgData.addonsConfig ?? [],
      });
    } catch {
      setError("Unable to load this lead.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void load();
  }, [isAdmin, load]);

  const onContactUpdated = useCallback((updated: ContactRecord) => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-sm text-slate-600">Checking access…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-4 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">Admin only</h1>
            <p className="mt-2 text-sm text-slate-600">Sign in as an admin to view leads.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-sm text-slate-600">Loading lead…</p>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-sm font-medium text-destructive">{error || "Lead not found."}</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => router.push("/admin/leads")}>
            All leads
          </Button>
        </div>
      </div>
    );
  }

  const name = getContactDisplayName(contact);
  const paneTotal = getContactPaneTotal(contact);
  const pc = contact.paneCounts;
  const paneBreakdown =
    pc && getPaneTotal(pc) > 0
      ? `Standard ${pc.standard ?? 0} · Specialty ${pc.specialty ?? 0} · French ${pc.french ?? 0}`
      : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/leads" className="text-sm font-medium text-primary hover:underline">
              ← All leads
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">
              Admin home
            </Link>
          </div>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{name}</h1>
              <p className="mt-1 text-sm text-slate-600">
                Submitted{" "}
                <time dateTime={contact.created_at} className="font-medium text-slate-800 tabular-nums">
                  {new Date(contact.created_at).toLocaleString()}
                </time>
                {contact.source ? (
                  <>
                    {" "}
                    · <span className="font-medium text-slate-800">{contact.source}</span>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {contact.phone ? (
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${contact.phone.replace(/\D/g, "")}`}>
                    <Phone className="size-4" />
                    Call
                  </a>
                </Button>
              ) : null}
              {contact.email ? (
                <Button asChild variant="outline" size="sm">
                  <a href={`mailto:${contact.email}`}>
                    <Mail className="size-4" />
                    Email
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
            <h2 className="text-sm font-semibold text-slate-900">Lead record</h2>
            <p className="text-xs text-slate-600">Read-only snapshot from the form submission.</p>
          </div>
          <dl className="divide-y divide-slate-100">
            <DataRow label="Name" value={name} />
            <DataRow label="Phone" value={contact.phone} />
            <DataRow label="Email" value={contact.email} />
            <DataRow label="Address" value={contact.address} />
            <DataRow label="Best time to call" value={contact.bestTimeToCall} />
            <DataRow label="Property type" value={contact.homeType} />
            <DataRow label="Service requested" value={contact.serviceType} />
            <DataRow
              label="Panes (total)"
              value={paneTotal > 0 ? <span className="tabular-nums">{paneTotal}</span> : "—"}
            />
            {paneBreakdown ? <DataRow label="Panes (detail)" value={paneBreakdown} /> : null}
            <DataRow
              label="Notes"
              value={contact.notes ? <span className="whitespace-pre-wrap font-normal">{contact.notes}</span> : "—"}
            />
          </dl>
        </section>

        <AdminLeadQuoteWorkspace
          contact={contact}
          pricing={config.pricing}
          addonsConfig={config.addonsConfig}
          onContactUpdated={onContactUpdated}
        />
      </div>
    </div>
  );
}
