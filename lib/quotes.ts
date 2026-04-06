import { promises as fs } from "fs";
import path from "path";
import { computeQuote, type QuoteSelections } from "@/lib/quote";

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
