import "server-only";

import { createClient, type InArgs, type Client } from "@libsql/client";

let client: Client | null = null;
let schemaPromise: Promise<void> | null = null;

function normalizeLegacyUserRecord(value: Record<string, unknown>) {
  const role =
    value.role === "admin" || value.role === "rep" || value.role === "tech"
      ? value.role
      : value.is_admin
        ? "admin"
        : "rep";
  const normalizedEmail = typeof value.email === "string" ? value.email.trim().toLowerCase() : undefined;
  const createdAt =
    typeof value.created_at === "string" && value.created_at.trim().length
      ? value.created_at
      : new Date().toISOString();

  return {
    id: typeof value.id === "string" && value.id.trim().length ? value.id : crypto.randomUUID(),
    email: normalizedEmail,
    name: typeof value.name === "string" && value.name.trim().length ? value.name.trim() : undefined,
    role,
    is_admin: role === "admin",
    phone: typeof value.phone === "string" && value.phone.trim().length ? value.phone.trim() : undefined,
    birthday: typeof value.birthday === "string" && value.birthday.trim().length ? value.birthday.trim() : undefined,
    pin_hash: typeof value.pin_hash === "string" && value.pin_hash.trim().length ? value.pin_hash.trim() : undefined,
    pin_salt: typeof value.pin_salt === "string" && value.pin_salt.trim().length ? value.pin_salt.trim() : undefined,
    created_at: createdAt,
    profile_completed_at:
      typeof value.profile_completed_at === "string" && value.profile_completed_at.trim().length
        ? value.profile_completed_at
        : normalizedEmail && value.pin_hash && value.pin_salt
          ? createdAt
          : undefined,
    last_signed_in_at:
      typeof value.last_signed_in_at === "string" && value.last_signed_in_at.trim().length
        ? value.last_signed_in_at
        : undefined,
    invite_token_hash:
      typeof value.invite_token_hash === "string" && value.invite_token_hash.trim().length
        ? value.invite_token_hash.trim()
        : undefined,
    invite_created_at:
      typeof value.invite_created_at === "string" && value.invite_created_at.trim().length
        ? value.invite_created_at
        : undefined,
    invite_expires_at:
      typeof value.invite_expires_at === "string" && value.invite_expires_at.trim().length
        ? value.invite_expires_at
        : undefined,
    invite_used_at:
      typeof value.invite_used_at === "string" && value.invite_used_at.trim().length
        ? value.invite_used_at
        : undefined,
  };
}

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
      const userColumns = await db.execute("PRAGMA table_info(users)");
      const hasIdPrimaryKey = userColumns.rows.some((row) => String(row.name) === "id");

      if (userColumns.rows.length > 0 && !hasIdPrimaryKey) {
        const existingUsers = await db.execute("SELECT data FROM users");

        await db.batch(
          [
            { sql: "ALTER TABLE users RENAME TO users_legacy" },
            {
              sql: `
                CREATE TABLE users (
                  id TEXT PRIMARY KEY,
                  email TEXT UNIQUE,
                  created_at TEXT,
                  data TEXT NOT NULL
                )
              `,
            },
          ],
          "write"
        );

        for (const row of existingUsers.rows) {
          try {
            const normalized = normalizeLegacyUserRecord(JSON.parse(String(row.data)) as Record<string, unknown>);
            await db.execute({
              sql: "INSERT INTO users (id, email, created_at, data) VALUES (?, ?, ?, ?)",
              args: [normalized.id, normalized.email ?? null, normalized.created_at, JSON.stringify(normalized)],
            });
          } catch {
            // Ignore malformed legacy rows during migration.
          }
        }

        await db.execute("DROP TABLE users_legacy");
      }

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
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
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
              CREATE TABLE IF NOT EXISTS schedules (
                week_start TEXT PRIMARY KEY,
                updated_at TEXT,
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
