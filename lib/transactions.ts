import { promises as fs } from "fs";
import path from "path";
import { readAppConfig } from "@/lib/app-config";
import { getJobs, type JobRecord, type PaneCounts } from "@/lib/jobs";
import { hasTursoConfig, tursoExecute } from "@/lib/turso";

export type TransactionLineItem = {
  name: string;
  quantity: number;
  unit_amount: number;
  total_amount: number;
};

export type TransactionRecord = {
  id: string;
  job_id?: string;
  stripe_session_id?: string;
  payment_intent_id?: string;
  amount_total: number;
  currency: string;
  customer?: { name?: string; email?: string; address?: string };
  rep?: { name?: string; email?: string };
  tech?: { email?: string };
  pane_counts?: PaneCounts;
  pane_total?: number;
  service_date?: string;
  service_time?: string;
  line_items: TransactionLineItem[];
  payment_status?: string;
  payment_complete: boolean;
  rep_commission_percent: number;
  rep_commission_amount: number;
  pending_commission_amount: number;
  company_net_amount: number;
  pending_company_net_amount: number;
  created_at: string;
  updated_at: string;
  authorized_at?: string;
  captured_at?: string;
};

type TransactionSeed = Omit<
  Partial<TransactionRecord>,
  | "id"
  | "payment_complete"
  | "rep_commission_percent"
  | "rep_commission_amount"
  | "pending_commission_amount"
  | "company_net_amount"
  | "pending_company_net_amount"
  | "updated_at"
>;

const TRANSACTIONS_PATH = path.join(process.cwd(), "data", "transactions.json");

function isPaidStatus(status?: string) {
  return status === "captured" || status === "succeeded";
}

function isAuthorizedStatus(status?: string) {
  return status === "authorized";
}

function getTransactionKey(record: TransactionSeed | TransactionRecord) {
  return record.payment_intent_id || record.stripe_session_id || record.job_id || "";
}

function getTransactionSortValue(record: TransactionRecord) {
  return new Date(record.updated_at || record.created_at || 0).getTime() || 0;
}

function dedupeTransactions(records: TransactionRecord[]) {
  const byKey = new Map<string, TransactionRecord>();

  for (const record of records) {
    const key = getTransactionKey(record);
    if (!key) {
      continue;
    }

    const existing = byKey.get(key);
    if (!existing || getTransactionSortValue(record) >= getTransactionSortValue(existing)) {
      byKey.set(key, record);
    }
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const createdDelta = getTransactionSortValue(a) - getTransactionSortValue(b);
    if (createdDelta !== 0) {
      return createdDelta;
    }
    return a.id.localeCompare(b.id);
  });
}

async function readTransactionByKey(key: string): Promise<TransactionRecord | null> {
  if (hasTursoConfig()) {
    const result = await tursoExecute({
      sql: "SELECT data FROM transactions WHERE transaction_key = ? LIMIT 1",
      args: [key],
    });
    const raw = result.rows[0]?.data;
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(String(raw)) as TransactionRecord;
    } catch {
      return null;
    }
  }

  const records = await readTransactions();
  return records.find((record) => getTransactionKey(record) === key) ?? null;
}

