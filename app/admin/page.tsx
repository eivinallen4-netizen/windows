"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignJustify,
  BadgeDollarSign,
  Building2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Droplets,
  ExternalLink,
  Grid2x2,
  Home,
  Mail,
  Phone,
  ScanLine,
  Send,
  Sparkles,
  Square,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AdminPanel } from "@/components/admin-panel";
import { SiteHeader } from "@/components/site-header";
import { ScheduleWindowSettings } from "@/components/schedule-window-settings";
import { ScheduleAdminLinks } from "@/components/schedule-admin-links";
import { UsersAdminPanel } from "@/components/users-admin-panel";
import { WeeklyHoursSettings } from "@/components/weekly-hours-settings";
import { defaultPricing, type PaneType, type Pricing, type StoryLevel } from "@/lib/pricing";
import {
  DEFAULT_INSTAGRAM_URL,
  defaultPublicBusinessConfig,
  normalizePublicBusinessConfig,
  type PublicBusinessConfig,
} from "@/lib/public-business";
import { computeQuote, type AddOnSelection, type QuoteSelections } from "@/lib/quote";
import { defaultScheduleWindows, type ScheduleWindowsConfig } from "@/lib/schedule-types";

export const dynamic = "force-dynamic";

const COLORS = {
  page: "#edf5ff",
  sidebar: "#f8fbff",
  card: "#ffffff",
  input: "#ffffff",
  border: "#dbe7f5",
  borderDark: "#dbe7f5",
  textMuted: "#64748b",
  textMuted2: "#64748b",
  indigo: "#6366f1",
  sky: "#0ea5e9",
  slate: "#e2e8f0",
};
const paneTypeRows: { id: PaneType; label: string; icon: typeof Square }[] = [
  { id: "standard", label: "Standard", icon: Square },
  { id: "specialty", label: "Sliding / Large", icon: Sparkles },
  { id: "french", label: "French Pane", icon: Grid2x2 },
];

const addonRows = [
  { id: "screen", label: "Screen cleaning", icon: ScanLine },
  { id: "track", label: "Track cleaning", icon: AlignJustify },
  { id: "hard_water", label: "Hard water removal", icon: Droplets },
  { id: "interior", label: "Interior cleaning", icon: Home },
] as const;

const paneTypeOptions: { id: PaneType; label: string; icon: typeof Square }[] = [
  { id: "standard", label: "Standard", icon: Square },
  { id: "specialty", label: "Sliding / Large", icon: Sparkles },
  { id: "french", label: "French Pane", icon: Grid2x2 },
];

const storyOptions: { id: StoryLevel; label: string; icon: typeof Building2 }[] = [
  { id: "1-2", label: "Easy Access", icon: Building2 },
  { id: "3+", label: "Difficult Access", icon: Building2 },
];

type QuoteRecord = {
  id?: string;
  index: number;
  user: { name: string; email: string; address: string };
  rep?: { name: string; email: string };
  selections: QuoteSelections;
  totals: ReturnType<typeof computeQuote>;
  created_at: string;
};

type AppPlan = "free" | "pro";

type AddonConfig = {
  id: "screen" | "track" | "hard_water" | "interior";
  label: string;
  description: string;
  price: number;
  free: boolean;
};

type AppConfig = {
  pricing: Pricing;
  addonsConfig: AddonConfig[];
  repCommissionPercent: number;
  scheduleWindows: ScheduleWindowsConfig;
  publicBusiness: PublicBusinessConfig;
  plans: {
    activePlan: AppPlan;
    free: {
      addonsFree: boolean;
    };
  };
};

type ContactRecord = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  paneCounts?: {
    standard?: number;
    specialty?: number;
    french?: number;
  };
  paneCount?: number;
  windowCount?: number;
  bestTimeToCall?: string;
  homeType?: string;
  serviceType?: string;
  notes?: string;
  source?: string;
  created_at: string;
};

type ContactQuoteDraft = {
  contactId: string;
  user: { name: string; email: string; address: string };
  selections: QuoteSelections;
  serviceDate: string;
  serviceTime: string;
  notes: string;
};

type UserRecord = {
  id: string;
  email?: string;
  name?: string;
  role: "admin" | "rep" | "tech";
  is_admin: boolean;
  phone?: string;
  birthday?: string;
  created_at?: string;
};

type JobRecord = {
  id: string;
  stripe_session_id?: string;
  payment_intent_id?: string;
  amount_total?: number;
  currency?: string;
  customer?: { name?: string; email?: string; address?: string };
  service_date?: string;
  service_time?: string;
  rep?: { name?: string; email?: string };
  assigned_tech_email?: string;
  started_at?: string;
  walkthrough_confirmed_at?: string;
  completed_at?: string;
  payment_status?: string;
  review_id?: string;
  created_at?: string;
};

type TransactionRecord = {
  id: string;
  job_id?: string;
  stripe_session_id?: string;
  payment_intent_id?: string;
  amount_total: number;
  currency: string;
  rep?: { name?: string; email?: string };
  payment_status?: string;
  payment_complete: boolean;
  rep_commission_amount: number;
  company_net_amount: number;
  created_at: string;
};

function getContactDisplayName(contact: ContactRecord) {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() || "Unnamed";
}

function getPaneTotal(paneCounts?: ContactRecord["paneCounts"]) {
  return Object.values(paneCounts ?? {}).reduce((sum, count) => sum + (Number(count) || 0), 0);
}

function getContactPaneTotal(contact: ContactRecord) {
  return getPaneTotal(contact.paneCounts) || Number(contact.paneCount ?? contact.windowCount ?? 0) || 0;
}

function getSelectionPaneTotal(selections: QuoteSelections) {
  return getPaneTotal(selections.paneCounts);
}

function buildContactSelections(contact: ContactRecord): QuoteSelections {
  const serviceType = contact.serviceType?.toLowerCase() ?? "";
  const homeType = contact.homeType?.toLowerCase() ?? "";
  const standardCount =
    Number(contact.paneCounts?.standard ?? 0) ||
    (contact.paneCounts ? 0 : Number(contact.paneCount ?? contact.windowCount ?? 0) || 0);
  return {
    paneCounts: {
      standard: standardCount,
      specialty: Number(contact.paneCounts?.specialty ?? 0) || 0,
      french: Number(contact.paneCounts?.french ?? 0) || 0,
    },
    storyLevel: homeType.includes("two") || homeType.includes("custom") ? "3+" : "1-2",
    addons: {
      screen: serviceType.includes("screen"),
      track: serviceType.includes("track"),
      hard_water: serviceType.includes("hard"),
      interior: serviceType.includes("inside"),
    },
  };
}

function buildContactDraft(contact: ContactRecord): ContactQuoteDraft {
  return {
    contactId: contact.id,
    user: {
      name: getContactDisplayName(contact),
      email: contact.email ?? "",
      address: contact.address ?? "",
    },
    selections: buildContactSelections(contact),
    serviceDate: "",
    serviceTime: "",
    notes: contact.notes ?? "",
  };
}

function isValidEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

