import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { defaultAppConfig, readAppConfig, writeAppConfig, type AppConfig } from "@/lib/app-config";
import { hasTursoConfig, tursoBatch } from "@/lib/turso";

const DATA_DIR = path.join(process.cwd(), "data");

const EMPTY_JSON_FILES = [
  path.join(DATA_DIR, "contacts.json"),
  path.join(DATA_DIR, "jobs.json"),
  path.join(DATA_DIR, "schedules.json"),
  path.join(DATA_DIR, "transactions.json"),
] as const;

const EMPTY_TEXT_FILES = [
  path.join(DATA_DIR, "quotes.jsonl"),
  path.join(DATA_DIR, "bookings.jsonl"),
] as const;

export const NON_USER_RESET_TABLES = [
  "bookings",
  "contacts",
  "jobs",
  "quotes",
  "schedules",
  "transactions",
] as const;

export async function resetNonUserData(): Promise<AppConfig> {
  if (hasTursoConfig()) {
    await tursoBatch(NON_USER_RESET_TABLES.map((table) => ({ sql: `DELETE FROM ${table}` })));
    await writeAppConfig(defaultAppConfig);
    return readAppConfig();
  }

  await fs.mkdir(DATA_DIR, { recursive: true });

  await Promise.all([
    ...EMPTY_JSON_FILES.map((filePath) => fs.writeFile(filePath, "[]", "utf8")),
    ...EMPTY_TEXT_FILES.map((filePath) => fs.writeFile(filePath, "", "utf8")),
  ]);

  await writeAppConfig(defaultAppConfig);
  return readAppConfig();
}
