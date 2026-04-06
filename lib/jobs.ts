import { promises as fs } from "fs";
import path from "path";

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

async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, "[]", "utf8");
  }
}

export async function getJobs(): Promise<JobRecord[]> {
  await ensureStorage();
  const raw = await fs.readFile(dataFilePath, "utf8");
  try {
    const parsed = JSON.parse(raw) as JobRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveJobs(jobs: JobRecord[]) {
  await ensureStorage();
  await fs.writeFile(dataFilePath, JSON.stringify(jobs, null, 2), "utf8");
}

export async function addJob(job: JobRecord): Promise<JobRecord> {
  const jobs = await getJobs();
  jobs.push(job);
  await saveJobs(jobs);
  return job;
}

export async function updateJob(id: string, updater: (job: JobRecord) => JobRecord): Promise<JobRecord | null> {
  const jobs = await getJobs();
  const idx = jobs.findIndex((job) => job.id === id);
  if (idx === -1) return null;
  const updated = updater(jobs[idx]);
  jobs[idx] = updated;
  await saveJobs(jobs);
  return updated;
}

export async function findJobById(id: string): Promise<JobRecord | null> {
  const jobs = await getJobs();
  return jobs.find((job) => job.id === id) ?? null;
}

export async function findJobByPaymentIntentId(paymentIntentId: string): Promise<JobRecord | null> {
  const jobs = await getJobs();
  return jobs.find((job) => job.payment_intent_id === paymentIntentId) ?? null;
}

export async function findJobByStripeSessionId(sessionId: string): Promise<JobRecord | null> {
  const jobs = await getJobs();
  return jobs.find((job) => job.stripe_session_id === sessionId) ?? null;
}
