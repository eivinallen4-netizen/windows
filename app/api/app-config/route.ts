import { NextResponse } from "next/server";
import { readAppConfig, writeAppConfig, type AppConfig } from "@/lib/app-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await readAppConfig();
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "Unable to load app config." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AppConfig;
    await writeAppConfig(body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to save app config." }, { status: 500 });
  }
}
