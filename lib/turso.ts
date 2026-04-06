import "server-only";

import { createClient, type InArgs, type Client } from "@libsql/client";

let client: Client | null = null;
let schemaPromise: Promise<void> | null = null;

function getClient() {
  if (client) {
    return client;
  }

  client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  return client;
}

export function hasTursoConfig() {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = getClient();
      await db.batch(
        [
          {
            sql: `
              CREATE TABLE IF NOT EXISTS app_config (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                data TEXT NOT NULL
              )
            `,
          },
          {
            sql: `
              CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                created_at TEXT,
                data TEXT NOT NULL
              )
            `,
          },
          {
            sql: `
              CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                stripe_session_id TEXT UNIQUE,
                payment_intent_id TEXT UNIQUE,
                created_at TEXT,
                data TEXT NOT NULL
              )
            `,
          },
          {
            sql: `
              CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                transaction_key TEXT NOT NULL UNIQUE,
                payment_intent_id TEXT,
                stripe_session_id TEXT,
                job_id TEXT,
                created_at TEXT,
                updated_at TEXT,
                data TEXT NOT NULL
              )
            `,
          },
          {
            sql: `
              CREATE TABLE IF NOT EXISTS contacts (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                created_at TEXT,
                data TEXT NOT NULL
              )
            `,
          },
          {
            sql: `
              CREATE TABLE IF NOT EXISTS quotes (
                id TEXT PRIMARY KEY,
                created_at TEXT,
                data TEXT NOT NULL
              )
            `,
          },
          {
            sql: `
              CREATE TABLE IF NOT EXISTS bookings (
                session_id TEXT PRIMARY KEY,
                created_at TEXT,
                data TEXT NOT NULL
              )
            `,
          },
          {
            sql: `
              CREATE TABLE IF NOT EXISTS reviews (
                id TEXT PRIMARY KEY,
                created_at TEXT,
                job_id TEXT,
                tech_email TEXT,
                data TEXT NOT NULL
              )
            `,
          },
        ],
        "write"
      );
    })();
  }

  return schemaPromise;
}

export async function tursoExecute(
  input: string | { sql: string; args?: InArgs }
) {
  if (!hasTursoConfig()) {
    throw new Error("Turso is not configured.");
  }

  await ensureSchema();
  return getClient().execute(input);
}

export async function tursoBatch(
  statements: Array<{ sql: string; args?: InArgs }>
) {
  if (!hasTursoConfig()) {
    throw new Error("Turso is not configured.");
  }

  await ensureSchema();
  return getClient().batch(statements, "write");
}
