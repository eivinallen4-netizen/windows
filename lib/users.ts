import { promises as fs } from "fs";
import path from "path";
import { hasTursoConfig, tursoExecute } from "@/lib/turso";

export type UserRole = "admin" | "rep" | "tech";

export type UserRecord = {
  email: string;
  name?: string;
  role?: UserRole;
  is_admin: boolean;
  pin_hash?: string;
  pin_salt?: string;
  created_at?: string;
};

export function normalizeUserRole(user: UserRecord): UserRole {
  if (user.role === "admin" || user.role === "rep" || user.role === "tech") {
    return user.role;
  }
  return user.is_admin ? "admin" : "rep";
}

const USERS_PATH = path.join(process.cwd(), "data", "users.json");

export async function readUsers(): Promise<UserRecord[]> {
  if (hasTursoConfig()) {
    const result = await tursoExecute("SELECT data FROM users ORDER BY created_at ASC, email ASC");
    return result.rows
      .map((row) => {
        try {
          return JSON.parse(String(row.data)) as UserRecord;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is UserRecord => Boolean(entry));
  }

  try {
    const data = await fs.readFile(USERS_PATH, "utf8");
    if (!data.trim()) {
      return [];
    }
    const parsed = JSON.parse(data) as UserRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code === "ENOENT" ||
      error instanceof SyntaxError
    ) {
      return [];
    }
    throw error;
  }
}

export async function writeUsers(users: UserRecord[]): Promise<void> {
  if (hasTursoConfig()) {
    await tursoExecute("DELETE FROM users");
    for (const user of users) {
      await tursoExecute({
        sql: "INSERT INTO users (email, created_at, data) VALUES (?, ?, ?)",
        args: [user.email.toLowerCase(), user.created_at ?? null, JSON.stringify(user)],
      });
    }
    return;
  }

  await fs.mkdir(path.dirname(USERS_PATH), { recursive: true });
  await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2), "utf8");
}

export function findUserByEmail(users: UserRecord[], email: string) {
  const normalized = email.trim().toLowerCase();
  return users.find((entry) => entry.email.toLowerCase() === normalized);
}
