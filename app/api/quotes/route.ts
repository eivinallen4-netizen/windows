import { NextResponse } from "next/server";
import { computeQuote, type QuoteSelections } from "@/lib/quote";
import { readPricing } from "@/lib/pricing-store";
import { getSessionFromRequest } from "@/lib/auth";
import { createQuote, readQuotes, writeQuotes, type QuoteRecord } from "@/lib/quotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QuotePostBody = {
  user?: { name?: string; email?: string; address?: string };
  selections?: QuoteSelections;
  totals?: { total?: number };
  created_at?: string;
};

function isValidEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

function hasValidUser(
  user: QuotePostBody["user"]
): user is { name: string; email: string; address: string } {
  return Boolean(user?.name && user.email && user.address && isValidEmail(user.email));
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as QuotePostBody;

    if (!hasValidUser(body.user)) {
      return NextResponse.json(
        { error: "Name, address, and a valid email are required." },
        { status: 400 }
      );
    }

    if (!body.selections) {
      return NextResponse.json({ error: "selections is required" }, { status: 400 });
    }

    const paneCounts = (body.selections.paneCounts ?? {}) as Record<string, number>;
    const totalWindows = Object.values(paneCounts).reduce((sum, count) => sum + count, 0);
    if (totalWindows <= 0) {
      return NextResponse.json({ error: "Window count must be greater than 0." }, { status: 400 });
    }

    const pricing = await readPricing();
    const totals = computeQuote(pricing, body.selections);

    await createQuote({
      id: globalThis.crypto?.randomUUID?.() ?? `quote_${Date.now()}`,
      user: body.user,
      rep: { name: session.name ?? session.email, email: session.email },
      selections: body.selections,
      totals,
      created_at: body.created_at || new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to save quote." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const quotes = await readQuotes();
    const payload = quotes.map((quote, index) => ({
      ...quote,
      index,
    }));
    return NextResponse.json({ quotes: payload });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load quotes." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as { index?: number; record?: QuoteRecord };
    if (body.index === undefined || !body.record) {
      return NextResponse.json({ error: "Quote index and record are required." }, { status: 400 });
    }

    const quotes = await readQuotes();
    if (body.index < 0 || body.index >= quotes.length) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    quotes[body.index] = body.record;
    await writeQuotes(quotes);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update quote." }, { status: 500 });
  }
}
