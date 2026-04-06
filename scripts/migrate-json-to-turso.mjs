import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@libsql/client";

const cwd = process.cwd();
const dataDir = path.join(cwd, "data");

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.startsWith("REPLACE_WITH_")) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function readJsonFile(fileName, fallback) {
  return fs
    .readFile(path.join(dataDir, fileName), "utf8")
    .then((raw) => JSON.parse(raw))
    .catch(() => fallback);
}

function readJsonLines(fileName) {
  return fs
    .readFile(path.join(dataDir, fileName), "utf8")
    .then((raw) =>
      raw
        .split("\n")
        .filter((line) => line.trim().length)
        .map((line) => JSON.parse(line))
    )
    .catch(() => []);
}

async function main() {
  const url = requireEnv("TURSO_DATABASE_URL");
  const authToken = requireEnv("TURSO_AUTH_TOKEN");

  const db = createClient({ url, authToken });

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

  const [
    appConfig,
    users,
    jobs,
    transactions,
    contacts,
    quotes,
    bookings,
    reviews,
  ] = await Promise.all([
    readJsonFile("app-config.json", null),
    readJsonFile("users.json", []),
    readJsonFile("jobs.json", []),
    readJsonFile("transactions.json", []),
    readJsonFile("contacts.json", []),
    readJsonLines("quotes.jsonl"),
    readJsonLines("bookings.jsonl"),
    readJsonFile("reviews.json", []),
  ]);

  await db.batch(
    [
      { sql: "DELETE FROM app_config" },
      { sql: "DELETE FROM users" },
      { sql: "DELETE FROM jobs" },
      { sql: "DELETE FROM transactions" },
      { sql: "DELETE FROM contacts" },
      { sql: "DELETE FROM quotes" },
      { sql: "DELETE FROM bookings" },
      { sql: "DELETE FROM reviews" },
    ],
    "write"
  );

  if (appConfig) {
    await db.execute({
      sql: "INSERT INTO app_config (id, data) VALUES (1, ?)",
      args: [JSON.stringify(appConfig)],
    });
  }

  for (const user of users) {
    await db.execute({
      sql: "INSERT INTO users (email, created_at, data) VALUES (?, ?, ?)",
      args: [user.email?.toLowerCase() ?? "", user.created_at ?? null, JSON.stringify(user)],
    });
  }

  for (const job of jobs) {
    await db.execute({
      sql: "INSERT INTO jobs (id, stripe_session_id, payment_intent_id, created_at, data) VALUES (?, ?, ?, ?, ?)",
      args: [
        job.id,
        job.stripe_session_id ?? null,
        job.payment_intent_id ?? null,
        job.created_at ?? null,
        JSON.stringify(job),
      ],
    });
  }

  for (const transaction of transactions) {
    const transactionKey =
      transaction.payment_intent_id || transaction.stripe_session_id || transaction.job_id || transaction.id;
    await db.execute({
      sql: `
        INSERT INTO transactions
          (id, transaction_key, payment_intent_id, stripe_session_id, job_id, created_at, updated_at, data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        transaction.id,
        transactionKey,
        transaction.payment_intent_id ?? null,
        transaction.stripe_session_id ?? null,
        transaction.job_id ?? null,
        transaction.created_at ?? null,
        transaction.updated_at ?? null,
        JSON.stringify(transaction),
      ],
    });
  }

  for (const contact of contacts) {
    await db.execute({
      sql: "INSERT INTO contacts (id, email, created_at, data) VALUES (?, ?, ?, ?)",
      args: [contact.id, contact.email?.toLowerCase() ?? "", contact.created_at ?? null, JSON.stringify(contact)],
    });
  }

  for (const quote of quotes) {
    const id = quote.id || `quote_${quote.created_at || Date.now()}`;
    await db.execute({
      sql: "INSERT INTO quotes (id, created_at, data) VALUES (?, ?, ?)",
      args: [id, quote.created_at ?? null, JSON.stringify({ ...quote, id })],
    });
  }

  for (const booking of bookings) {
    await db.execute({
      sql: "INSERT INTO bookings (session_id, created_at, data) VALUES (?, ?, ?)",
      args: [booking.session_id, booking.created_at ?? null, JSON.stringify(booking)],
    });
  }

  for (const review of reviews) {
    await db.execute({
      sql: "INSERT INTO reviews (id, created_at, job_id, tech_email, data) VALUES (?, ?, ?, ?, ?)",
      args: [
        review.id,
        review.createdAt ?? null,
        review.job_id ?? null,
        review.tech_email ?? null,
        JSON.stringify(review),
      ],
    });
  }

  console.log("Migrated local JSON data to Turso.");
  console.log(
    JSON.stringify(
      {
        appConfig: appConfig ? 1 : 0,
        users: users.length,
        jobs: jobs.length,
        transactions: transactions.length,
        contacts: contacts.length,
        quotes: quotes.length,
        bookings: bookings.length,
        reviews: reviews.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