export default function AdminPage() {
  const LEADS_PER_PAGE = 8;
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pricing, setPricing] = useState<Pricing>(defaultPricing);
  const [addonsConfig, setAddonsConfig] = useState<AddonConfig[]>([]);
  const [activePlan, setActivePlan] = useState<AppPlan>("pro");
  const [freeAddons, setFreeAddons] = useState(true);
  const [repCommissionPercent, setRepCommissionPercent] = useState(25);
  const [scheduleWindows, setScheduleWindows] = useState<ScheduleWindowsConfig>(defaultScheduleWindows);
  const [publicBusiness, setPublicBusiness] = useState<PublicBusinessConfig>(defaultPublicBusinessConfig);
  const [activeSection, setActiveSection] = useState<
    "quotes" | "reps" | "reviews" | "jobs" | "schedule" | "pricing" | "business" | "addons" | "email" | "users"
  >("quotes");
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [quotesError, setQuotesError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [testJobName, setTestJobName] = useState("");
  const [testJobEmail, setTestJobEmail] = useState("");
  const [testJobAddress, setTestJobAddress] = useState("");
  const [testJobServiceDate, setTestJobServiceDate] = useState("");
  const [testJobServiceTime, setTestJobServiceTime] = useState("");
  const [testJobAmount, setTestJobAmount] = useState("");
  const [testJobPaymentStatus, setTestJobPaymentStatus] = useState("authorized");
  const [testJobTechEmail, setTestJobTechEmail] = useState("");
  const [testJobRepName, setTestJobRepName] = useState("");
  const [testJobRepEmail, setTestJobRepEmail] = useState("");
  const [testJobPaymentIntentId, setTestJobPaymentIntentId] = useState("");
  const [testJobStatus, setTestJobStatus] = useState<string | null>(null);
  const [testJobError, setTestJobError] = useState<string | null>(null);
  const [testJobSaving, setTestJobSaving] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRecord | null>(null);
  const [savingQuote, setSavingQuote] = useState(false);
  const [quoteJson, setQuoteJson] = useState("");
  const [quoteJsonError, setQuoteJsonError] = useState<string | null>(null);
  const [pricingJson, setPricingJson] = useState("");
  const [pricingJsonError, setPricingJsonError] = useState<string | null>(null);
  const autoSaveReadyRef = useRef(false);
  const lastSavedRef = useRef<string>("");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactStatus, setContactStatus] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadPage, setLeadPage] = useState(1);
  const [contactDraft, setContactDraft] = useState<ContactQuoteDraft | null>(null);
  const [contactDraftStatus, setContactDraftStatus] = useState<string | null>(null);
  const [contactDraftError, setContactDraftError] = useState<string | null>(null);
  const [savingContactDraft, setSavingContactDraft] = useState(false);
  const [sendingContactQuote, setSendingContactQuote] = useState(false);
  const [creatingPaymentLink, setCreatingPaymentLink] = useState(false);
  const [emailingPaymentLink, setEmailingPaymentLink] = useState(false);
  const [contactPaymentUrl, setContactPaymentUrl] = useState("");
  const [emailLoaded, setEmailLoaded] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resettingData, setResettingData] = useState(false);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  );
  const contactDraftTotals = useMemo(
    () => (contactDraft ? computeQuote(pricing, contactDraft.selections) : null),
    [contactDraft, pricing]
  );
  const filteredContacts = useMemo(() => {
    const query = leadSearch.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) =>
      [
        getContactDisplayName(contact),
        contact.email ?? "",
        contact.phone ?? "",
        contact.address ?? "",
        contact.source ?? "",
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [contacts, leadSearch]);
  const totalLeadPages = Math.max(1, Math.ceil(filteredContacts.length / LEADS_PER_PAGE));
  const pagedContacts = useMemo(() => {
    const start = (leadPage - 1) * LEADS_PER_PAGE;
    return filteredContacts.slice(start, start + LEADS_PER_PAGE);
  }, [filteredContacts, leadPage]);
  const leadsWithPhone = useMemo(
    () => contacts.filter((contact) => Boolean(contact.phone?.trim())).length,
    [contacts]
  );
  const leadsWithEmail = useMemo(
    () => contacts.filter((contact) => Boolean(contact.email?.trim())).length,
    [contacts]
  );
  const recentLeads = useMemo(
    () =>
      contacts.filter((contact) => {
        const createdAt = new Date(contact.created_at).getTime();
        return Number.isFinite(createdAt) && Date.now() - createdAt < 1000 * 60 * 60 * 24 * 7;
      }).length,
    [contacts]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const section = new URLSearchParams(window.location.search).get("section");
    if (
      section === "quotes" ||
      section === "reps" ||
      section === "reviews" ||
      section === "jobs" ||
      section === "schedule" ||
      section === "pricing" ||
      section === "business" ||
      section === "addons" ||
      section === "email" ||
      section === "users"
    ) {
      setActiveSection(section);
    }
  }, []);

  useEffect(() => {
    document.title = "Admin | PureBin Window Cleaning";
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadAuth() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          if (mounted) {
            setIsAdmin(false);
          }
          return;
        }
        const payload = (await response.json()) as { user?: { role?: string } };
        if (mounted) {
          setIsAdmin(payload.user?.role === "admin");
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setIsAdmin(false);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    void loadAuth();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let mounted = true;
    async function loadConfig() {
      try {
        const response = await fetch("/api/app-config");
        if (!response.ok) {
          throw new Error("Unable to load app config.");
        }
        const data = (await response.json()) as AppConfig;
        if (mounted) {
          setPricing(data.pricing);
          setAddonsConfig(data.addonsConfig ?? []);
          setActivePlan(data.plans.activePlan);
          setFreeAddons(data.plans.free.addonsFree);
          setRepCommissionPercent(
            Number.isFinite(data.repCommissionPercent) ? data.repCommissionPercent : 25
          );
          setScheduleWindows(data.scheduleWindows ?? defaultScheduleWindows);
          setPublicBusiness(
            normalizePublicBusinessConfig(data.publicBusiness, data.scheduleWindows?.rep ?? defaultScheduleWindows.rep),
          );
          setPricingJson(JSON.stringify(data.pricing, null, 2));
          setPricingJsonError(null);
          lastSavedRef.current = JSON.stringify({
            pricing: data.pricing,
            addonsConfig: data.addonsConfig ?? [],
            repCommissionPercent: Number.isFinite(data.repCommissionPercent) ? data.repCommissionPercent : 25,
            scheduleWindows: data.scheduleWindows ?? defaultScheduleWindows,
            publicBusiness: normalizePublicBusinessConfig(
              data.publicBusiness,
              data.scheduleWindows?.rep ?? defaultScheduleWindows.rep,
            ),
            plans: { activePlan: data.plans.activePlan, free: { addonsFree: data.plans.free.addonsFree } },
          });
          autoSaveReadyRef.current = true;
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError("Unable to load app config. Using defaults.");
        }
      }
    }

    loadConfig();
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let mounted = true;
    async function loadQuotes() {
      try {
        const response = await fetch("/api/quotes");
        if (!response.ok) {
          throw new Error("Unable to load quotes.");
        }
        const payload = (await response.json()) as { quotes: QuoteRecord[] };
        if (mounted) {
          setQuotes(payload.quotes ?? []);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setQuotesError("Unable to load quotes.");
        }
      }
    }

    loadQuotes();
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  const loadJobs = useCallback(async () => {
    if (!isAdmin) {
      return;
    }
    setJobsError(null);
    setJobsLoading(true);
    try {
      const response = await fetch("/api/jobs", { cache: "no-store" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Unable to load jobs.");
      }
      const payload = (await response.json()) as { jobs: JobRecord[] };
      setJobs(payload.jobs ?? []);
    } catch (err) {
      console.error(err);
      setJobsError(err instanceof Error ? err.message : "Unable to load jobs.");
    } finally {
      setJobsLoading(false);
    }
  }, [isAdmin]);

  const loadTransactions = useCallback(async () => {
    if (!isAdmin) {
      return;
    }
    setTransactionsError(null);
    try {
      const response = await fetch("/api/transactions", { cache: "no-store" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Unable to load transactions.");
      }
      const payload = (await response.json()) as { transactions: TransactionRecord[] };
      setTransactions(payload.transactions ?? []);
    } catch (err) {
      console.error(err);
      setTransactionsError(err instanceof Error ? err.message : "Unable to load transactions.");
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    void loadJobs();
    void loadTransactions();
    const interval = window.setInterval(() => {
      void loadJobs();
      void loadTransactions();
    }, 15000);
    function handleFocus() {
      void loadJobs();
      void loadTransactions();
    }
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [isAdmin, loadJobs, loadTransactions]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadContacts = useCallback(async () => {
    setContactsError(null);
    setContactsLoading(true);
    try {
      const response = await fetch("/api/contacts");
      if (!response.ok) {
        throw new Error("Unable to load contacts.");
      }
      const payload = (await response.json()) as { contacts: ContactRecord[] };
      setContacts(payload.contacts ?? []);
    } catch (err) {
      console.error(err);
      setContactsError("Unable to load contacts.");
    } finally {
      setContactsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users?all=true");
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to load users.");
      }
      const payload = (await response.json()) as { users: UserRecord[] };
      const normalized =
        payload.users?.map((user) => ({
          ...user,
          role: user.role ?? (user.is_admin ? "admin" : "rep"),
        })) ?? [];
      setUsers(normalized);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    if (activeSection !== "email" || emailLoaded) {
      return;
    }
    void loadContacts();
    setEmailLoaded(true);
  }, [activeSection, emailLoaded, isAdmin, loadContacts]);

  useEffect(() => {
    if (!contacts.length) {
      return;
    }
    if (selectedContactId && contacts.some((contact) => contact.id === selectedContactId)) {
      return;
    }
    const first = contacts[0];
    setSelectedContactId(first.id);
    setContactDraft(buildContactDraft(first));
  }, [contacts, selectedContactId]);

  useEffect(() => {
    setLeadPage(1);
  }, [leadSearch]);

  useEffect(() => {
    setLeadPage((prev) => Math.min(prev, totalLeadPages));
  }, [totalLeadPages]);

  useEffect(() => {
    if (!leadModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLeadModalOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [leadModalOpen]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    if (usersLoaded) {
      return;
    }
    void loadUsers();
    setUsersLoaded(true);
  }, [isAdmin, usersLoaded, loadUsers]);

  async function handleSendEmail() {
    setEmailStatus(null);
    if (!emailTo.trim() || !emailSubject.trim() || !emailMessage.trim()) {
      setEmailStatus("To, subject, and message are required.");
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo.trim(),
          subject: emailSubject.trim(),
          message: emailMessage.trim(),
        }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to send email.");
      }

      setEmailStatus("Email sent.");
      setEmailMessage("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send email.";
      setEmailStatus(message);
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleCreateContact() {
    setContactStatus(null);
    if (!contactEmail.trim() && !contactPhone.trim()) {
      setContactStatus("Add a phone number or email.");
      return;
    }

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contactEmail.trim(),
          firstName: contactFirstName.trim() || undefined,
          lastName: contactLastName.trim() || undefined,
          phone: contactPhone.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to create contact.");
      }

      const payload = (await response.json()) as { contact: ContactRecord };
      setContacts((prev) => [payload.contact, ...prev]);
      setContactStatus("Contact added.");
      setSelectedContactId(payload.contact.id);
      setContactDraft(buildContactDraft(payload.contact));
      setLeadModalOpen(true);
      setContactEmail("");
      setContactFirstName("");
      setContactLastName("");
      setContactPhone("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create contact.";
      setContactStatus(message);
    }
  }

  async function handleCreateJob() {
    setTestJobStatus(null);
    setTestJobError(null);

    if (!testJobName.trim()) {
      setTestJobError("Customer name is required.");
      return;
    }
    if (!testJobEmail.trim()) {
      setTestJobError("Customer email is required.");
      return;
    }

    const amount = Number(testJobAmount);
    const amountTotal = Number.isFinite(amount) ? amount : undefined;

    setTestJobSaving(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: testJobName.trim(),
            email: testJobEmail.trim(),
            address: testJobAddress.trim() || undefined,
          },
          service_date: testJobServiceDate.trim() || undefined,
          service_time: testJobServiceTime.trim() || undefined,
          amount_total: amountTotal,
          payment_status: testJobPaymentStatus,
          assigned_tech_email: testJobTechEmail.trim() || undefined,
          rep: testJobRepEmail.trim()
            ? { name: testJobRepName.trim() || undefined, email: testJobRepEmail.trim() }
            : undefined,
          payment_intent_id: testJobPaymentIntentId.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to create job.");
      }

      const payload = (await response.json()) as { job: JobRecord };
      setJobs((prev) => [payload.job, ...prev]);
      setTestJobStatus("Job created.");
      setTestJobName("");
      setTestJobEmail("");
      setTestJobAddress("");
      setTestJobServiceDate("");
      setTestJobServiceTime("");
      setTestJobAmount("");
      setTestJobPaymentStatus("authorized");
      setTestJobTechEmail("");
      setTestJobRepName("");
      setTestJobRepEmail("");
      setTestJobPaymentIntentId("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create job.";
      setTestJobError(message);
    } finally {
      setTestJobSaving(false);
    }
  }

  function selectContact(contact: ContactRecord) {
    setSelectedContactId(contact.id);
    setContactDraft(buildContactDraft(contact));
    setContactDraftStatus(null);
    setContactDraftError(null);
    setContactPaymentUrl("");
    setLeadModalOpen(true);
    if (contact.email) {
      setEmailTo(contact.email);
    }
  }

  function updateContactDraftUser(field: "name" | "email" | "address", value: string) {
    setContactDraft((prev) => (prev ? { ...prev, user: { ...prev.user, [field]: value } } : prev));
  }

  function updateContactDraftPaneCount(type: PaneType, value: number) {
    setContactDraft((prev) =>
      prev
        ? {
            ...prev,
            selections: {
              ...prev.selections,
              paneCounts: {
                ...prev.selections.paneCounts,
                [type]: Math.max(0, value),
              },
            },
          }
        : prev
    );
  }

  function updateContactDraftStoryLevel(storyLevel: StoryLevel) {
    setContactDraft((prev) =>
      prev
        ? {
            ...prev,
            selections: {
              ...prev.selections,
              storyLevel,
            },
          }
        : prev
    );
  }

  function updateContactDraftAddon(id: keyof AddOnSelection) {
    setContactDraft((prev) =>
      prev
        ? {
            ...prev,
            selections: {
              ...prev.selections,
              addons: {
                ...prev.selections.addons,
                [id]: !prev.selections.addons[id],
              },
            },
          }
        : prev
    );
  }

  function updateContactDraftField(field: "serviceDate" | "serviceTime" | "notes", value: string) {
    setContactDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSaveContactDraft() {
    if (!selectedContact || !contactDraft) {
      return;
    }

    setContactDraftError(null);
    setContactDraftStatus(null);

    const [firstName, ...rest] = contactDraft.user.name.trim().split(/\s+/).filter(Boolean);
    const lastName = rest.join(" ");
    const totalPanes = getSelectionPaneTotal(contactDraft.selections);

    setSavingContactDraft(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedContact.id,
          updates: {
            email: contactDraft.user.email.trim() || undefined,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            phone: selectedContact.phone,
            address: contactDraft.user.address.trim() || undefined,
            paneCounts: contactDraft.selections.paneCounts,
            paneCount: totalPanes || undefined,
            bestTimeToCall: selectedContact.bestTimeToCall,
            homeType: selectedContact.homeType,
            serviceType: selectedContact.serviceType,
            notes: contactDraft.notes.trim() || undefined,
            source: selectedContact.source,
          },
        }),
      });

      const payload = (await response.json()) as { contact?: ContactRecord; error?: string };
      if (!response.ok || !payload.contact) {
        throw new Error(payload.error || "Unable to update contact.");
      }

      setContacts((prev) => prev.map((contact) => (contact.id === payload.contact?.id ? payload.contact : contact)));
      setSelectedContactId(payload.contact.id);
      setContactDraft(buildContactDraft(payload.contact));
      setContactDraftStatus("Lead details saved.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update contact.";
      setContactDraftError(message);
    } finally {
      setSavingContactDraft(false);
    }
  }

  async function handleSendQuoteToContact() {
    if (!contactDraft) {
      return;
    }

    setContactDraftError(null);
    setContactDraftStatus(null);

    const trimmedUser = {
      name: contactDraft.user.name.trim(),
      email: contactDraft.user.email.trim(),
      address: contactDraft.user.address.trim(),
    };
    const totalPanes = getSelectionPaneTotal(contactDraft.selections);
    if (!trimmedUser.name || !trimmedUser.email || !trimmedUser.address) {
      setContactDraftError("Name, email, and address are required before sending a quote.");
      return;
    }
    if (!isValidEmail(trimmedUser.email)) {
      setContactDraftError("Enter a valid email before sending a quote.");
      return;
    }
    if (totalPanes <= 0) {
      setContactDraftError("Add at least 1 pane before sending a quote.");
      return;
    }

    const totals = computeQuote(pricing, contactDraft.selections);

    setSendingContactQuote(true);
    try {
      const quoteResponse = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: trimmedUser,
          selections: contactDraft.selections,
          totals,
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
          totals,
        }),
      });
      const emailPayload = (await emailResponse.json()) as { error?: string };
      if (!emailResponse.ok) {
        throw new Error(emailPayload.error || "Quote saved, but email failed.");
      }

      setEmailTo(trimmedUser.email);
      setContactDraftStatus(`Quote saved and emailed to ${trimmedUser.email}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send quote.";
      setContactDraftError(message);
    } finally {
      setSendingContactQuote(false);
    }
  }

  async function createCheckoutLinkForContact() {
    if (!contactDraft) {
      throw new Error("No lead selected.");
    }

    const trimmedUser = {
      name: contactDraft.user.name.trim(),
      email: contactDraft.user.email.trim(),
      address: contactDraft.user.address.trim(),
    };
    const totalPanes = Object.values(contactDraft.selections.paneCounts).reduce((sum, count) => sum + count, 0);
    if (!trimmedUser.name || !trimmedUser.email || !trimmedUser.address) {
      throw new Error("Name, email, and address are required before creating a payment link.");
    }
    if (!isValidEmail(trimmedUser.email)) {
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
    setContactPaymentUrl(payload.url);
    return payload.url;
  }

  async function handleCreatePaymentLink(openInNewTab = false) {
    setContactDraftError(null);
    setContactDraftStatus(null);
    setCreatingPaymentLink(true);
    try {
      const url = await createCheckoutLinkForContact();
      if (openInNewTab) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      setContactDraftStatus("Payment link created.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create payment link.";
      setContactDraftError(message);
    } finally {
      setCreatingPaymentLink(false);
    }
  }

  async function handleEmailPaymentLink() {
    if (!contactDraft) {
      return;
    }

    setContactDraftError(null);
    setContactDraftStatus(null);
    setEmailingPaymentLink(true);
    try {
      const url = contactPaymentUrl || (await createCheckoutLinkForContact());
      const totals = computeQuote(pricing, contactDraft.selections);
      const message = [
        `Hi ${contactDraft.user.name || "there"},`,
        "",
        "Here is your PureBin LV payment link.",
        `Service date: ${contactDraft.serviceDate}`,
        `Service time: ${contactDraft.serviceTime}`,
        `Total: $${totals.total.toLocaleString()}`,
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

      setEmailTo(contactDraft.user.email.trim());
      setContactDraftStatus(`Payment link emailed to ${contactDraft.user.email.trim()}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to email payment link.";
      setContactDraftError(message);
    } finally {
      setEmailingPaymentLink(false);
    }
  }

  async function handleCopyPaymentLink() {
    if (!contactPaymentUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(contactPaymentUrl);
      setContactDraftStatus("Payment link copied.");
    } catch {
      setContactDraftError("Unable to copy payment link.");
    }
  }

  function updatePaneType(id: PaneType, value: number) {
    setPricing((prev) => ({
      ...prev,
      paneTypes: {
        ...prev.paneTypes,
        [id]: value,
      },
    }));
  }

  function refreshPricingJson() {
    setPricingJson(JSON.stringify(pricing, null, 2));
    setPricingJsonError(null);
  }

  function applyPricingJson() {
    setPricingJsonError(null);
    try {
      const parsed = JSON.parse(pricingJson) as Pricing;
      setPricing(parsed);
    } catch {
      setPricingJsonError("Invalid JSON. Fix the JSON and try again.");
    }
  }

  function selectQuote(quote: QuoteRecord) {
    const incoming = quote.selections;
    const selections =
      "paneCount" in incoming && "paneType" in incoming
        ? {
            paneCounts: {
              standard: incoming.paneType === "standard" ? incoming.paneCount : 0,
              specialty: incoming.paneType === "specialty" ? incoming.paneCount : 0,
              french: incoming.paneType === "french" ? incoming.paneCount : 0,
            },
            storyLevel: incoming.storyLevel,
            addons: incoming.addons,
          }
        : incoming;
    const normalized: QuoteRecord = {
      ...quote,
      selections: {
        ...selections,
        addons: { ...selections.addons },
        paneCounts: {
          standard: Number(selections.paneCounts?.standard ?? 0),
          specialty: Number(selections.paneCounts?.specialty ?? 0),
          french: Number(selections.paneCounts?.french ?? 0),
        },
      },
    };
    setSelectedQuote(normalized);
    setQuoteJson(JSON.stringify(normalized, null, 2));
    setQuoteJsonError(null);
  }

  async function handleAssignTech(jobId: string, techEmail: string) {
    setJobsError(null);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assignTech", techEmail }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to assign tech.");
      }
      const payload = (await response.json()) as { job: JobRecord };
      setJobs((prev) => prev.map((job) => (job.id === jobId ? payload.job : job)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to assign tech.";
      setJobsError(message);
    }
  }

  function updateSelectedSelections(next: Partial<QuoteSelections>) {
    if (!selectedQuote) return;
    setSelectedQuote((prev) => (prev ? { ...prev, selections: { ...prev.selections, ...next } } : prev));
  }

  function updateSelectedPaneCount(type: PaneType, value: number) {
    if (!selectedQuote) return;
    setSelectedQuote((prev) =>
      prev
        ? {
            ...prev,
            selections: {
              ...prev.selections,
              paneCounts: {
                ...prev.selections.paneCounts,
                [type]: Math.max(0, value),
              },
            },
          }
        : prev
    );
  }

  function updateSelectedAddon(id: keyof AddOnSelection) {
    if (!selectedQuote) return;
    setSelectedQuote((prev) =>
      prev
        ? {
            ...prev,
            selections: {
              ...prev.selections,
              addons: {
                ...prev.selections.addons,
                [id]: !prev.selections.addons[id],
              },
            },
          }
        : prev
    );
  }

  function updateSelectedUser(field: "name" | "email" | "address", value: string) {
    if (!selectedQuote) return;
    setSelectedQuote((prev) => (prev ? { ...prev, user: { ...prev.user, [field]: value } } : prev));
  }

  function refreshQuoteJson() {
    if (!selectedQuote) return;
    setQuoteJson(JSON.stringify(selectedQuote, null, 2));
    setQuoteJsonError(null);
  }

  function applyQuoteJson() {
    if (!selectedQuote) return;
    setQuoteJsonError(null);
    try {
      const parsed = JSON.parse(quoteJson) as QuoteRecord;
      const incoming = parsed.selections;
      const selections =
        incoming && "paneCount" in incoming && "paneType" in incoming
          ? {
              paneCounts: {
                standard: incoming.paneType === "standard" ? incoming.paneCount : 0,
                specialty: incoming.paneType === "specialty" ? incoming.paneCount : 0,
                french: incoming.paneType === "french" ? incoming.paneCount : 0,
              },
              storyLevel: incoming.storyLevel,
              addons: incoming.addons,
            }
          : incoming;
      const normalized: QuoteRecord = {
        ...selectedQuote,
        ...parsed,
        selections: selections
          ? {
              ...selections,
              addons: { ...selections.addons },
              paneCounts: {
                standard: Number(selections.paneCounts?.standard ?? 0),
                specialty: Number(selections.paneCounts?.specialty ?? 0),
                french: Number(selections.paneCounts?.french ?? 0),
              },
            }
          : selectedQuote.selections,
        index: selectedQuote.index,
      };
      setSelectedQuote(normalized);
    } catch {
      setQuoteJsonError("Invalid JSON. Fix the JSON and try again.");
    }
  }

  async function handleQuoteSave() {
    if (!selectedQuote) return;
    setQuotesError(null);
    setSavingQuote(true);
    try {
      const updatedTotals = computeQuote(pricing, selectedQuote.selections);
      const record = { ...selectedQuote, totals: updatedTotals };
      const response = await fetch("/api/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: selectedQuote.index, record }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to update quote.");
      }

      setQuotes((prev) => prev.map((item) => (item.index === selectedQuote.index ? record : item)));
      setToast("Quote updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update quote.";
      setQuotesError(message);
    } finally {
      setSavingQuote(false);
    }
  }

  const buildAppConfigPayload = useCallback(
    (): AppConfig => ({
      pricing,
      addonsConfig,
      repCommissionPercent,
      scheduleWindows,
      publicBusiness,
      plans: {
        activePlan,
        free: {
          addonsFree: freeAddons,
        },
      },
    }),
    [pricing, addonsConfig, repCommissionPercent, scheduleWindows, publicBusiness, activePlan, freeAddons]
  );

  async function handleResetNonUserData() {
    setResetError(null);
    setResetStatus(null);

    if (resetConfirmation.trim() !== "RESET") {
      setResetError("Type RESET before clearing non-user data.");
      return;
    }

    setResettingData(true);
    try {
      const response = await fetch("/api/admin/reset-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: resetConfirmation.trim() }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        config?: AppConfig;
      };

      if (!response.ok || !payload.config) {
        throw new Error(payload.error || "Unable to reset admin data.");
      }

      setPricing(payload.config.pricing);
      setAddonsConfig(payload.config.addonsConfig ?? []);
      setRepCommissionPercent(payload.config.repCommissionPercent ?? 25);
      setScheduleWindows(payload.config.scheduleWindows ?? defaultScheduleWindows);
      setPublicBusiness(
        normalizePublicBusinessConfig(
          payload.config.publicBusiness,
          payload.config.scheduleWindows?.rep ?? defaultScheduleWindows.rep,
        ),
      );
      setActivePlan(payload.config.plans?.activePlan ?? "pro");
      setFreeAddons(payload.config.plans?.free?.addonsFree ?? true);
      setPricingJson(JSON.stringify(payload.config.pricing, null, 2));
      setPricingJsonError(null);
      setQuotes([]);
      setSelectedQuote(null);
      setQuoteJson("");
      setQuoteJsonError(null);
      setQuotesError(null);
      setJobs([]);
      setJobsError(null);
      setTransactions([]);
      setTransactionsError(null);
      setContacts([]);
      setContactsError(null);
      setTestJobStatus(null);
      setTestJobError(null);
      setContactStatus(null);
      setEmailStatus(null);
      setResetStatus(payload.message || "Non-user data reset.");
      setResetConfirmation("");
      setToast("Non-user data reset.");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Unable to reset admin data.");
    } finally {
      setResettingData(false);
    }
  }

  const handleSave = useCallback(async () => {
    setError(null);
    try {
      const payload = buildAppConfigPayload();

      const response = await fetch("/api/app-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to save pricing.");
      }

      setPricingJson(JSON.stringify(pricing, null, 2));
      setToast("App config saved successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save app config.";
      setError(message);
    }
  }, [buildAppConfigPayload, pricing]);

  const publicSameAsText = useMemo(() => publicBusiness.sameAsLinks.join("\n"), [publicBusiness.sameAsLinks]);

  function updatePublicBusiness<K extends keyof PublicBusinessConfig>(key: K, value: PublicBusinessConfig[K]) {
    setPublicBusiness((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function copyRepTimeframesToPublishedHours() {
    setPublicBusiness((current) => normalizePublicBusinessConfig({
      ...current,
      publishedHours: scheduleWindows.rep,
    }, scheduleWindows.rep));
    setToast("Published hours copied from current rep time frames.");
  }

  useEffect(() => {
    if (!autoSaveReadyRef.current) return;
    const signature = JSON.stringify(buildAppConfigPayload());
    if (signature === lastSavedRef.current) return;
    const timeout = setTimeout(async () => {
      lastSavedRef.current = signature;
      await handleSave();
    }, 600);
    return () => clearTimeout(timeout);
  }, [buildAppConfigPayload, handleSave]);

  const storyLabel = useMemo(() => `3rd floor and above (per window)`, []);

  const includedAddons = useMemo(() => {
    return {
      screen: addonsConfig.find((addon) => addon.id === "screen")?.free ?? false,
      track: addonsConfig.find((addon) => addon.id === "track")?.free ?? false,
      hard_water: addonsConfig.find((addon) => addon.id === "hard_water")?.free ?? false,
      interior: addonsConfig.find((addon) => addon.id === "interior")?.free ?? false,
    };
  }, [addonsConfig]);

  const techUsers = useMemo(
    () => users.filter((user) => Boolean(user.email) && (user.role === "tech" || user.role === "admin")),
    [users]
  );
  const repUsers = useMemo(() => users.filter((user) => Boolean(user.email) && user.role === "rep"), [users]);

  const stats = useMemo(() => {
    const seenTransactions = new Set<string>();
    const successfulTransactions = transactions.filter((transaction) => {
      if (
        !transaction.payment_intent_id ||
        !transaction.rep?.email ||
        !transaction.payment_complete
      ) {
        return false;
      }
      if (seenTransactions.has(transaction.payment_intent_id)) {
        return false;
      }
      seenTransactions.add(transaction.payment_intent_id);
      return true;
    });
    const totalQuotes = quotes.length;
    const totalQuoteRevenue = quotes.reduce((sum, quote) => sum + quote.totals.total, 0);
    const totalBookings = successfulTransactions.length;
    const totalBookedRevenue = successfulTransactions.reduce((sum, transaction) => sum + (transaction.amount_total || 0), 0);
    const repCommissionRate = Math.max(0, Math.min(100, repCommissionPercent)) / 100;
    const repCommissionTotal = successfulTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.rep_commission_amount || 0),
      0
    );
    const companyNet = successfulTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.company_net_amount || 0),
      0
    );

    type RepStat = {
      key: string;
      name: string;
      email: string;
      quoteCount: number;
      quoteRevenue: number;
      bookingCount: number;
      bookingRevenue: number;
    };

    const byRep = new Map<string, RepStat>();

    function getRep(key: string, name: string, email: string) {
      if (!byRep.has(key)) {
        byRep.set(key, {
          key,
          name,
          email,
          quoteCount: 0,
          quoteRevenue: 0,
          bookingCount: 0,
          bookingRevenue: 0,
        });
      }
      return byRep.get(key)!;
    }

    users
      .filter((user) => user.role === "rep" && user.email)
      .forEach((user) => {
        getRep(user.email!, user.name || user.email!, user.email!);
      });

    quotes.forEach((quote) => {
      const rep = quote.rep;
      const key = rep?.email ?? "unknown";
      const name = rep?.name ?? "Unknown";
      const email = rep?.email ?? "Unknown";
      const entry = getRep(key, name, email);
      entry.quoteCount += 1;
      entry.quoteRevenue += quote.totals.total;
    });

    successfulTransactions.forEach((transaction) => {
      const rep = transaction.rep;
      const key = rep?.email ?? "unknown";
      const name = rep?.name ?? "Unknown";
      const email = rep?.email ?? "Unknown";
      const entry = getRep(key, name, email);
      entry.bookingCount += 1;
      entry.bookingRevenue += transaction.amount_total || 0;
    });

    const repStats = Array.from(byRep.values()).sort((a, b) => b.bookingRevenue - a.bookingRevenue);

    return {
      totalQuotes,
      totalQuoteRevenue,
      totalBookings,
      totalBookedRevenue,
      repCommissionRate,
      repCommissionTotal,
      companyNet,
      repStats,
    };
  }, [transactions, quotes, repCommissionPercent, users]);

  const repBreakdown = (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: COLORS.textMuted2 }}>
        Rep Breakdown
      </p>
      <div className="space-y-3">
        {stats.repStats.length === 0 ? (
          <div
            className="rounded-2xl border px-6 py-6"
            style={{ background: COLORS.card, borderColor: COLORS.borderDark }}
          >
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              No rep stats yet.
            </p>
          </div>
        ) : (
          stats.repStats.map((rep) => {
            const repCommission = rep.bookingRevenue * stats.repCommissionRate;
            const repNet = rep.bookingRevenue - repCommission;
            return (
              <div
                key={rep.key}
                className="rounded-2xl border overflow-hidden"
                style={{ background: COLORS.card, borderColor: COLORS.borderDark }}
              >
                <div
                  className="px-6 py-4 border-b flex items-center gap-3"
                  style={{ borderColor: COLORS.borderDark }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                    style={{ background: `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.sky})` }}
                  >
                    {rep.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white">{rep.name}</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted2 }}>
                      {rep.email}
                    </p>
                  </div>
                </div>
                <div
                  className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0"
                  style={{ borderColor: COLORS.borderDark }}
                >
                  <div className="px-6 py-4" style={{ borderColor: COLORS.borderDark }}>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted2 }}>
                      Quotes
                    </p>
                    <p className="text-2xl font-black text-white">{rep.quoteCount}</p>
                    <p className="text-xs text-indigo-400 mt-0.5">
                      ${rep.quoteRevenue.toLocaleString()} value
                    </p>
                  </div>
                  <div className="px-6 py-4" style={{ borderColor: COLORS.borderDark }}>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted2 }}>
                      Bookings
                    </p>
                    <p className="text-2xl font-black text-white">{rep.bookingCount}</p>
                    <p className="text-xs text-sky-400 mt-0.5">
                      ${rep.bookingRevenue.toLocaleString()} booked
                    </p>
                  </div>
                  <div className="px-6 py-4" style={{ borderColor: COLORS.borderDark }}>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted2 }}>
                      Commission
                    </p>
                    <p className="text-2xl font-black text-white">
                      ${repCommission.toLocaleString()}
                    </p>
                    <p className="text-xs text-emerald-400 mt-0.5">{repCommissionPercent}% rate</p>
                  </div>
                  <div className="px-6 py-4" style={{ borderColor: COLORS.borderDark }}>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted2 }}>
                      Company Net
                    </p>
                    <p className="text-2xl font-black text-white">${repNet.toLocaleString()}</p>
                    <p className="text-xs text-amber-400 mt-0.5">After commission</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const statsCards = (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        {
          label: "Total Quotes",
          value: stats.totalQuotes,
          sub: `Quote revenue: $${stats.totalQuoteRevenue.toLocaleString()}`,
          color: COLORS.indigo,
        },
        {
          label: "Bookings",
          value: stats.totalBookings,
          sub: `Booked revenue: $${stats.totalBookedRevenue.toLocaleString()}`,
          color: COLORS.sky,
        },
        {
          label: "Commission",
          value: `$${stats.repCommissionTotal.toLocaleString()}`,
          sub: `${repCommissionPercent}% of booked revenue`,
          color: "#10b981",
        },
        {
          label: "Company Net",
          value: `$${stats.companyNet.toLocaleString()}`,
          sub: "After commission",
          color: "#f59e0b",
        },
      ].map((card) => (
        <div
          key={card.label}
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: COLORS.card }}
        >
          <div
            className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
            style={{ background: card.color, transform: "translate(25%, -25%)" }}
          />
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: card.color }}>
            {card.label}
          </p>
          <p className="text-3xl font-black text-white">{card.value}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            {card.sub}
          </p>
        </div>
      ))}
    </div>
  );

  const tabs = [
    { id: "quotes", label: "Quotes" },
    { id: "reps", label: "Reps" },
    { id: "reviews", label: "Reviews" },
    { id: "jobs", label: "Jobs" },
    { id: "schedule", label: "Schedule" },
    { id: "pricing", label: "Pricing" },
    { id: "business", label: "Business" },
    { id: "addons", label: "Add-ons" },
    { id: "email", label: "Leads" },
    { id: "users", label: "Users" },
  ] as const;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-border bg-card p-6">
          <h1 className="text-xl font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page only works for admin sessions. Sign in with an admin account to load jobs, users, and admin tools.
          </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: COLORS.page }}>
      <SiteHeader />
      <div className="flex min-h-[calc(100vh-73px)]">
      <div
        className="w-64 hidden md:flex flex-col flex-shrink-0 border-r"
        style={{ background: COLORS.sidebar, borderColor: COLORS.borderDark }}
      >
        <div className="px-6 py-7 border-b" style={{ borderColor: COLORS.borderDark }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.sky})` }}
            >
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-base leading-none text-foreground">PureBin LV</p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted2 }}>
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                activeSection === item.id
                  ? "text-white"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
              style={
                activeSection === item.id
                  ? { background: `linear-gradient(135deg, ${COLORS.indigo} 0%, #4f46e5 100%)` }
                  : {}
              }
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-6 py-5 border-t" style={{ borderColor: COLORS.borderDark }}>
          <p className="text-xs" style={{ color: COLORS.textMuted2 }}>
            Las Vegas, NV
          </p>
          <p className="text-xs" style={{ color: COLORS.textMuted2 }}>
            Trash Can Sanitization
          </p>
        </div>
      </div>

        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t px-1 py-1"
          style={{ background: COLORS.sidebar, borderColor: COLORS.borderDark }}
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs rounded-lg transition-all ${
                activeSection === item.id ? "text-indigo-500" : "text-slate-500"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto pb-20 md:pb-0">
          <div className="px-4 md:px-10 py-6">

        {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
        {quotesError ? <p className="mb-4 text-sm text-destructive">{quotesError}</p> : null}
        {transactionsError ? <p className="mb-4 text-sm text-destructive">{transactionsError}</p> : null}
        {toast ? (
          <div className="fixed right-6 top-6 z-50 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 shadow-lg">
            {toast}
          </div>
        ) : null}

          {activeSection === "quotes" ? (
          <Card className="shadow-lg border border-slate-200 bg-white text-slate-900">
            <CardHeader>
              <CardTitle>Quote Review</CardTitle>
              <CardDescription>Admins can review and edit saved quotes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quotes.length === 0 ? (
                <p className="text-sm text-slate-600">No saved quotes yet.</p>
              ) : (
                <div className="grid gap-2">
                  {quotes.map((quote) => (
                    <Button
                      key={`${quote.id ?? quote.index}`}
                      type="button"
                      variant={selectedQuote?.index === quote.index ? "default" : "outline"}
                      className={`h-auto justify-between px-4 py-3 text-left border ${
                        selectedQuote?.index === quote.index
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                      }`}
                      onClick={() => selectQuote(quote)}
                    >
                      <span>
                        <span className="block text-sm font-semibold">{quote.user.name}</span>
                        <span className="block text-xs text-slate-600">{quote.user.email}</span>
                        {quote.rep ? (
                          <span className="block text-xs text-slate-600">
                            Rep: {quote.rep.name} ({quote.rep.email})
                          </span>
                        ) : null}
                      </span>
                      <span className="text-sm">${quote.totals.total.toLocaleString()}</span>
                    </Button>
                  ))}
                </div>
              )}

              {selectedQuote ? (
                <div className="space-y-4 rounded-lg border p-4">
                  <p className="text-sm font-semibold">Selected Quote</p>
                  {selectedQuote.rep ? (
                    <p className="text-xs text-slate-600">
                      Rep: {selectedQuote.rep.name} ({selectedQuote.rep.email})
                    </p>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="review-name">Name</Label>
                      <Input
                        id="review-name"
                        value={selectedQuote.user.name}
                        onChange={(event) => updateSelectedUser("name", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="review-email">Email</Label>
                      <Input
                        id="review-email"
                        type="email"
                        value={selectedQuote.user.email}
                        onChange={(event) => updateSelectedUser("email", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="review-address">Address</Label>
                      <Input
                        id="review-address"
                        value={selectedQuote.user.address}
                        onChange={(event) => updateSelectedUser("address", event.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Pane counts</Label>
                      <div className="space-y-2">
                        {paneTypeOptions.map((option) => (
                          <div key={option.id} className="flex items-center justify-between gap-2">
                            <span className="text-sm">{option.label}</span>
                            <Input
                              type="number"
                              min={0}
                              value={selectedQuote.selections.paneCounts?.[option.id] ?? 0}
                              onChange={(event) =>
                                updateSelectedPaneCount(option.id, Number(event.target.value) || 0)
                              }
                              className="w-24"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {storyOptions.map((option) => {
                      const Icon = option.icon;
                      const active = selectedQuote.selections.storyLevel === option.id;
                      return (
                        <Button
                          key={option.id}
                          type="button"
                          variant={active ? "default" : "outline"}
                          className="h-10 justify-start gap-2"
                          onClick={() => updateSelectedSelections({ storyLevel: option.id })}
                        >
                          <Icon className="size-4" />
                          <span className="text-sm">{option.label}</span>
                        </Button>
                      );
                    })}
                  </div>

                  <div className="grid gap-2">
                    {addonRows.map((row) => {
                      const Icon = row.icon;
                      const active = selectedQuote.selections.addons[row.id];
                      const included = includedAddons[row.id];
                      return (
                        <Button
                          key={row.id}
                          type="button"
                          variant={active || included ? "default" : "outline"}
                          className="h-10 justify-start gap-2"
                          disabled={included}
                          onClick={() => updateSelectedAddon(row.id)}
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

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Updated total</span>
                    <span className="font-semibold">
                      ${computeQuote(pricing, selectedQuote.selections).total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="quote-json">Quote JSON</Label>
                  <Textarea
                    id="quote-json"
                    rows={10}
                    value={quoteJson}
                    onChange={(event) => setQuoteJson(event.target.value)}
                    className="font-mono text-xs"
                  />
                  {quoteJsonError ? <p className="text-xs text-destructive">{quoteJsonError}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={applyQuoteJson}>
                      Apply JSON
                    </Button>
                    <Button type="button" variant="outline" onClick={refreshQuoteJson}>
                      Refresh JSON
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button type="button" onClick={handleQuoteSave} disabled={savingQuote}>
                    {savingQuote ? "Saving..." : "Save Quote Changes"}
                  </Button>
                </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
          ) : null}

          {activeSection === "reps" ? (
          <div className="space-y-6">
            {statsCards}
            {repBreakdown}
          </div>
          ) : null}

          {activeSection === "reviews" ? (
          <Card className="shadow-lg border border-slate-200 bg-white text-slate-900">
            <CardHeader>
              <CardTitle>Review Admin</CardTitle>
              <CardDescription>Add, edit, or delete customer reviews stored in JSON.</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminPanel initialReviews={[]} />
            </CardContent>
          </Card>
          ) : null}

          {activeSection === "jobs" ? (
          <div className="space-y-6">
            <Card className="shadow-lg border border-slate-200 bg-white text-slate-900">
              <CardHeader>
                <CardTitle>Create Job</CardTitle>
                <CardDescription>Manually add a job for direct scheduling or offline follow-up.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testJobError ? <p className="text-sm text-destructive">{testJobError}</p> : null}
                {testJobStatus ? <p className="text-sm text-slate-600">{testJobStatus}</p> : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="test-job-name">Customer name</Label>
                    <Input
                      id="test-job-name"
                      value={testJobName}
                      onChange={(event) => setTestJobName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-job-email">Customer email</Label>
                    <Input
                      id="test-job-email"
                      type="email"
                      value={testJobEmail}
                      onChange={(event) => setTestJobEmail(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="test-job-address">Address</Label>
                    <Input
                      id="test-job-address"
                      value={testJobAddress}
                      onChange={(event) => setTestJobAddress(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-job-date">Service date</Label>
                    <Input
                      id="test-job-date"
                      type="date"
                      value={testJobServiceDate}
                      onChange={(event) => setTestJobServiceDate(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-job-time">Service time</Label>
                    <Input
                      id="test-job-time"
                      type="time"
                      value={testJobServiceTime}
                      onChange={(event) => setTestJobServiceTime(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-job-amount">Amount (USD)</Label>
                    <Input
                      id="test-job-amount"
                      type="number"
                      min={0}
                      step="0.01"
                      value={testJobAmount}
                      onChange={(event) => setTestJobAmount(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-job-payment-status">Payment status</Label>
                    <select
                      id="test-job-payment-status"
                      value={testJobPaymentStatus}
                      onChange={(event) => setTestJobPaymentStatus(event.target.value)}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                    >
                      <option value="pending">pending</option>
                      <option value="authorized">authorized</option>
                      <option value="ready_to_capture">ready_to_capture</option>
                      <option value="succeeded">succeeded</option>
                      <option value="captured">captured</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-job-tech">Assign tech</Label>
                    <select
                      id="test-job-tech"
                      value={testJobTechEmail}
                      onChange={(event) => setTestJobTechEmail(event.target.value)}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                    >
                      <option value="">Unassigned</option>
                      {techUsers.map((tech) => (
                        <option key={tech.email} value={tech.email}>
                          {tech.name || tech.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-job-rep">Rep</Label>
                    <select
                      id="test-job-rep"
                      value={testJobRepEmail}
                      onChange={(event) => {
                        const email = event.target.value;
                        setTestJobRepEmail(email);
                        const rep = repUsers.find((user) => user.email === email);
                        setTestJobRepName(rep?.name ?? "");
                      }}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                    >
                      <option value="">Unassigned</option>
                      {repUsers.map((rep) => (
                        <option key={rep.email} value={rep.email}>
                          {rep.name || rep.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="test-job-payment-intent">Payment intent id (optional)</Label>
                    <Input
                      id="test-job-payment-intent"
                      placeholder="Leave blank if payment has not been authorized yet"
                      value={testJobPaymentIntentId}
                      onChange={(event) => setTestJobPaymentIntentId(event.target.value)}
                    />
                    <p className="text-xs text-slate-600">
                      This is the Stripe payment reference used to capture funds later. Leave it empty for unpaid jobs.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button type="button" onClick={handleCreateJob} disabled={testJobSaving}>
                    {testJobSaving ? "Creating..." : "Create Job"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-slate-200 bg-white text-slate-900">
              <CardHeader>
                <CardTitle>Jobs</CardTitle>
                <CardDescription>Assign techs and monitor job status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobsError ? <p className="text-sm text-destructive">{jobsError}</p> : null}
                {jobsLoading ? (
                  <p className="text-sm text-slate-600">Loading jobs...</p>
                ) : jobs.length === 0 ? (
                  <p className="text-sm text-slate-600">No jobs yet.</p>
                ) : (
                  <div className="grid gap-3">
                    {jobs.map((job) => (
                      <div key={job.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {job.customer?.name || "Customer"}{" "}
                              <span className="text-xs text-slate-600">{job.customer?.email || ""}</span>
                            </p>
                            <p className="text-xs text-slate-600">
                              Service: {job.service_date || "TBD"}{" "}
                              {job.service_time ? `at ${job.service_time}` : ""}
                            </p>
                            <p className="text-xs text-slate-600">
                              Status: {job.completed_at ? "Completed" : job.started_at ? "In progress" : "New"}
                            </p>
                            <p className="text-xs text-slate-600">Payment: {job.payment_status || "pending"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`job-tech-${job.id}`} className="text-xs text-slate-600">
                              Tech
                            </Label>
                            <select
                              id={`job-tech-${job.id}`}
                              value={job.assigned_tech_email ?? ""}
                              onChange={(event) => handleAssignTech(job.id, event.target.value)}
                              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900"
                            >
                              <option value="">Unassigned</option>
                              {techUsers.map((tech) => (
                                <option key={tech.email} value={tech.email}>
                                  {tech.name || tech.email}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          ) : null}

          {activeSection === "email" ? (
          <div className="grid gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Email + Leads</h2>
                  <p className="text-sm text-slate-600">
                    Send messages, sort form submits, and open a focused quote workspace when you need it.
                  </p>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
            <Card className="border border-slate-200 bg-white text-slate-900">
              <CardHeader>
                <CardTitle>Compose</CardTitle>
                <CardDescription>Send via SMTP (Brevo).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                    <span className="text-xs font-semibold text-slate-600">To</span>
                    <input
                      className="w-full bg-transparent text-sm outline-none"
                      type="email"
                      value={emailTo}
                      onChange={(event) => setEmailTo(event.target.value)}
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                    <span className="text-xs font-semibold text-slate-600">Subject</span>
                    <input
                      className="w-full bg-transparent text-sm outline-none"
                      value={emailSubject}
                      onChange={(event) => setEmailSubject(event.target.value)}
                      placeholder="Subject"
                    />
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <Textarea
                      id="email-message"
                      rows={10}
                      value={emailMessage}
                      onChange={(event) => setEmailMessage(event.target.value)}
                      placeholder="Write your message..."
                      className="min-h-[220px] border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button type="button" onClick={handleSendEmail} disabled={sendingEmail} className="rounded-full">
                    {sendingEmail ? "Sending..." : "Send"}
                  </Button>
                  {emailStatus ? <p className="text-sm text-slate-600">{emailStatus}</p> : null}
                </div>
              </CardContent>
            </Card>

              <Card className="border border-slate-200 bg-white text-slate-900">
                <CardHeader>
                  <CardTitle>Landing Page Leads</CardTitle>
                  <CardDescription>Review every form submit, then call, email, quote, or send payment from one place.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactEmail}
                        onChange={(event) => setContactEmail(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-first">First name</Label>
                      <Input
                        id="contact-first"
                        value={contactFirstName}
                        onChange={(event) => setContactFirstName(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-last">Last name</Label>
                      <Input
                        id="contact-last"
                        value={contactLastName}
                        onChange={(event) => setContactLastName(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="contact-phone">Phone</Label>
                      <Input
                        id="contact-phone"
                        value={contactPhone}
                        onChange={(event) => setContactPhone(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button type="button" onClick={handleCreateContact} className="rounded-full">
                      Add Contact
                    </Button>
                    {contactStatus ? <p className="text-sm text-slate-600">{contactStatus}</p> : null}
                  </div>

                  <Separator />

                  {contactsError ? <p className="text-sm text-destructive">{contactsError}</p> : null}
                  {contactsLoading ? (
                    <p className="text-sm text-slate-600">Loading contacts...</p>
                  ) : contacts.length === 0 ? (
                    <p className="text-sm text-slate-600">No contacts saved yet.</p>
                  ) : (
                    <div className="grid gap-3">
                      {contacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => selectContact(contact)}
                          className={`rounded-xl border p-4 text-left transition ${
                            selectedContactId === contact.id
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{getContactDisplayName(contact)}</p>
                              <p className="mt-1 text-xs text-slate-600">{contact.email || "No email yet"}</p>
                              {contact.phone ? <p className="text-xs text-slate-600">{contact.phone}</p> : null}
                              {contact.address ? <p className="mt-1 text-xs text-slate-600">{contact.address}</p> : null}
                            </div>
                            <div className="text-right">
                              {contact.source ? (
                                <Badge variant="secondary" className="mb-2">
                                  {contact.source}
                                </Badge>
                              ) : null}
                              <p className="text-xs text-slate-600">{new Date(contact.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {contact.paneCount ? (
                              <Badge variant="outline">{contact.paneCount} panes</Badge>
                            ) : null}
                            {contact.bestTimeToCall ? (
                              <Badge variant="outline">Call: {contact.bestTimeToCall}</Badge>
                            ) : null}
                            {contact.serviceType ? (
                              <Badge variant="outline">{contact.serviceType}</Badge>
                            ) : null}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedContact && contactDraft ? (
                    <>
                      <Separator />

                      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold">{getContactDisplayName(selectedContact)}</p>
                            <p className="text-sm text-slate-600">Lead workspace</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedContact.phone ? (
                              <Button asChild type="button" variant="outline" size="sm">
                                <a href={`tel:${selectedContact.phone.replace(/\D/g, "")}`}>
                                  <Phone className="size-4" />
                                  Call
                                </a>
                              </Button>
                            ) : null}
                            {selectedContact.email ? (
                              <Button asChild type="button" variant="outline" size="sm">
                                <a href={`mailto:${selectedContact.email}`}>
                                  <Mail className="size-4" />
                                  Email
                                </a>
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (contactDraft.user.email) {
                                  setEmailTo(contactDraft.user.email);
                                }
                                setEmailSubject(`PureBin LV follow-up for ${contactDraft.user.name || getContactDisplayName(selectedContact)}`);
                              }}
                            >
                              <Send className="size-4" />
                              Use In Composer
                            </Button>
                          </div>
                        </div>

                        {contactDraftError ? <p className="text-sm text-destructive">{contactDraftError}</p> : null}
                        {contactDraftStatus ? <p className="text-sm text-slate-600">{contactDraftStatus}</p> : null}

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="lead-name">Name</Label>
                            <Input
                              id="lead-name"
                              value={contactDraft.user.name}
                              onChange={(event) => updateContactDraftUser("name", event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lead-email">Email</Label>
                            <Input
                              id="lead-email"
                              type="email"
                              value={contactDraft.user.email}
                              onChange={(event) => updateContactDraftUser("email", event.target.value)}
                            />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="lead-address">Address</Label>
                            <Input
                              id="lead-address"
                              value={contactDraft.user.address}
                              onChange={(event) => updateContactDraftUser("address", event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lead-date">Service date</Label>
                            <Input
                              id="lead-date"
                              type="date"
                              value={contactDraft.serviceDate}
                              onChange={(event) => updateContactDraftField("serviceDate", event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lead-time">Service time</Label>
                            <Input
                              id="lead-time"
                              type="time"
                              value={contactDraft.serviceTime}
                              onChange={(event) => updateContactDraftField("serviceTime", event.target.value)}
                            />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="lead-notes">Notes</Label>
                            <Textarea
                              id="lead-notes"
                              rows={3}
                              value={contactDraft.notes}
                              onChange={(event) => updateContactDraftField("notes", event.target.value)}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Pane counts</Label>
                              <div className="space-y-2">
                                {paneTypeOptions.map((option) => (
                                  <div key={option.id} className="flex items-center justify-between gap-2">
                                    <span className="text-sm">{option.label}</span>
                                    <Input
                                      type="number"
                                      min={0}
                                      value={contactDraft.selections.paneCounts?.[option.id] ?? 0}
                                      onChange={(event) => updateContactDraftPaneCount(option.id, Number(event.target.value) || 0)}
                                      className="w-24"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

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
                                    onClick={() => updateContactDraftStoryLevel(option.id)}
                                  >
                                    <Icon className="size-4" />
                                    <span className="text-sm">{option.label}</span>
                                  </Button>
                                );
                              })}
                            </div>

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
                                    onClick={() => updateContactDraftAddon(row.id)}
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

                          <div className="space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Lead details</p>
                              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                                <p>Phone: {selectedContact.phone || "None yet"}</p>
                                <p>Best time: {selectedContact.bestTimeToCall || "Not set"}</p>
                                <p>Home type: {selectedContact.homeType || "Not set"}</p>
                                <p>Requested: {selectedContact.serviceType || "Not set"}</p>
                              </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quote total</p>
                              <p className="mt-2 text-3xl font-semibold">
                                ${contactDraftTotals?.total.toLocaleString() || "0"}
                              </p>
                              <p className="mt-2 text-sm text-slate-600">
                                {Object.values(contactDraft.selections.paneCounts).reduce((sum, count) => sum + count, 0)} panes
                              </p>
                              {contactDraftTotals?.minimumApplied ? (
                                <p className="mt-2 text-xs text-slate-500">Minimum job charge applied.</p>
                              ) : null}
                            </div>

                            <div className="grid gap-2">
                              <Button type="button" variant="outline" onClick={handleSaveContactDraft} disabled={savingContactDraft}>
                                {savingContactDraft ? "Saving lead..." : "Save Lead Details"}
                              </Button>
                              <Button type="button" onClick={handleSendQuoteToContact} disabled={sendingContactQuote}>
                                {sendingContactQuote ? "Sending quote..." : "Save + Email Quote"}
                              </Button>
                              <Button type="button" variant="secondary" onClick={() => void handleCreatePaymentLink(true)} disabled={creatingPaymentLink}>
                                {creatingPaymentLink ? "Creating link..." : "Create Payment Link"}
                              </Button>
                              <Button type="button" variant="outline" onClick={handleEmailPaymentLink} disabled={emailingPaymentLink}>
                                {emailingPaymentLink ? "Emailing link..." : "Email Payment Link"}
                              </Button>
                            </div>

                            {contactPaymentUrl ? (
                              <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Latest payment link</p>
                                <p className="mt-2 break-all text-sm text-slate-700">{contactPaymentUrl}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Button type="button" size="sm" variant="outline" onClick={() => void handleCopyPaymentLink()}>
                                    <Copy className="size-4" />
                                    Copy
                                  </Button>
                                  <Button asChild type="button" size="sm" variant="outline">
                                    <a href={contactPaymentUrl} target="_blank" rel="noreferrer">
                                      <ExternalLink className="size-4" />
                                      Open
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
              </div>
            </div>
          </div>
          ) : null}

          {activeSection === "users" ? (
          <UsersAdminPanel />
          ) : null}

          {activeSection === "schedule" ? (
          <ScheduleAdminLinks />
          ) : null}

          {activeSection === "pricing" ? (
          <>
          <Card className="shadow-lg border border-slate-200 bg-white text-slate-900">
            <CardHeader>
              <CardTitle>Base Pane Pricing</CardTitle>
              <CardDescription>Per pane pricing for each window type.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paneTypeRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.id} className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Icon className="size-5" />
                      <span className="text-sm font-semibold">{row.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`pane-${row.id}`} className="text-xs text-slate-600">
                        Price
                      </Label>
                      <Input
                        id={`pane-${row.id}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={pricing.paneTypes[row.id]}
                        onChange={(event) => updatePaneType(row.id, Number(event.target.value) || 0)}
                        className="w-32"
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-200 bg-white text-slate-900">
            <CardHeader>
              <CardTitle>Story Surcharge</CardTitle>
              <CardDescription>Applied per window when above 2nd floor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Building2 className="size-5" />
                  <span className="text-sm font-semibold">{storyLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="story-surcharge" className="text-xs text-slate-600">
                    Price
                  </Label>
                  <Input
                    id="story-surcharge"
                    type="number"
                    min={0}
                    step="0.01"
                    value={pricing.storySurcharge.third_plus}
                    onChange={(event) =>
                      setPricing((prev) => ({
                        ...prev,
                        storySurcharge: {
                          ...prev.storySurcharge,
                          third_plus: Number(event.target.value) || 0,
                        },
                      }))
                    }
                    className="w-32"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-200 bg-white text-slate-900">
            <CardHeader>
              <CardTitle>Job Minimum</CardTitle>
              <CardDescription>Floor applied if totals fall below the minimum.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <BadgeDollarSign className="size-5" />
                  <span className="text-sm font-semibold">Minimum charge</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="job-minimum" className="text-xs text-slate-600">
                    Price
                  </Label>
                  <Input
                    id="job-minimum"
                    type="number"
                    min={0}
                    step="0.01"
                    value={pricing.jobMinimum}
                    onChange={(event) =>
                      setPricing((prev) => ({ ...prev, jobMinimum: Number(event.target.value) || 0 }))
                    }
                    className="w-32"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-200 bg-white text-slate-900">
            <CardHeader>
              <CardTitle>Rep Commission</CardTitle>
              <CardDescription>Percent of booked revenue paid to reps.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">Commission percent</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="rep-commission" className="text-xs text-slate-600">
                    Percent
                  </Label>
                  <Input
                    id="rep-commission"
                    type="number"
                    min={0}
                    max={100}
                    step="1"
                    value={repCommissionPercent}
                    onChange={(event) =>
                      setRepCommissionPercent(Math.max(0, Math.min(100, Number(event.target.value) || 0)))
                    }
                    className="w-32"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card id="schedule-windows" className="shadow-lg border border-slate-200 bg-white text-slate-900 scroll-mt-8">
            <CardHeader>
              <CardTitle>Schedule Windows</CardTitle>
              <CardDescription>Configure the visible allowed time blocks for rep and tech scheduling.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleWindowSettings value={scheduleWindows} onChange={setScheduleWindows} />
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-slate-200 bg-white text-slate-900">
            <CardHeader>
              <CardTitle>Pricing JSON</CardTitle>
              <CardDescription>Edit pricing directly as JSON.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                id="pricing-json"
                rows={10}
                value={pricingJson}
                onChange={(event) => setPricingJson(event.target.value)}
                className="font-mono text-xs"
              />
              {pricingJsonError ? <p className="text-xs text-destructive">{pricingJsonError}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={applyPricingJson}>
                  Apply JSON
                </Button>
                <Button type="button" variant="outline" onClick={refreshPricingJson}>
                  Refresh JSON
                </Button>
              </div>
            </CardContent>
          </Card>
          </>
          ) : null}

          {activeSection === "business" ? (
          <>
          <Card className="shadow-lg border border-slate-200 bg-white text-slate-900">
            <CardHeader>
              <CardTitle>Public Business Info</CardTitle>
              <CardDescription>Manage the verified business facts shown on the public site and in schema.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serving-since-year">Serving since year</Label>
                  <Input
                    id="serving-since-year"
                    type="number"
                    min={1900}
                    max={2100}
                    value={publicBusiness.servingSinceYear}
                    onChange={(event) =>
                      updatePublicBusiness("servingSinceYear", Math.max(1900, Number(event.target.value) || 2022))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="public-gbp-url">Google Business Profile URL</Label>
                  <Input
                    id="public-gbp-url"
                    value={publicBusiness.gbpUrl ?? ""}
                    onChange={(event) => updatePublicBusiness("gbpUrl", event.target.value)}
                    placeholder="Leave blank until verification is complete"
                  />
                  <p className="text-xs text-slate-500">Keep this blank until the public GBP share link is fully verified.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="same-as-links">Verified public profile links</Label>
                  <Textarea
                    id="same-as-links"
                    rows={5}
                    value={publicSameAsText}
                    onChange={(event) =>
                      updatePublicBusiness(
                        "sameAsLinks",
                        event.target.value
                          .split(/\r?\n/)
                          .map((line) => line.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder={DEFAULT_INSTAGRAM_URL}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-slate-500">Enter one verified public URL per line. Instagram is the default starting link.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Public trust and availability</p>
                  <div className="mt-4 grid gap-3">
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
                      <input
                        type="checkbox"
                        checked={publicBusiness.serviceAreaBusiness}
                        onChange={(event) => updatePublicBusiness("serviceAreaBusiness", event.target.checked)}
                      />
                      Service-area business only
                    </label>
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
                      <input
                        type="checkbox"
                        checked={publicBusiness.callOnly}
                        onChange={(event) => updatePublicBusiness("callOnly", event.target.checked)}
                      />
                      Call to book / no storefront
                    </label>
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
                      <input
                        type="checkbox"
                        checked={publicBusiness.licenseStatusPublic}
                        onChange={(event) => updatePublicBusiness("licenseStatusPublic", event.target.checked)}
                      />
                      Show licensed-business wording
                    </label>
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
                      <input
                        type="checkbox"
                        checked={publicBusiness.insuredPublic}
                        onChange={(event) => updatePublicBusiness("insuredPublic", event.target.checked)}
                      />
                      Show insured wording
                    </label>
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
                      <input
                        type="checkbox"
                        checked={publicBusiness.commercialProofEnabled}
                        onChange={(event) => updatePublicBusiness("commercialProofEnabled", event.target.checked)}
                      />
                      Enable commercial proof framework
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Seed published hours</p>
                      <p className="text-xs text-slate-500">Copies the current rep time-frame settings into the public-hours editor below.</p>
                    </div>
                    <Button type="button" variant="outline" onClick={copyRepTimeframesToPublishedHours}>
                      <Copy className="size-4" />
                      Copy Rep Time Frames
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <WeeklyHoursSettings
            title="Published Hours"
            description="These hours are public-facing and separate from weekly rep scheduling after you seed them."
            value={publicBusiness.publishedHours}
            onChange={(value) => updatePublicBusiness("publishedHours", value)}
          />

          <Card className="shadow-lg border border-slate-200 bg-white text-slate-900">
            <CardHeader>
              <CardTitle>GBP Alignment Targets</CardTitle>
              <CardDescription>Keep Google Business Profile wording aligned with the public site when verification is complete.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Primary category</p>
                <p className="mt-2 text-sm text-slate-600">Window cleaning service</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Services</p>
                <p className="mt-2 text-sm text-slate-600">
                  Residential window cleaning, commercial window cleaning, storefront window cleaning, high-rise window cleaning, glass cleaning, exterior window washing
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Service areas</p>
                <p className="mt-2 text-sm text-slate-600">
                  Las Vegas, Summerlin, Henderson, Green Valley, Centennial Hills, Southern Highlands, Spring Valley, Enterprise, Skye Canyon
                </p>
              </div>
            </CardContent>
          </Card>
          </>
          ) : null}

          {activeSection === "addons" ? (
          <Card className="shadow-lg border border-slate-200 bg-white text-slate-900">
            <CardHeader>
              <CardTitle>Add-ons</CardTitle>
              <CardDescription>Extra services priced per pane or window.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {addonsConfig.map((addon) => {
                const row = addonRows.find((item) => item.id === addon.id);
                const Icon = row?.icon ?? Square;
                const isFree = addon.free;
                return (
                  <div key={addon.id} className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Icon className="size-5" />
                      <span className="text-sm font-semibold">{addon.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`addon-${addon.id}`} className="text-xs text-slate-600">
                        Price
                      </Label>
                      <Input
                        id={`addon-${addon.id}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={addon.price}
                        onChange={(event) =>
                          setAddonsConfig((prev) =>
                            prev.map((item) =>
                              item.id === addon.id
                                ? { ...item, price: Number(event.target.value) || 0 }
                                : item
                            )
                          )
                        }
                        className="w-32"
                      />
                      <Button
                        type="button"
                        variant={isFree ? "secondary" : "outline"}
                        size="sm"
                        onClick={() =>
                          setAddonsConfig((prev) =>
                            prev.map((item) =>
                              item.id === addon.id ? { ...item, free: !item.free } : item
                            )
                          )
                        }
                      >
                        {isFree ? "Free" : "Make Free"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          ) : null}

          <Card className="mt-8 border border-rose-200 bg-rose-50/80 text-slate-900 shadow-sm">
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                Clear jobs, transactions, contacts, quotes, schedules, bookings, and reset app config defaults.
                Users and reviews stay untouched.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resetError ? <p className="text-sm text-destructive">{resetError}</p> : null}
              {resetStatus ? <p className="text-sm text-slate-700">{resetStatus}</p> : null}
              <div className="grid gap-3 md:grid-cols-[minmax(0,280px)_auto] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="reset-non-user-data">Type RESET to confirm</Label>
                  <Input
                    id="reset-non-user-data"
                    value={resetConfirmation}
                    onChange={(event) => setResetConfirmation(event.target.value)}
                    placeholder="RESET"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleResetNonUserData}
                  disabled={resettingData || resetConfirmation.trim() !== "RESET"}
                >
                  {resettingData ? "Resetting..." : "Reset Non-User Data"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}

