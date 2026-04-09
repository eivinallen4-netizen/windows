import { promises as fs } from "fs";
import path from "path";
import { hasTursoConfig, tursoExecute } from "@/lib/turso";

export type ContactRecord = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  paneCount?: number;
  notes?: string;
  source?: string;
  created_at: string;
  brevo?: { id?: number | string };
};

const CONTACTS_PATH = path.join(process.cwd(), "data", "contacts.json");

export async function readContacts(): Promise<ContactRecord[]> {
  if (hasTursoConfig()) {
    const result = await tursoExecute("SELECT data FROM contacts ORDER BY created_at DESC, email ASC");
    return result.rows
      .map((row) => {
        try {
          return JSON.parse(String(row.data)) as ContactRecord;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is ContactRecord => Boolean(entry));
  }

  try {
    const data = await fs.readFile(CONTACTS_PATH, "utf8");
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed as ContactRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function writeContacts(contacts: ContactRecord[]) {
  if (hasTursoConfig()) {
    await tursoExecute("DELETE FROM contacts");
    for (const contact of contacts) {
      const storageEmail = contact.email?.toLowerCase() ?? `lead+${contact.id}@purebin.local`;
      await tursoExecute({
        sql: "INSERT INTO contacts (id, email, created_at, data) VALUES (?, ?, ?, ?)",
        args: [contact.id, storageEmail, contact.created_at, JSON.stringify(contact)],
      });
    }
    return;
  }

  await fs.mkdir(path.dirname(CONTACTS_PATH), { recursive: true });
  await fs.writeFile(CONTACTS_PATH, JSON.stringify(contacts, null, 2), "utf8");
}
