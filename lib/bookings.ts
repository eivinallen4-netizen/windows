import { promises as fs } from "fs";
import path from "path";

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
  await fs.mkdir(path.dirname(BOOKINGS_PATH), { recursive: true });
  await fs.appendFile(BOOKINGS_PATH, `${JSON.stringify(record)}\n`, "utf8");
}

export async function upsertBooking(record: BookingRecord) {
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
  const bookings = await readBookings();
  return bookings.some((booking) => booking.session_id === sessionId);
}
