import { readAppConfig } from "@/lib/app-config";
import { readQuotes, type QuoteRecord } from "@/lib/quotes";
import { readTransactions, reconcileTransactionsFromJobs, type TransactionRecord } from "@/lib/transactions";
import { normalizeUserRole, readUsers } from "@/lib/users";

type RepStatEntry = {
  key: string;
  name: string;
  email: string;
  quoteCount: number;
  quoteRevenue: number;
  paidJobCount: number;
  pendingJobCount: number;
  paidRevenue: number;
  pendingRevenue: number;
  paidPanes: number;
  pendingPanes: number;
  repCut: number;
  pendingCut: number;
  recentWins: number;
  averageTicket: number;
  conversionRate: number;
  score: number;
  tier: string;
  rank: number;
};

type RepJobEntry = {
  jobId: string;
  stripeSessionId: string | null;
  paymentIntentId: string;
  customerName: string;
  amountTotal: number;
  paneTotal: number;
  serviceDate: string | null;
  serviceTime: string | null;
  paymentStatus: "authorized" | "captured" | "succeeded";
  repCut: number;
  lineItems: TransactionRecord["line_items"];
};

export type RepStatsPayload = {
  leaderboard: RepStatEntry[];
  myStats: RepStatEntry | null;
  myJobs: RepJobEntry[];
  viewerEmail: string | null;
  teamSummary: {
    totalReps: number;
    totalQuotes: number;
    totalPaidBookings: number;
    totalPendingBookings: number;
    totalPaidRevenue: number;
    totalPendingRevenue: number;
    totalPaidPanes: number;
    totalPendingPanes: number;
    topCloserName: string | null;
  };
  repCommissionPercent: number;
  repCommissionRate: number;
};

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}

function getRepTier(score: number) {
  if (score >= 3000) return "Glass Closer";
  if (score >= 1800) return "Street Sniper";
  if (score >= 900) return "Door Knocker";
  if (score >= 300) return "Board Mover";
  return "On The Board";
}

function getTransactionTimestamp(transaction: TransactionRecord) {
  const source = transaction.captured_at || transaction.authorized_at || transaction.created_at;
  if (!source) return null;
  const value = new Date(source).getTime();
  return Number.isFinite(value) ? value : null;
}

function hasStripeLinkedRepTransaction(record: TransactionRecord) {
  return (
    Boolean(record.rep?.email) &&
    Boolean(record.payment_intent_id) &&
    (record.payment_status === "authorized" ||
      record.payment_status === "captured" ||
      record.payment_status === "succeeded")
  );
}

function createEmptyEntry(name: string, email: string): RepStatEntry {
  return {
    key: email || name || "unknown",
    name: name || email || "Unknown",
    email: email || "unknown",
    quoteCount: 0,
    quoteRevenue: 0,
    paidJobCount: 0,
    pendingJobCount: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    paidPanes: 0,
    pendingPanes: 0,
    repCut: 0,
    pendingCut: 0,
    recentWins: 0,
    averageTicket: 0,
    conversionRate: 0,
    score: 0,
    tier: "On The Board",
    rank: 0,
  };
}

function pickRepName(current: string, next?: string | null) {
  const trimmed = next?.trim();
  if (!trimmed) return current;
  if (!current || current === "Unknown" || current.includes("@")) return trimmed;
  return current;
}

