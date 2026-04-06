import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { createReviewForJob, readReviewFormData, validateReviewFormValues } from "@/lib/job-review";
import { findJobById, updateJob } from "@/lib/jobs";

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
    if (!job.started_at) {
      return NextResponse.json({ error: "Job must be started before submitting a review." }, { status: 400 });
    }

    const formData = await request.formData();
    const values = readReviewFormData(formData);
    const validationError = validateReviewFormValues(values, {
      requireBeforePhoto: !job.start_photo_url,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const saved = await createReviewForJob(job, session.email, values, {
      beforePhotoUrl: job.start_photo_url,
    });
    await updateJob(job.id, (current) => ({ ...current, review_id: saved.id }));
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to create review." }, { status: 500 });
  }
}
