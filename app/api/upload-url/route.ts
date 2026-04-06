import { NextResponse } from "next/server";
import { createPresignedUpload } from "@/lib/object-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { contentType?: string; prefix?: string };
    const { key, url } = await createPresignedUpload(body.prefix?.trim() || "uploads", body.contentType);
    return NextResponse.json({ key, url });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unable to create upload URL.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
