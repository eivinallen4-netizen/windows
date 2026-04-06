import { NextResponse } from "next/server";
import { type Pricing } from "@/lib/pricing";
import { readPricing, writePricing } from "@/lib/pricing-store";

export async function GET() {
  try {
    const pricing = await readPricing();
    return NextResponse.json(pricing);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load pricing." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Pricing;

    if (!body?.paneTypes || !body?.addons || !body?.storySurcharge) {
      return NextResponse.json({ error: "Invalid pricing payload." }, { status: 400 });
    }

    await writePricing(body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to save pricing." }, { status: 500 });
  }
}
