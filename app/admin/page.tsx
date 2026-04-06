"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignJustify,
  BadgeDollarSign,
  Building2,
  Droplets,
  Grid2x2,
  Home,
  ScanLine,
  Sparkles,
  Square,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PortalSwitcher } from "@/components/portal-switcher";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AdminPanel } from "@/components/admin-panel";
import { defaultPricing, type PaneType, type Pricing, type StoryLevel } from "@/lib/pricing";
import { computeQuote, type AddOnSelection, type QuoteSelections } from "@/lib/quote";

export const dynamic = "force-dynamic";

const COLORS = {
  page: "#020817",
  sidebar: "#0a0f1e",
  card: "#0f172a",
  input: "#1e293b",
  border: "#334155",
  borderDark: "#1f2937",
  textMuted: "#94a3b8",
  textMuted2: "#64748b",
  indigo: "#6366f1",
  sky: "#0ea5e9",
  slate: "#1e293b",
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
  plans: {
    activePlan: AppPlan;
    free: {
      addonsFree: boolean;
    };
  };
};

type ContactRecord = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  created_at: string;
};

type UserRecord = {
  email: string;
  name?: string;
  role: "admin" | "rep" | "tech";
  is_admin: boolean;
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
  const [pricing, setPricing] = useState<Pricing>(defaultPricing);
  const [addonsConfig, setAddonsConfig] = useState<AddonConfig[]>([]);
  const [activePlan, setActivePlan] = useState<AppPlan>("pro");
  const [freeAddons, setFreeAddons] = useState(true);
  const [repCommissionPercent, setRepCommissionPercent] = useState(25);
  const [activeSection, setActiveSection] = useState<
    "quotes" | "reps" | "reviews" | "jobs" | "pricing" | "addons" | "email" | "users"
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
  const [emailLoaded, setEmailLoaded] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPin, setNewUserPin] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRecord["role"]>("rep");
  const [userStatus, setUserStatus] = useState<string | null>(null);

  useEffect(() => {
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
          setPricingJson(JSON.stringify(data.pricing, null, 2));
          setPricingJsonError(null);
          lastSavedRef.current = JSON.stringify({
            pricing: data.pricing,
            addonsConfig: data.addonsConfig ?? [],
            repCommissionPercent: Number.isFinite(data.repCommissionPercent) ? data.repCommissionPercent : 25,
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
  }, []);

  useEffect(() => {
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
  }, []);

  const loadJobs = useCallback(async () => {
    setJobsError(null);
    setJobsLoading(true);
    try {
      const response = await fetch("/api/jobs", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load jobs.");
      }
      const payload = (await response.json()) as { jobs: JobRecord[] };
      setJobs(payload.jobs ?? []);
    } catch (err) {
      console.error(err);
      setJobsError("Unable to load jobs.");
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setTransactionsError(null);
    try {
      const response = await fetch("/api/transactions", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load transactions.");
      }
      const payload = (await response.json()) as { transactions: TransactionRecord[] };
      setTransactions(payload.transactions ?? []);
    } catch (err) {
      console.error(err);
      setTransactionsError("Unable to load transactions.");
    }
  }, []);

  useEffect(() => {
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
  }, [loadJobs, loadTransactions]);

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
    setUsersError(null);
    setUsersLoading(true);
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
      setUsersError("Unable to load users.");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection !== "email" || emailLoaded) {
      return;
    }
    void loadContacts();
    setEmailLoaded(true);
  }, [activeSection, emailLoaded, loadContacts]);

  useEffect(() => {
    if (usersLoaded) {
      return;
    }
    void loadUsers();
    setUsersLoaded(true);
  }, [usersLoaded, loadUsers]);

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
    if (!contactEmail.trim()) {
      setContactStatus("Email is required.");
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
      setContactEmail("");
      setContactFirstName("");
      setContactLastName("");
      setContactPhone("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create contact.";
      setContactStatus(message);
    }
  }

  async function handleCreateUser() {
    setUserStatus(null);
    if (!newUserEmail.trim()) {
      setUserStatus("Email is required.");
      return;
    }
    if (!newUserPin.trim()) {
      setUserStatus("PIN is required.");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          name: newUserName.trim() || undefined,
          pin: newUserPin.trim(),
          role: newUserRole,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to create user.");
      }

      const payload = (await response.json()) as { user: UserRecord };
      setUsers((prev) => [
        { ...payload.user, role: payload.user.role ?? (payload.user.is_admin ? "admin" : "rep") },
        ...prev,
      ]);
      setUserStatus("User created.");
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPin("");
      setNewUserRole("rep");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create user.";
      setUserStatus(message);
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

  async function handleDeleteUser(email: string) {
    setUserStatus(null);
    try {
      const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to delete user.");
      }
      setUsers((prev) => prev.filter((user) => user.email !== email));
      setUserStatus("User deleted.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete user.";
      setUserStatus(message);
    }
  }

  async function handleResetPin(email: string) {
    const pin = window.prompt("Enter a new 4-6 digit PIN:");
    if (!pin) return;
    setUserStatus(null);
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to reset PIN.");
      }
      setUserStatus("PIN updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reset PIN.";
      setUserStatus(message);
    }
  }

  async function handleUpdateRole(email: string, role: UserRecord["role"]) {
    setUserStatus(null);
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to update user.");
      }
      const payload = (await response.json()) as { user: UserRecord };
      const normalized = {
        ...payload.user,
        role: payload.user.role ?? (payload.user.is_admin ? "admin" : "rep"),
      };
      setUsers((prev) => prev.map((user) => (user.email === email ? normalized : user)));
      setUserStatus("User updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update user.";
      setUserStatus(message);
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
      plans: {
        activePlan,
        free: {
          addonsFree: freeAddons,
        },
      },
    }),
    [pricing, addonsConfig, repCommissionPercent, activePlan, freeAddons]
  );

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
    () => users.filter((user) => user.role === "tech" || user.role === "admin"),
    [users]
  );
  const repUsers = useMemo(() => users.filter((user) => user.role === "rep"), [users]);

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
      .filter((user) => user.role === "rep")
      .forEach((user) => {
        getRep(user.email, user.name || user.email, user.email);
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
    { id: "pricing", label: "Pricing" },
    { id: "addons", label: "Add-ons" },
    { id: "email", label: "Email" },
    { id: "users", label: "Users" },
  ] as const;

  return (
    <div className="min-h-screen flex" style={{ background: COLORS.page }}>
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
              <p className="text-white font-black text-base leading-none">PureBin LV</p>
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
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
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
              activeSection === item.id ? "text-indigo-400" : "text-slate-500"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto pb-20 md:pb-0">
        <div
          className="border-b px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10"
          style={{ background: COLORS.page, borderColor: COLORS.borderDark }}
        >
          <div className="flex items-center gap-3">
            <div
              className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.sky})` }}
            >
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-white text-lg font-black">Admin Settings</h1>
              <p className="text-xs" style={{ color: COLORS.textMuted2 }}>
                Changes apply immediately
              </p>
            </div>
          </div>
          <PortalSwitcher role="admin" className="hidden md:flex items-center gap-2" />
        </div>

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
          <Card className="shadow-lg border border-slate-800 bg-[#0f172a] text-white">
            <CardHeader>
              <CardTitle>Quote Review</CardTitle>
              <CardDescription>Admins can review and edit saved quotes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quotes.length === 0 ? (
                <p className="text-sm text-slate-400">No saved quotes yet.</p>
              ) : (
                <div className="grid gap-2">
                  {quotes.map((quote) => (
                    <Button
                      key={`${quote.id ?? quote.index}`}
                      type="button"
                      variant={selectedQuote?.index === quote.index ? "default" : "outline"}
                      className={`h-auto justify-between px-4 py-3 text-left border ${
                        selectedQuote?.index === quote.index
                          ? "bg-[#0ea5e9] text-white border-transparent"
                          : "bg-[#0f172a] text-white border-slate-800 hover:bg-[#111827]"
                      }`}
                      onClick={() => selectQuote(quote)}
                    >
                      <span>
                        <span className="block text-sm font-semibold">{quote.user.name}</span>
                        <span className="block text-xs text-slate-400">{quote.user.email}</span>
                        {quote.rep ? (
                          <span className="block text-xs text-slate-400">
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
                    <p className="text-xs text-slate-400">
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
                      <Label>Window counts</Label>
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

                <div className="rounded-lg bg-[#0f172a] p-3 text-sm">
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
          <Card className="shadow-lg border border-slate-800 bg-[#0f172a] text-white">
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
            <Card className="shadow-lg border border-slate-800 bg-[#0f172a] text-white">
              <CardHeader>
                <CardTitle>Create Job</CardTitle>
                <CardDescription>Manually add a job for direct scheduling or offline follow-up.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testJobError ? <p className="text-sm text-destructive">{testJobError}</p> : null}
                {testJobStatus ? <p className="text-sm text-slate-400">{testJobStatus}</p> : null}
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
                      className="h-10 w-full rounded-md border border-slate-800 bg-[#0f172a] px-3 text-sm text-white"
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
                      className="h-10 w-full rounded-md border border-slate-800 bg-[#0f172a] px-3 text-sm text-white"
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
                      className="h-10 w-full rounded-md border border-slate-800 bg-[#0f172a] px-3 text-sm text-white"
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
                    <p className="text-xs text-slate-400">
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

            <Card className="shadow-lg border border-slate-800 bg-[#0f172a] text-white">
              <CardHeader>
                <CardTitle>Jobs</CardTitle>
                <CardDescription>Assign techs and monitor job status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobsError ? <p className="text-sm text-destructive">{jobsError}</p> : null}
                {jobsLoading ? (
                  <p className="text-sm text-slate-400">Loading jobs...</p>
                ) : jobs.length === 0 ? (
                  <p className="text-sm text-slate-400">No jobs yet.</p>
                ) : (
                  <div className="grid gap-3">
                    {jobs.map((job) => (
                      <div key={job.id} className="rounded-lg border border-slate-800 bg-[#0f172a] p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {job.customer?.name || "Customer"}{" "}
                              <span className="text-xs text-slate-400">{job.customer?.email || ""}</span>
                            </p>
                            <p className="text-xs text-slate-400">
                              Service: {job.service_date || "TBD"}{" "}
                              {job.service_time ? `at ${job.service_time}` : ""}
                            </p>
                            <p className="text-xs text-slate-400">
                              Status: {job.completed_at ? "Completed" : job.started_at ? "In progress" : "New"}
                            </p>
                            <p className="text-xs text-slate-400">Payment: {job.payment_status || "pending"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`job-tech-${job.id}`} className="text-xs text-slate-400">
                              Tech
                            </Label>
                            <select
                              id={`job-tech-${job.id}`}
                              value={job.assigned_tech_email ?? ""}
                              onChange={(event) => handleAssignTech(job.id, event.target.value)}
                              className="h-9 rounded-md border border-slate-800 bg-[#0f172a] px-2 text-xs text-white"
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
            <div className="rounded-2xl border bg-[#0f172a] p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Email</h2>
                  <p className="text-sm text-slate-400">Clean workspace for sending and contacts.</p>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
            <Card className="border border-slate-800 bg-[#0f172a] text-white">
              <CardHeader>
                <CardTitle>Compose</CardTitle>
                <CardDescription>Send via SMTP (Brevo).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 rounded-full border bg-[#0f172a] px-4 py-2">
                    <span className="text-xs font-semibold text-slate-400">To</span>
                    <input
                      className="w-full bg-transparent text-sm outline-none"
                      type="email"
                      value={emailTo}
                      onChange={(event) => setEmailTo(event.target.value)}
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="flex items-center gap-3 rounded-full border bg-[#0f172a] px-4 py-2">
                    <span className="text-xs font-semibold text-slate-400">Subject</span>
                    <input
                      className="w-full bg-transparent text-sm outline-none"
                      value={emailSubject}
                      onChange={(event) => setEmailSubject(event.target.value)}
                      placeholder="Subject"
                    />
                  </div>
                  <div className="rounded-xl border bg-[#0f172a] p-3">
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
                  {emailStatus ? <p className="text-sm text-slate-400">{emailStatus}</p> : null}
                </div>
              </CardContent>
            </Card>

              <Card className="border border-slate-800 bg-[#0f172a] text-white">
                <CardHeader>
                  <CardTitle>Contacts</CardTitle>
                  <CardDescription>Create a Brevo contact and save it locally.</CardDescription>
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
                    {contactStatus ? <p className="text-sm text-slate-400">{contactStatus}</p> : null}
                  </div>

                  <Separator />

                  {contactsError ? <p className="text-sm text-destructive">{contactsError}</p> : null}
                  {contactsLoading ? (
                    <p className="text-sm text-slate-400">Loading contacts...</p>
                  ) : contacts.length === 0 ? (
                    <p className="text-sm text-slate-400">No contacts saved yet.</p>
                  ) : (
                    <div className="grid gap-3">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="rounded-lg border bg-[#0f172a] p-3">
                          <p className="text-sm font-semibold">
                            {[contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unnamed"}
                          </p>
                          <p className="text-xs text-slate-400">{contact.email}</p>
                          {contact.phone ? (
                            <p className="text-xs text-slate-400">{contact.phone}</p>
                          ) : null}
                          <p className="text-xs text-slate-400">
                            {new Date(contact.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              </div>
            </div>
          </div>
          ) : null}

          {activeSection === "users" ? (
          <Card className="shadow-lg border border-slate-800 bg-[#0f172a] text-white">
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Create and manage sales rep logins.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {usersError ? <p className="text-sm text-destructive">{usersError}</p> : null}
              {userStatus ? <p className="text-sm text-slate-400">{userStatus}</p> : null}

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">Add User</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Name</Label>
                    <Input
                      id="user-name"
                      value={newUserName}
                      onChange={(event) => setNewUserName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={newUserEmail}
                      onChange={(event) => setNewUserEmail(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-pin">PIN (4-6 digits)</Label>
                    <Input
                      id="user-pin"
                      value={newUserPin}
                      onChange={(event) => setNewUserPin(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-role">Role</Label>
                    <select
                      id="user-role"
                      value={newUserRole}
                      onChange={(event) => setNewUserRole(event.target.value as UserRecord["role"])}
                      className="h-10 rounded-md border border-slate-800 bg-[#0f172a] px-3 text-sm text-white"
                    >
                      <option value="rep">Rep</option>
                      <option value="tech">Tech</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <Button type="button" onClick={handleCreateUser}>
                  Create User
                </Button>
              </div>

              <Separator />

              {usersLoading ? (
                <p className="text-sm text-slate-400">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-slate-400">No users yet.</p>
              ) : (
                <div className="grid gap-3">
                  {users.map((user) => (
                    <div key={user.email} className="rounded-lg border bg-[#0f172a] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{user.name || "Unnamed"}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                          <p className="text-xs text-slate-400">Role: {user.role}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => handleResetPin(user.email)}>
                            Reset PIN
                          </Button>
                          <select
                            value={user.role}
                            onChange={(event) =>
                              handleUpdateRole(user.email, event.target.value as UserRecord["role"])
                            }
                            className="h-9 rounded-md border border-slate-800 bg-[#0f172a] px-2 text-xs text-white"
                          >
                            <option value="rep">Rep</option>
                            <option value="tech">Tech</option>
                            <option value="admin">Admin</option>
                          </select>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.email)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          ) : null}

          {activeSection === "pricing" ? (
          <>
          <Card className="shadow-lg border border-slate-800 bg-[#0f172a] text-white">
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
                      <Label htmlFor={`pane-${row.id}`} className="text-xs text-slate-400">
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

          <Card className="shadow-lg border border-slate-800 bg-[#0f172a] text-white">
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
                  <Label htmlFor="story-surcharge" className="text-xs text-slate-400">
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

          <Card className="shadow-lg border border-slate-800 bg-[#0f172a] text-white">
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
                  <Label htmlFor="job-minimum" className="text-xs text-slate-400">
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

          <Card className="shadow-lg border border-slate-800 bg-[#0f172a] text-white">
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
                  <Label htmlFor="rep-commission" className="text-xs text-slate-400">
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

          <Card className="shadow-lg border border-slate-800 bg-[#0f172a] text-white">
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

          {activeSection === "addons" ? (
          <Card className="shadow-lg border border-slate-800 bg-[#0f172a] text-white">
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
                      <Label htmlFor={`addon-${addon.id}`} className="text-xs text-slate-400">
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
        </div>
      </div>
    </div>
  );
}
