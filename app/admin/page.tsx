"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ScanLine,
  Send,
  Sparkles,
  Square,
  Trash2,
  Upload,
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
import { storedMediaToDisplayUrl } from "@/lib/stored-media-url";

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

const SITE_IMAGE_STORAGE_PREFIX = {
  hero: "site-media-hero-bg",
  backdrop: "site-media-page-bg",
  "service-gallery": "site-media-gallery",
  "random-bg": "site-media-accent",
} as const;

type SiteImageUploadSlot = keyof typeof SITE_IMAGE_STORAGE_PREFIX;

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

export default function AdminPage() {
  const pathname = usePathname();
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pricing, setPricing] = useState<Pricing>(defaultPricing);
  const [addonsConfig, setAddonsConfig] = useState<AddonConfig[]>([]);
  const [activePlan, setActivePlan] = useState<AppPlan>("pro");
  const [freeAddons, setFreeAddons] = useState(true);
  const [repCommissionPercent, setRepCommissionPercent] = useState(25);
  const [scheduleWindows, setScheduleWindows] = useState<ScheduleWindowsConfig>(defaultScheduleWindows);
  const [publicBusiness, setPublicBusiness] = useState<PublicBusinessConfig>(defaultPublicBusinessConfig);
  const [siteImageBusy, setSiteImageBusy] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<
    | "quotes"
    | "reps"
    | "reviews"
    | "jobs"
    | "schedule"
    | "pricing"
    | "business"
    | "addons"
    | "email"
    | "users"
    | "danger"
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
  const [contactEmail, setContactEmail] = useState("");
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactStatus, setContactStatus] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resettingData, setResettingData] = useState(false);

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

      await response.json();
      setContactStatus("Contact added. Open Leads to view or quote.");
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

  function renormalizePublicBusiness(partial: Partial<PublicBusinessConfig>) {
    setPublicBusiness((current) =>
      normalizePublicBusinessConfig({ ...current, ...partial }, scheduleWindows.rep),
    );
  }

  async function postSiteImage(file: File, busyKey: SiteImageUploadSlot) {
    setSiteImageBusy(busyKey);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("prefix", SITE_IMAGE_STORAGE_PREFIX[busyKey]);
      const response = await fetch("/api/admin/site-image", { method: "POST", body });
      const payload = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Upload failed.");
      }
      return payload.url;
    } finally {
      setSiteImageBusy(null);
    }
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
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.sky})` }}
                  >
                    {rep.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{rep.name}</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted2 }}>
                      {rep.email}
                    </p>
                  </div>
                </div>
                <div
                  className="grid grid-cols-2 divide-x divide-y border-t border-slate-200 md:grid-cols-4 md:divide-y-0"
                  style={{ borderColor: COLORS.borderDark }}
                >
                  <div className="bg-slate-50/80 px-6 py-4" style={{ borderColor: COLORS.borderDark }}>
                    <p className="mb-1 text-xs uppercase tracking-wider" style={{ color: COLORS.textMuted2 }}>
                      Quotes
                    </p>
                    <p className="text-2xl font-black text-slate-900">{rep.quoteCount}</p>
                    <p className="mt-0.5 text-xs font-medium text-indigo-700">
                      ${rep.quoteRevenue.toLocaleString()} value
                    </p>
                  </div>
                  <div className="bg-slate-50/80 px-6 py-4" style={{ borderColor: COLORS.borderDark }}>
                    <p className="mb-1 text-xs uppercase tracking-wider" style={{ color: COLORS.textMuted2 }}>
                      Bookings
                    </p>
                    <p className="text-2xl font-black text-slate-900">{rep.bookingCount}</p>
                    <p className="mt-0.5 text-xs font-medium text-sky-700">
                      ${rep.bookingRevenue.toLocaleString()} booked
                    </p>
                  </div>
                  <div className="bg-slate-50/80 px-6 py-4" style={{ borderColor: COLORS.borderDark }}>
                    <p className="mb-1 text-xs uppercase tracking-wider" style={{ color: COLORS.textMuted2 }}>
                      Commission
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      ${repCommission.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-emerald-800">{repCommissionPercent}% rate</p>
                  </div>
                  <div className="bg-slate-50/80 px-6 py-4" style={{ borderColor: COLORS.borderDark }}>
                    <p className="mb-1 text-xs uppercase tracking-wider" style={{ color: COLORS.textMuted2 }}>
                      Company Net
                    </p>
                    <p className="text-2xl font-black text-slate-900">${repNet.toLocaleString()}</p>
                    <p className="mt-0.5 text-xs font-medium text-amber-800">After commission</p>
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: card.color }}>
            {card.label}
          </p>
          <p className="text-3xl font-black text-slate-900">{card.value}</p>
          <p className="mt-1 text-xs font-medium" style={{ color: COLORS.textMuted }}>
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
    { id: "email", label: "Email" },
    { id: "users", label: "Users" },
    { id: "danger", label: "Reset DB" },
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

        <nav className="flex-1 space-y-1 px-3 py-6">
          {tabs.flatMap((item) => {
            const sectionButton = (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                  activeSection === item.id
                    ? "text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
                style={
                  activeSection === item.id
                    ? { background: `linear-gradient(135deg, ${COLORS.indigo} 0%, #4f46e5 100%)` }
                    : {}
                }
              >
                {item.label}
              </button>
            );
            if (item.id !== "email") {
              return [sectionButton];
            }
            const leadsActive = pathname.startsWith("/admin/leads");
            return [
              sectionButton,
              <Link
                key="admin-leads-nav"
                href="/admin/leads"
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  leadsActive ? "text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
                style={
                  leadsActive ? { background: `linear-gradient(135deg, ${COLORS.indigo} 0%, #4f46e5 100%)` } : {}
                }
              >
                Leads
              </Link>,
            ];
          })}
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
          {tabs.flatMap((item) => {
            const sectionButton = (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-xs transition-all ${
                  activeSection === item.id ? "text-indigo-500" : "text-slate-500"
                }`}
              >
                {item.label}
              </button>
            );
            if (item.id !== "email") {
              return [sectionButton];
            }
            const leadsActive = pathname.startsWith("/admin/leads");
            return [
              sectionButton,
              <Link
                key="admin-leads-nav-mobile"
                href="/admin/leads"
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-xs transition-all ${
                  leadsActive ? "text-indigo-500" : "text-slate-500"
                }`}
              >
                Leads
              </Link>,
            ];
          })}
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
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Email</h2>
                  <p className="text-sm text-slate-600">
                    Send messages from the admin panel. Open a lead to see submitted details and run quotes or payment links.
                  </p>
                </div>
                <Button asChild className="shrink-0 rounded-full">
                  <Link href="/admin/leads">View all leads</Link>
                </Button>
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
                    <CardTitle>Add contact</CardTitle>
                    <CardDescription>
                      Manually add someone to your leads list. Form submissions appear automatically under{" "}
                      <Link href="/admin/leads" className="font-medium text-primary underline-offset-4 hover:underline">
                        Leads
                      </Link>
                      .
                    </CardDescription>
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

                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="button" onClick={handleCreateContact} className="rounded-full">
                        Add contact
                      </Button>
                      {contactStatus ? <p className="text-sm text-slate-600">{contactStatus}</p> : null}
                    </div>

                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                      <p className="text-sm font-medium text-slate-900">Review submissions</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Each lead opens on its own page with clear read-only fields and the quote workspace.
                      </p>
                      <Button asChild type="button" variant="outline" className="mt-3 rounded-full bg-white">
                        <Link href="/admin/leads">
                          <ExternalLink className="mr-2 size-4" />
                          Open leads
                        </Link>
                      </Button>
                    </div>
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
              <CardTitle>Site imagery</CardTitle>
              <CardDescription>
                Hero and full-page background images, the homepage photo strip, and mid-page accent backgrounds for the quote
                landing page and public marketing pages. Uploads use the same storage as review photos; you can also paste a
                direct image URL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-10">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">Hero background image</p>
                <p className="text-xs text-slate-500">
                  Full-viewport photo behind the quote page hero (headline, bullets, and form). Uses the default stock image when
                  empty. Blended with overlays for readability.
                </p>
                {publicBusiness.heroBackgroundImageUrl ? (
                  <div className="relative h-32 w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <Image
                      src={storedMediaToDisplayUrl(publicBusiness.heroBackgroundImageUrl)}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="site-hero-bg-upload"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) {
                        return;
                      }
                      void (async () => {
                        try {
                          const url = await postSiteImage(file, "hero");
                          renormalizePublicBusiness({ heroBackgroundImageUrl: url });
                          setToast("Hero background updated.");
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Upload failed.");
                        }
                      })();
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={siteImageBusy === "hero"}
                    onClick={() => document.getElementById("site-hero-bg-upload")?.click()}
                  >
                    <Upload className="mr-2 size-4" />
                    {siteImageBusy === "hero" ? "Uploading…" : "Upload background"}
                  </Button>
                  {publicBusiness.heroBackgroundImageUrl ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => updatePublicBusiness("heroBackgroundImageUrl", "")}>
                      <Trash2 className="mr-2 size-4" />
                      Remove
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-hero-bg-url">Hero background URL (optional)</Label>
                  <Input
                    id="site-hero-bg-url"
                    value={publicBusiness.heroBackgroundImageUrl}
                    onChange={(event) => updatePublicBusiness("heroBackgroundImageUrl", event.target.value)}
                    placeholder="https://… or leave blank"
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">Full-page background image</p>
                <p className="text-xs text-slate-500">
                  Subtle texture across the full viewport on marketing pages and the quote page (heavily faded; use a soft or
                  low-contrast photo).
                </p>
                {publicBusiness.pageBackdropImageUrl ? (
                  <div className="relative h-28 w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <Image
                      src={storedMediaToDisplayUrl(publicBusiness.pageBackdropImageUrl)}
                      alt=""
                      fill
                      className="object-cover opacity-90"
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="site-page-backdrop-upload"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) {
                        return;
                      }
                      void (async () => {
                        try {
                          const url = await postSiteImage(file, "backdrop");
                          renormalizePublicBusiness({ pageBackdropImageUrl: url });
                          setToast("Full-page background updated.");
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Upload failed.");
                        }
                      })();
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={siteImageBusy === "backdrop"}
                    onClick={() => document.getElementById("site-page-backdrop-upload")?.click()}
                  >
                    <Upload className="mr-2 size-4" />
                    {siteImageBusy === "backdrop" ? "Uploading…" : "Upload background"}
                  </Button>
                  {publicBusiness.pageBackdropImageUrl ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => updatePublicBusiness("pageBackdropImageUrl", "")}>
                      <Trash2 className="mr-2 size-4" />
                      Remove
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-page-backdrop-url">Full-page background URL (optional)</Label>
                  <Input
                    id="site-page-backdrop-url"
                    value={publicBusiness.pageBackdropImageUrl}
                    onChange={(event) => updatePublicBusiness("pageBackdropImageUrl", event.target.value)}
                    placeholder="https://… or leave blank"
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">Service / gallery images</p>
                  <p className="text-xs text-slate-500">
                    {publicBusiness.serviceSectionImageUrls.length} / 12
                  </p>
                </div>
                <p className="text-xs text-slate-500">Horizontal gallery on the homepage (after the &quot;What&apos;s included&quot; block).</p>
                <div className="flex flex-wrap gap-3">
                  {publicBusiness.serviceSectionImageUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative h-24 w-36 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <Image src={storedMediaToDisplayUrl(url)} alt="" fill className="object-cover" unoptimized />
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute right-1 top-1 size-8 rounded-full shadow-md"
                        onClick={() =>
                          setPublicBusiness((current) =>
                            normalizePublicBusinessConfig(
                              {
                                ...current,
                                serviceSectionImageUrls: current.serviceSectionImageUrls.filter((_, i) => i !== index),
                              },
                              scheduleWindows.rep,
                            ),
                          )
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {publicBusiness.serviceSectionImageUrls.length < 12 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="site-service-gallery-upload"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) {
                          return;
                        }
                        void (async () => {
                          try {
                            const url = await postSiteImage(file, "service-gallery");
                            setPublicBusiness((current) =>
                              normalizePublicBusinessConfig(
                                {
                                  ...current,
                                  serviceSectionImageUrls: [...current.serviceSectionImageUrls, url],
                                },
                                scheduleWindows.rep,
                              ),
                            );
                            setToast("Image added to gallery.");
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Upload failed.");
                          }
                        })();
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={siteImageBusy === "service-gallery"}
                      onClick={() => document.getElementById("site-service-gallery-upload")?.click()}
                    >
                      <Upload className="mr-2 size-4" />
                      {siteImageBusy === "service-gallery" ? "Uploading…" : "Add image"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Remove an image to add more (max 12).</p>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">Mid-page accent background images</p>
                  <p className="text-xs text-slate-500">
                    {publicBusiness.randomBackgroundImageUrls.length} / 24
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  Pool of images; each visit picks one at random for the mid-page accent section (client-only random choice, so
                  server HTML stays stable).
                </p>
                <div className="flex flex-wrap gap-3">
                  {publicBusiness.randomBackgroundImageUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative h-24 w-36 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <Image src={storedMediaToDisplayUrl(url)} alt="" fill className="object-cover" unoptimized />
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute right-1 top-1 size-8 rounded-full shadow-md"
                        onClick={() =>
                          setPublicBusiness((current) =>
                            normalizePublicBusinessConfig(
                              {
                                ...current,
                                randomBackgroundImageUrls: current.randomBackgroundImageUrls.filter((_, i) => i !== index),
                              },
                              scheduleWindows.rep,
                            ),
                          )
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {publicBusiness.randomBackgroundImageUrls.length < 24 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="site-random-bg-upload"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) {
                          return;
                        }
                        void (async () => {
                          try {
                            const url = await postSiteImage(file, "random-bg");
                            setPublicBusiness((current) =>
                              normalizePublicBusinessConfig(
                                {
                                  ...current,
                                  randomBackgroundImageUrls: [...current.randomBackgroundImageUrls, url],
                                },
                                scheduleWindows.rep,
                              ),
                            );
                            setToast("Image added to accent pool.");
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Upload failed.");
                          }
                        })();
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={siteImageBusy === "random-bg"}
                      onClick={() => document.getElementById("site-random-bg-upload")?.click()}
                    >
                      <Upload className="mr-2 size-4" />
                      {siteImageBusy === "random-bg" ? "Uploading…" : "Add to pool"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Remove an image to add more (max 24).</p>
                )}
              </div>
            </CardContent>
          </Card>

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

          {activeSection === "danger" ? (
          <Card className="border border-rose-200 bg-rose-50/80 text-slate-900 shadow-sm">
            <CardHeader>
              <CardTitle>Danger zone</CardTitle>
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
          ) : null}
        </div>
      </div>
      </div>
    </div>
  );
}

