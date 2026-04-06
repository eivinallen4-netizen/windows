import { promises as fs } from "fs";
import path from "path";
import { hasTursoConfig, tursoExecute } from "@/lib/turso";

export type BookingRecord = {
  session_id: string;
  job_id?: string;
  amount_total: number;
  currency: string;
  rep?: { name: string; email: string };
  tech?: { email: string };
  payment_status?: string;
  created_at: string;
  captured_at?: string;
};

const BOOKINGS_PATH = path.join(process.cwd(), "data", "bookings.jsonl");

export async function readBookings(): Promise<BookingRecord[]> {
  if (hasTursoConfig()) {
    const result = await tursoExecute("SELECT data FROM bookings ORDER BY created_at ASC, session_id ASC");
    return result.rows
      .map((row) => {
        try {
          return JSON.parse(String(row.data)) as BookingRecord;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is BookingRecord => Boolean(entry));
  }

  try {
    const data = await fs.readFile(BOOKINGS_PATH, "utf8");
    return data
      .split("\n")
      .filter((line) => line.trim().length)
      .map((line) => JSON.parse(line) as BookingRecord);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function appendBooking(record: BookingRecord) {
  if (hasTursoConfig()) {
    await tursoExecute({
      sql: "INSERT INTO bookings (session_id, created_at, data) VALUES (?, ?, ?)",
      args: [record.session_id, record.created_at, JSON.stringify(record)],
    });
    return;
  }

  await fs.mkdir(path.dirname(BOOKINGS_PATH), { recursive: true });
  await fs.appendFile(BOOKINGS_PATH, `${JSON.stringify(record)}\n`, "utf8");
}

export async function upsertBooking(record: BookingRecord) {
  if (hasTursoConfig()) {
    await tursoExecute({
      sql: `
        INSERT INTO bookings (session_id, created_at, data)
        VALUES (?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET
          created_at = COALESCE(bookings.created_at, excluded.created_at),
          data = excluded.data
      `,
      args: [record.session_id, record.created_at, JSON.stringify(record)],
    });
    return;
  }

  const bookings = await readBookings();
  const index = bookings.findIndex((booking) => booking.session_id === record.session_id);
  if (index === -1) {
    bookings.push(record);
  } else {
    bookings[index] = {
      ...bookings[index],
      ...record,
      created_at: bookings[index].created_at ?? record.created_at,
    };
  }
  await fs.mkdir(path.dirname(BOOKINGS_PATH), { recursive: true });
  await fs.writeFile(
    BOOKINGS_PATH,
    bookings.map((booking) => JSON.stringify(booking)).join("\n").concat(bookings.length ? "\n" : ""),
    "utf8"
  );
}

export async function hasBooking(sessionId: string): Promise<boolean> {
  if (hasTursoConfig()) {
    const result = await tursoExecute({
      sql: "SELECT 1 AS found FROM bookings WHERE session_id = ? LIMIT 1",
      args: [sessionId],
    });
    return result.rows.length > 0;
  }

  const bookings = await readBookings();
  return bookings.some((booking) => booking.session_id === sessionId);
}
