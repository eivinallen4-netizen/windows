import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { findJobById } from "@/lib/jobs";
import { createReplacementAuthorizationSession } from "@/lib/job-payment-retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== "tech" && session.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const job = await findJobById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    if (session.role === "tech" && job.assigned_tech_email !== session.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const url = await createReplacementAuthorizationSession(request, job);
    return NextResponse.json({ url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to create replacement checkout." }, { status: 500 });
  }
}
