import { NextResponse } from "next/server";
import { getSignedR2DownloadUrl, hasR2Config } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.trim();

  if (!key) {
    return NextResponse.json({ error: "Missing file key." }, { status: 400 });
  }

  if (!hasR2Config()) {
    return NextResponse.json({ error: "R2 is not configured." }, { status: 500 });
  }

  try {
    const url = await getSignedR2DownloadUrl(key, 3600);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load file." }, { status: 500 });
  }
}
