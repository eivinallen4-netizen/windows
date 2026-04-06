import { promises as fs } from "fs";
import path from "path";

export type ContactRecord = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  created_at: string;
  brevo?: { id?: number | string };
};

const CONTACTS_PATH = path.join(process.cwd(), "data", "contacts.json");

export async function readContacts(): Promise<ContactRecord[]> {
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
  await fs.mkdir(path.dirname(CONTACTS_PATH), { recursive: true });
  await fs.writeFile(CONTACTS_PATH, JSON.stringify(contacts, null, 2), "utf8");
}
