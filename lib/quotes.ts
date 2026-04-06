import { promises as fs } from "fs";
import path from "path";
import { computeQuote, type QuoteSelections } from "@/lib/quote";
import { hasTursoConfig, tursoExecute } from "@/lib/turso";

const QUOTES_PATH = path.join(process.cwd(), "data", "quotes.jsonl");

export type QuoteRecord = {
  id?: string;
  user: { name: string; email: string; address: string };
  rep?: { name?: string; email?: string };
  selections: QuoteSelections;
  totals: ReturnType<typeof computeQuote>;
  created_at: string;
};

export async function readQuotes(): Promise<QuoteRecord[]> {
  if (hasTursoConfig()) {
    const result = await tursoExecute("SELECT data FROM quotes ORDER BY created_at ASC, id ASC");
    return result.rows
      .map((row) => {
        try {
          return JSON.parse(String(row.data)) as QuoteRecord;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is QuoteRecord => Boolean(entry));
  }

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

export async function createQuote(record: QuoteRecord) {
  const id = record.id ?? globalThis.crypto?.randomUUID?.() ?? `quote_${Date.now()}`;
  const next = { ...record, id };

  if (hasTursoConfig()) {
    await tursoExecute({
      sql: "INSERT INTO quotes (id, created_at, data) VALUES (?, ?, ?)",
      args: [id, next.created_at, JSON.stringify(next)],
    });
    return next;
  }

  await fs.mkdir(path.dirname(QUOTES_PATH), { recursive: true });
  await fs.appendFile(QUOTES_PATH, `${JSON.stringify(next)}\n`, "utf8");
  return next;
}

export async function writeQuotes(quotes: QuoteRecord[]) {
  if (hasTursoConfig()) {
    await tursoExecute("DELETE FROM quotes");
    for (const quote of quotes) {
      const id = quote.id ?? globalThis.crypto?.randomUUID?.() ?? `quote_${Date.now()}`;
      await tursoExecute({
        sql: "INSERT INTO quotes (id, created_at, data) VALUES (?, ?, ?)",
        args: [id, quote.created_at, JSON.stringify({ ...quote, id })],
      });
    }
    return;
  }

  await fs.mkdir(path.dirname(QUOTES_PATH), { recursive: true });
  const serialized = quotes.map((quote) => JSON.stringify(quote)).join("\n");
  await fs.writeFile(QUOTES_PATH, serialized + (quotes.length ? "\n" : ""), "utf8");
}
