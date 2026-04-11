import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { uploadPhotoFileToStorage } from "@/lib/object-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.is_admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const prefixRaw = String(formData.get("prefix") ?? "site-media").trim() || "site-media";
    const prefix = prefixRaw.replace(/[^a-z0-9-_]/gi, "").slice(0, 40) || "site-media";

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    const url = await uploadPhotoFileToStorage(file, prefix);
    return NextResponse.json({ url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to upload image." }, { status: 500 });
  }
}
