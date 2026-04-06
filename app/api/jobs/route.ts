import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { addJob, getJobs, type PaneCounts } from "@/lib/jobs";
import { reconcilePendingStripeJobs } from "@/lib/stripe-job-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await reconcilePendingStripeJobs();
    const jobs = await getJobs();
    if (session.role === "admin") {
      return NextResponse.json({ jobs });
    }
    if (session.role === "tech") {
      const filtered = jobs.filter((job) => job.assigned_tech_email === session.email);
      return NextResponse.json({ jobs: filtered });
    }

    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load jobs." }, { status: 500 });
  }
}

type CreateJobPayload = {
  customer?: { name?: string; email?: string; address?: string };
  pane_counts?: PaneCounts;
  pane_total?: number;
  service_date?: string;
  service_time?: string;
  amount_total?: number;
  payment_status?: string;
  assigned_tech_email?: string;
  rep?: { name?: string; email?: string };
  payment_intent_id?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as CreateJobPayload;

    const id = `job_${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();

    const job = await addJob({
      id,
      stripe_session_id: undefined,
      payment_intent_id: body.payment_intent_id?.trim() || undefined,
      amount_total: Number.isFinite(body.amount_total) ? body.amount_total : undefined,
      currency: "usd",
      customer: {
        name: body.customer?.name?.trim() || undefined,
        email: body.customer?.email?.trim() || undefined,
        address: body.customer?.address?.trim() || undefined,
      },
      pane_counts: body.pane_counts,
      pane_total: Number.isFinite(body.pane_total) ? body.pane_total : undefined,
      service_date: body.service_date?.trim() || undefined,
      service_time: body.service_time?.trim() || undefined,
      rep: body.rep?.email
        ? { email: body.rep.email.trim(), name: body.rep.name?.trim() || undefined }
        : undefined,
      assigned_tech_email: body.assigned_tech_email?.trim() || undefined,
      payment_status: body.payment_status?.trim() || "authorized",
      created_at: createdAt,
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to create job." }, { status: 500 });
  }
}
