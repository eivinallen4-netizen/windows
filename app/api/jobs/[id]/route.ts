import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { findJobById, updateJob } from "@/lib/jobs";
import { uploadPhotoFile } from "@/lib/job-review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "assignTech" | "saveStartPhoto" | "start" | "confirmWalkthrough" | "complete";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const job = await findJobById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    if (session.role === "admin") {
      return NextResponse.json({ job });
    }

    if (session.role === "tech" && job.assigned_tech_email === session.email) {
      return NextResponse.json({ job });
    }

    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load job." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");
    const formData = isMultipart ? await request.formData() : null;
    const body = isMultipart
      ? {
          action: String(formData?.get("action") ?? "") as Action,
          techEmail: String(formData?.get("techEmail") ?? "").trim() || undefined,
        }
      : ((await request.json()) as { action?: Action; techEmail?: string });

    if (!body.action) {
      return NextResponse.json({ error: "Action is required." }, { status: 400 });
    }

    const job = await findJobById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    if (body.action === "assignTech") {
      if (session.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
      const updated = await updateJob(id, (current) => ({
        ...current,
        assigned_tech_email: body.techEmail || undefined,
      }));
      return NextResponse.json({ job: updated });
    }

    if (session.role !== "admin" && session.role !== "tech") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (session.role === "tech" && job.assigned_tech_email !== session.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const now = new Date().toISOString();
    let startPhotoUrl: string | undefined;
    if (body.action === "saveStartPhoto" || body.action === "start") {
      const beforePhoto = formData?.get("beforePhoto");
      if (!job.start_photo_url && (!(beforePhoto instanceof File) || beforePhoto.size <= 0)) {
        return NextResponse.json({ error: "Before photo is required." }, { status: 400 });
      }
      if (beforePhoto instanceof File && beforePhoto.size > 0) {
        startPhotoUrl = await uploadPhotoFile(beforePhoto);
      }
    }

    const updated = await updateJob(id, (current) => {
      if (body.action === "saveStartPhoto") {
        return {
          ...current,
          start_photo_url: startPhotoUrl ?? current.start_photo_url,
        };
      }
      if (body.action === "start") {
        return {
          ...current,
          started_at: current.started_at ?? now,
          start_photo_url: startPhotoUrl ?? current.start_photo_url,
        };
      }
      if (body.action === "confirmWalkthrough") {
        return { ...current, walkthrough_confirmed_at: current.walkthrough_confirmed_at ?? now };
      }
      if (body.action === "complete") {
        return { ...current, completed_at: current.completed_at ?? now, payment_status: "ready_to_capture" };
      }
      return current;
    });

    return NextResponse.json({ job: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update job." }, { status: 500 });
  }
}