export async function readTransactions(): Promise<TransactionRecord[]> {
  if (hasTursoConfig()) {
    const result = await tursoExecute("SELECT data FROM transactions ORDER BY created_at ASC, id ASC");
    const records = result.rows
      .map((row) => {
        try {
          return JSON.parse(String(row.data)) as TransactionRecord;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is TransactionRecord => Boolean(entry));
    return dedupeTransactions(records);
  }

  try {
    const raw = await fs.readFile(TRANSACTIONS_PATH, "utf8");
    if (!raw.trim()) {
      return [];
    }
    const parsed = JSON.parse(raw) as TransactionRecord[];
    return Array.isArray(parsed) ? dedupeTransactions(parsed) : [];
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code === "ENOENT" ||
      error instanceof SyntaxError
    ) {
      return [];
    }
    throw error;
  }
}

async function writeTransactions(records: TransactionRecord[]) {
  const dedupedRecords = dedupeTransactions(records);

  if (hasTursoConfig()) {
    for (const record of dedupedRecords) {
      await tursoExecute({
        sql: `
          INSERT INTO transactions
            (id, transaction_key, payment_intent_id, stripe_session_id, job_id, created_at, updated_at, data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(transaction_key) DO UPDATE SET
            id = excluded.id,
            payment_intent_id = excluded.payment_intent_id,
            stripe_session_id = excluded.stripe_session_id,
            job_id = excluded.job_id,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            data = excluded.data
        `,
        args: [
          record.id,
          getTransactionKey(record),
          record.payment_intent_id ?? null,
          record.stripe_session_id ?? null,
          record.job_id ?? null,
          record.created_at,
          record.updated_at,
          JSON.stringify(record),
        ],
      });
    }
    return;
  }

  await fs.mkdir(path.dirname(TRANSACTIONS_PATH), { recursive: true });
  await fs.writeFile(TRANSACTIONS_PATH, JSON.stringify(dedupedRecords, null, 2), "utf8");
}

export async function upsertTransaction(seed: TransactionSeed): Promise<TransactionRecord | null> {
  const key = getTransactionKey(seed);
  if (!key) {
    return null;
  }

  const [previous, appConfig] = await Promise.all([readTransactionByKey(key), readAppConfig()]);
  const now = new Date().toISOString();
  const paymentStatus = seed.payment_status ?? previous?.payment_status;
  const amountTotal = Number(seed.amount_total ?? previous?.amount_total ?? 0);
  const repCommissionPercent = Math.max(0, Math.min(100, appConfig.repCommissionPercent ?? 25));
  const repCommissionRate = repCommissionPercent / 100;
  const paymentComplete = isPaidStatus(paymentStatus);
  const authorizedOnly = isAuthorizedStatus(paymentStatus);

  const next: TransactionRecord = {
    id: previous?.id ?? `txn_${crypto.randomUUID()}`,
    job_id: seed.job_id ?? previous?.job_id,
    stripe_session_id: seed.stripe_session_id ?? previous?.stripe_session_id,
    payment_intent_id: seed.payment_intent_id ?? previous?.payment_intent_id,
    amount_total: amountTotal,
    currency: seed.currency ?? previous?.currency ?? "usd",
    customer: seed.customer ?? previous?.customer,
    rep: seed.rep ?? previous?.rep,
    tech: seed.tech ?? previous?.tech,
    pane_counts: seed.pane_counts ?? previous?.pane_counts,
    pane_total: seed.pane_total ?? previous?.pane_total,
    service_date: seed.service_date ?? previous?.service_date,
    service_time: seed.service_time ?? previous?.service_time,
    line_items: seed.line_items ?? previous?.line_items ?? [],
    payment_status: paymentStatus,
    payment_complete: paymentComplete,
    rep_commission_percent: repCommissionPercent,
    rep_commission_amount: paymentComplete ? amountTotal * repCommissionRate : 0,
    pending_commission_amount: authorizedOnly ? amountTotal * repCommissionRate : 0,
    company_net_amount: paymentComplete ? amountTotal * (1 - repCommissionRate) : 0,
    pending_company_net_amount: authorizedOnly ? amountTotal * (1 - repCommissionRate) : 0,
    created_at: previous?.created_at ?? seed.created_at ?? now,
    updated_at: now,
    authorized_at:
      seed.authorized_at ??
      previous?.authorized_at ??
      (authorizedOnly ? now : undefined),
    captured_at:
      seed.captured_at ??
      previous?.captured_at ??
      (paymentComplete ? now : undefined),
  };

  if (hasTursoConfig()) {
    await tursoExecute({
      sql: `
        INSERT INTO transactions
          (id, transaction_key, payment_intent_id, stripe_session_id, job_id, created_at, updated_at, data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(transaction_key) DO UPDATE SET
          id = excluded.id,
          payment_intent_id = excluded.payment_intent_id,
          stripe_session_id = excluded.stripe_session_id,
          job_id = excluded.job_id,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          data = excluded.data
      `,
      args: [
        next.id,
        key,
        next.payment_intent_id ?? null,
        next.stripe_session_id ?? null,
        next.job_id ?? null,
        next.created_at,
        next.updated_at,
        JSON.stringify(next),
      ],
    });
    return next;
  }

  const records = await readTransactions();
  const index = records.findIndex((record) => getTransactionKey(record) === key);
  if (index >= 0) {
    records[index] = next;
  } else {
    records.push(next);
  }
  await writeTransactions(records);
  return next;
}

export async function reconcileTransactionsFromJobs() {
  const jobs = await getJobs();
  for (const job of jobs) {
    if (!job.stripe_session_id && !job.payment_intent_id) {
      continue;
    }
    await upsertTransaction(transactionSeedFromJob(job));
  }
}

export function transactionSeedFromJob(job: JobRecord): TransactionSeed {
  return {
    job_id: job.id,
    stripe_session_id: job.stripe_session_id,
    payment_intent_id: job.payment_intent_id,
    amount_total: Number(job.amount_total || 0),
    currency: job.currency ?? "usd",
    customer: job.customer,
    rep: job.rep,
    tech: job.assigned_tech_email ? { email: job.assigned_tech_email } : undefined,
    pane_counts: job.pane_counts,
    pane_total: job.pane_total,
    service_date: job.service_date,
    service_time: job.service_time,
    payment_status: job.payment_status,
    created_at: job.created_at,
    authorized_at: job.payment_status === "authorized" ? job.created_at : undefined,
    captured_at:
      job.payment_status === "captured" || job.payment_status === "succeeded"
        ? job.completed_at ?? job.created_at
        : undefined,
  };
}
