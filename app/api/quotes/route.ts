import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { computeQuote, type QuoteSelections } from "@/lib/quote";
import { readPricing } from "@/lib/pricing-store";
import { getSessionFromRequest } from "@/lib/auth";

const QUOTES_PATH = path.join(process.cwd(), "data", "quotes.jsonl");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as {
      user?: { name?: string; email?: string; address?: string };
      selections?: QuoteSelections;
      totals?: { total?: number };
      created_at?: string;
    };

    if (!body.user?.email || !isValidEmail(body.user.email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    if (!body.user.name || !body.user.address) {
      return NextResponse.json({ error: "Name and address are required." }, { status: 400 });
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

    const record = {
      id: globalThis.crypto?.randomUUID?.() ?? `quote_${Date.now()}`,
      user: body.user,
      rep: { name: session.name ?? session.email, email: session.email },
      selections: body.selections,
      totals,
      created_at: body.created_at || new Date().toISOString(),
    };

    await fs.mkdir(path.dirname(QUOTES_PATH), { recursive: true });
    await fs.appendFile(QUOTES_PATH, `${JSON.stringify(record)}\n`, "utf8");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to save quote." }, { status: 500 });
  }
}

type QuoteRecord = {
  id?: string;
  user: { name: string; email: string; address: string };
  rep?: { name: string; email: string };
  selections: QuoteSelections;
  totals: ReturnType<typeof computeQuote>;
  created_at: string;
};

async function readQuotes(): Promise<QuoteRecord[]> {
  try {
    const data = await fs.readFile(QUOTES_PATH, "utf8");
    return data
      .split("\n")
      .filter((line) => line.trim().length)
      .map((line) => JSON.parse(line) as QuoteRecord);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
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
    await fs.mkdir(path.dirname(QUOTES_PATH), { recursive: true });
    const serialized = quotes.map((quote) => JSON.stringify(quote)).join("\n");
    await fs.writeFile(QUOTES_PATH, serialized + "\n", "utf8");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update quote." }, { status: 500 });
  }
}
