import { promises as fs } from "fs";
import path from "path";
import { toPublicObjectUrl } from "@/lib/object-storage";
import { hasTursoConfig, tursoExecute } from "@/lib/turso";

export type PaneCounts = {
  standard?: number;
  specialty?: number;
  french?: number;
};

export type JobRecord = {
  id: string;
  stripe_session_id?: string;
  payment_intent_id?: string;
  amount_total?: number;
  currency?: string;
  customer?: { name?: string; email?: string; address?: string };
  pane_counts?: PaneCounts;
  pane_total?: number;
  service_date?: string;
  service_time?: string;
  rep?: { name?: string; email?: string };
  assigned_tech_email?: string;
  start_photo_url?: string;
  started_at?: string;
  walkthrough_confirmed_at?: string;
  completed_at?: string;
  payment_status?: string;
  review_id?: string;
  created_at?: string;
};

const dataDir = path.join(process.cwd(), "data");
const dataFilePath = path.join(dataDir, "jobs.json");

function toPublicJob(job: JobRecord): JobRecord {
  return {
    ...job,
    start_photo_url: toPublicObjectUrl(job.start_photo_url),
  };
}

async function getRawJobs(): Promise<JobRecord[]> {
  if (hasTursoConfig()) {
    const result = await tursoExecute("SELECT data FROM jobs ORDER BY created_at ASC, id ASC");
    return result.rows
      .map((row) => {
        try {
          return JSON.parse(String(row.data)) as JobRecord;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is JobRecord => Boolean(entry));
  }

  try {
    const raw = await fs.readFile(dataFilePath, "utf8");
    const parsed = JSON.parse(raw) as JobRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code === "ENOENT" ||
      error instanceof SyntaxError
    ) {
      return [];
    }
    return [];
  }
}

export async function getJobs(): Promise<JobRecord[]> {
  const jobs = await getRawJobs();
  return jobs.map(toPublicJob);
}

export async function saveJobs(jobs: JobRecord[]) {
  if (hasTursoConfig()) {
    await tursoExecute("DELETE FROM jobs");
    for (const job of jobs) {
      await tursoExecute({
        sql: "INSERT INTO jobs (id, stripe_session_id, payment_intent_id, created_at, data) VALUES (?, ?, ?, ?, ?)",
        args: [
          job.id,
          job.stripe_session_id ?? null,
          job.payment_intent_id ?? null,
          job.created_at ?? null,
          JSON.stringify(job),
        ],
      });
    }
    return;
  }

  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(jobs, null, 2), "utf8");
}

export async function addJob(job: JobRecord): Promise<JobRecord> {
  const jobs = await getRawJobs();
  jobs.push(job);
  await saveJobs(jobs);
  return job;
}

export async function updateJob(id: string, updater: (job: JobRecord) => JobRecord): Promise<JobRecord | null> {
  const jobs = await getRawJobs();
  const idx = jobs.findIndex((job) => job.id === id);
  if (idx === -1) return null;
  const updated = updater(jobs[idx]);
  jobs[idx] = updated;
  await saveJobs(jobs);
  return toPublicJob(updated);
}

export async function findJobById(id: string): Promise<JobRecord | null> {
  const jobs = await getRawJobs();
  const job = jobs.find((entry) => entry.id === id) ?? null;
  return job ? toPublicJob(job) : null;
}

export async function findJobByPaymentIntentId(paymentIntentId: string): Promise<JobRecord | null> {
  const jobs = await getRawJobs();
  const job = jobs.find((entry) => entry.payment_intent_id === paymentIntentId) ?? null;
  return job ? toPublicJob(job) : null;
}

export async function findJobByStripeSessionId(sessionId: string): Promise<JobRecord | null> {
  const jobs = await getRawJobs();
  const job = jobs.find((entry) => entry.stripe_session_id === sessionId) ?? null;
  return job ? toPublicJob(job) : null;
}