export async function getRepStats(viewerEmail?: string | null): Promise<RepStatsPayload> {
  await reconcileTransactionsFromJobs();
  const [users, quotes, transactions, appConfig] = await Promise.all([
    readUsers(),
    readQuotes(),
    readTransactions(),
    readAppConfig(),
  ]);
  const byRep = new Map<string, RepStatEntry>();
  const recentWindow = Date.now() - 1000 * 60 * 60 * 24 * 7;
  const seenTransactions = new Set<string>();
  const linkedTransactions = transactions.filter((record) => {
    if (!hasStripeLinkedRepTransaction(record) || !record.payment_intent_id) {
      return false;
    }
    if (seenTransactions.has(record.payment_intent_id)) {
      return false;
    }
    seenTransactions.add(record.payment_intent_id);
    return true;
  });
  const paidTransactions = linkedTransactions.filter(
    (record) => record.payment_status === "captured" || record.payment_status === "succeeded"
  );
  const pendingAuthorizedTransactions = linkedTransactions.filter(
    (record) => record.payment_status === "authorized"
  );
  const repCommissionPercent = Math.max(0, Math.min(100, appConfig.repCommissionPercent ?? 25));
  const repCommissionRate = repCommissionPercent / 100;

  function upsertRep(name: string, email: string) {
    const key = normalizeEmail(email) || normalizeEmail(name) || "unknown";
    const current = byRep.get(key);
    if (current) {
      current.name = pickRepName(current.name, name);
      if (email) current.email = email;
      return current;
    }
    const entry = createEmptyEntry(name, email);
    entry.key = key;
    byRep.set(key, entry);
    return entry;
  }

  users
    .filter((user) => normalizeUserRole(user) === "rep")
    .forEach((user) => {
      upsertRep(user.name || user.email, user.email);
    });

  quotes.forEach((quote: QuoteRecord) => {
    const repEmail = normalizeEmail(quote.rep?.email);
    const repName = quote.rep?.name?.trim() || repEmail || "Unknown";
    const entry = upsertRep(repName, repEmail);
    entry.quoteCount += 1;
    entry.quoteRevenue += Number(quote.totals?.total || 0);
  });

  paidTransactions.forEach((transaction) => {
    const repEmail = normalizeEmail(transaction.rep?.email);
    const repName = transaction.rep?.name?.trim() || repEmail || "Unknown";
    const entry = upsertRep(repName, repEmail);
    entry.paidJobCount += 1;
    entry.paidRevenue += Number(transaction.amount_total || 0);
    entry.paidPanes += Number(transaction.pane_total || 0);
    const timestamp = getTransactionTimestamp(transaction);
    if (timestamp && timestamp >= recentWindow) {
      entry.recentWins += 1;
    }
  });

  pendingAuthorizedTransactions.forEach((transaction) => {
    const repEmail = normalizeEmail(transaction.rep?.email);
    const repName = transaction.rep?.name?.trim() || repEmail || "Unknown";
    const entry = upsertRep(repName, repEmail);
    entry.pendingJobCount += 1;
    entry.pendingRevenue += Number(transaction.amount_total || 0);
    entry.pendingPanes += Number(transaction.pane_total || 0);
  });

  const leaderboard = Array.from(byRep.values())
    .map((entry) => {
      const averageTicket = entry.paidJobCount > 0 ? entry.paidRevenue / entry.paidJobCount : 0;
      const conversionRate = entry.quoteCount > 0 ? entry.paidJobCount / entry.quoteCount : 0;
      const repCut = entry.paidRevenue * repCommissionRate;
      const pendingCut = entry.pendingRevenue * repCommissionRate;
      const score =
        Math.round(entry.paidRevenue) +
        entry.paidJobCount * 120 +
        entry.paidPanes * 18 +
        entry.quoteCount * 12 +
        entry.recentWins * 75;

      return {
        ...entry,
        averageTicket,
        conversionRate,
        repCut,
        pendingCut,
        score,
        tier: getRepTier(score),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.paidRevenue !== a.paidRevenue) return b.paidRevenue - a.paidRevenue;
      return b.quoteCount - a.quoteCount;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const normalizedViewerEmail = normalizeEmail(viewerEmail);
  const myStats = normalizedViewerEmail
    ? leaderboard.find((entry) => normalizeEmail(entry.email) === normalizedViewerEmail) ?? null
    : null;
  const myJobs = normalizedViewerEmail
    ? linkedTransactions
        .filter(
          (transaction) =>
            normalizeEmail(transaction.rep?.email) === normalizedViewerEmail && transaction.payment_intent_id
        )
        .map((transaction): RepJobEntry => ({
          jobId: transaction.job_id || "Missing",
          stripeSessionId: transaction.stripe_session_id ?? null,
          paymentIntentId: transaction.payment_intent_id!,
          customerName: transaction.customer?.name || "Unknown",
          amountTotal: Number(transaction.amount_total || 0),
          paneTotal: Number(transaction.pane_total || 0),
          serviceDate: transaction.service_date ?? null,
          serviceTime: transaction.service_time ?? null,
          paymentStatus:
            transaction.payment_status === "captured" || transaction.payment_status === "succeeded"
              ? transaction.payment_status
              : "authorized",
          repCut: Number(transaction.rep_commission_amount || 0),
          lineItems: transaction.line_items ?? [],
        }))
        .sort((a, b) => {
          const aDate = a.serviceDate ? new Date(`${a.serviceDate}T${a.serviceTime || "23:59"}`).getTime() : 0;
          const bDate = b.serviceDate ? new Date(`${b.serviceDate}T${b.serviceTime || "23:59"}`).getTime() : 0;
          return bDate - aDate;
        })
    : [];

  return {
    leaderboard,
    myStats,
    myJobs,
    viewerEmail: normalizedViewerEmail || null,
    teamSummary: {
      totalReps: leaderboard.length,
      totalQuotes: quotes.length,
      totalPaidBookings: paidTransactions.length,
      totalPendingBookings: pendingAuthorizedTransactions.length,
      totalPaidRevenue: paidTransactions.reduce((sum, transaction) => sum + Number(transaction.amount_total || 0), 0),
      totalPendingRevenue: pendingAuthorizedTransactions.reduce((sum, transaction) => sum + Number(transaction.amount_total || 0), 0),
      totalPaidPanes: paidTransactions.reduce((sum, transaction) => sum + Number(transaction.pane_total || 0), 0),
      totalPendingPanes: pendingAuthorizedTransactions.reduce((sum, transaction) => sum + Number(transaction.pane_total || 0), 0),
      topCloserName: leaderboard[0]?.name ?? null,
    },
    repCommissionPercent,
    repCommissionRate,
  };
}
