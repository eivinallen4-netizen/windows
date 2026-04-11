"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import type { ContactRecord } from "@/lib/contacts-store";
import { getContactDisplayName, getContactPaneTotal } from "@/lib/contact-lead-helpers";

const PER_PAGE = 12;

export default function AdminLeadsPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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

  const loadContacts = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contacts", { cache: "no-store" });
      if (!res.ok) throw new Error("Unable to load leads.");
      const data = (await res.json()) as { contacts?: ContactRecord[] };
      setContacts(data.contacts ?? []);
    } catch {
      setError("Unable to load leads.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void loadContacts();
  }, [isAdmin, loadContacts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [
        getContactDisplayName(c),
        c.email ?? "",
        c.phone ?? "",
        c.address ?? "",
        c.source ?? "",
      ].some((s) => s.toLowerCase().includes(q)),
    );
  }, [contacts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const slice = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

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

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
              ← Back to admin
            </Link>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Leads</h1>
            <p className="mt-1 text-sm text-slate-600">
              {contacts.length} total · select a row to open the full record and quote tools.
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <label htmlFor="lead-search" className="sr-only">
              Search leads
            </label>
            <Input
              id="lead-search"
              placeholder="Search name, phone, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white"
            />
          </div>
        </div>

        {error ? <p className="mb-4 text-sm font-medium text-destructive">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-slate-600">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-600">
            {contacts.length === 0 ? "No leads yet." : "No matches for that search."}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="divide-y divide-slate-100">
                {slice.map((c) => {
                  const panes = getContactPaneTotal(c);
                  return (
                    <Link
                      key={c.id}
                      href={`/admin/leads/${encodeURIComponent(c.id)}`}
                      className="block px-4 py-4 transition hover:bg-slate-50 sm:px-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <p className="font-semibold text-slate-900">{getContactDisplayName(c)}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                            {c.phone ? <span className="tabular-nums">{c.phone}</span> : null}
                            {c.email ? <span className="break-all">{c.email}</span> : null}
                          </div>
                          {c.address ? (
                            <p className="text-sm text-slate-500 line-clamp-2">{c.address}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                          <time className="text-xs text-slate-500 tabular-nums" dateTime={c.created_at}>
                            {new Date(c.created_at).toLocaleString()}
                          </time>
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {c.source ? (
                              <Badge variant="secondary" className="font-normal">
                                {c.source}
                              </Badge>
                            ) : null}
                            {panes > 0 ? (
                              <Badge variant="outline" className="font-normal tabular-nums">
                                {panes} panes
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-between gap-4">
                <p className="text-sm text-slate-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
