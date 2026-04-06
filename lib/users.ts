import { promises as fs } from "fs";
import path from "path";
import { hasTursoConfig, tursoExecute } from "@/lib/turso";

export type UserRole = "admin" | "rep" | "tech";
export type UserInviteStatus = "pending" | "expired" | "completed";

export type UserRecord = {
  id: string;
  email?: string;
  name?: string;
  role?: UserRole;
  is_admin: boolean;
  phone?: string;
  birthday?: string;
  pin_hash?: string;
  pin_salt?: string;
  created_at: string;
  profile_completed_at?: string;
  last_signed_in_at?: string;
  invite_token_hash?: string;
  invite_created_at?: string;
  invite_expires_at?: string;
  invite_used_at?: string;
};

const USERS_PATH = path.join(process.cwd(), "data", "users.json");

function isValidRole(value: unknown): value is UserRole {
  return value === "admin" || value === "rep" || value === "tech";
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function normalizeOptionalEmail(value: unknown) {
  const trimmed = normalizeOptionalString(value);
  return trimmed?.toLowerCase();
}

function normalizeOptionalDate(value: unknown) {
  const trimmed = normalizeOptionalString(value);
  return trimmed;
}

function ensureCreatedAt(value: unknown) {
  const normalized = normalizeOptionalDate(value);
  return normalized ?? new Date().toISOString();
}

export function normalizeUserRole(user: UserRecord): UserRole {
  if (isValidRole(user.role)) {
    return user.role;
  }
  return user.is_admin ? "admin" : "rep";
}

export function normalizeUserRecord(value: Partial<UserRecord> & { email?: string }): UserRecord {
  const normalizedEmail = normalizeOptionalEmail(value.email);
  const role = isValidRole(value.role) ? value.role : value.is_admin ? "admin" : "rep";
  const hasCompletedProfile = Boolean(normalizedEmail && value.pin_hash && value.pin_salt);

  return {
    id: normalizeOptionalString(value.id) ?? crypto.randomUUID(),
    email: normalizedEmail,
    name: normalizeOptionalString(value.name),
    role,
    is_admin: role === "admin",
    phone: normalizeOptionalString(value.phone),
    birthday: normalizeOptionalDate(value.birthday),
    pin_hash: normalizeOptionalString(value.pin_hash),
    pin_salt: normalizeOptionalString(value.pin_salt),
    created_at: ensureCreatedAt(value.created_at),
    profile_completed_at:
      normalizeOptionalDate(value.profile_completed_at) ??
      (hasCompletedProfile ? ensureCreatedAt(value.created_at) : undefined),
    last_signed_in_at: normalizeOptionalDate(value.last_signed_in_at),
    invite_token_hash: normalizeOptionalString(value.invite_token_hash),
    invite_created_at: normalizeOptionalDate(value.invite_created_at),
    invite_expires_at: normalizeOptionalDate(value.invite_expires_at),
    invite_used_at:
      normalizeOptionalDate(value.invite_used_at) ??
      (hasCompletedProfile ? normalizeOptionalDate(value.profile_completed_at) : undefined),
  };
}

function normalizeUsers(input: unknown): UserRecord[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      return normalizeUserRecord(entry as Partial<UserRecord>);
    })
    .filter((entry): entry is UserRecord => Boolean(entry));
}

export function getUserInviteStatus(user: UserRecord): UserInviteStatus {
  if (user.profile_completed_at || (user.email && user.pin_hash && user.pin_salt)) {
    return "completed";
  }
  if (!user.invite_expires_at) {
    return "pending";
  }
  return new Date(user.invite_expires_at).getTime() < Date.now() ? "expired" : "pending";
}

export async function hashInviteToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Buffer.from(digest).toString("hex");
}

export function createInviteToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`;
}

export async function readUsers(): Promise<UserRecord[]> {
  if (hasTursoConfig()) {
    const result = await tursoExecute("SELECT data FROM users ORDER BY created_at ASC, id ASC");
    return result.rows
      .map((row) => {
        try {
          return normalizeUserRecord(JSON.parse(String(row.data)) as Partial<UserRecord>);
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
    return normalizeUsers(JSON.parse(data) as unknown);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT" || error instanceof SyntaxError) {
      return [];
    }
    throw error;
  }
}

export async function writeUsers(users: UserRecord[]): Promise<void> {
  const normalizedUsers = users.map((user) => normalizeUserRecord(user));

  if (hasTursoConfig()) {
    await tursoExecute("DELETE FROM users");
    for (const user of normalizedUsers) {
      await tursoExecute({
        sql: "INSERT INTO users (id, email, created_at, data) VALUES (?, ?, ?, ?)",
        args: [user.id, user.email ?? null, user.created_at, JSON.stringify(user)],
      });
    }
    return;
  }

  await fs.mkdir(path.dirname(USERS_PATH), { recursive: true });
  await fs.writeFile(USERS_PATH, JSON.stringify(normalizedUsers, null, 2), "utf8");
}

export function findUserByEmail(users: UserRecord[], email: string) {
  const normalized = email.trim().toLowerCase();
  return users.find((entry) => entry.email?.toLowerCase() === normalized);
}

export function findUserById(users: UserRecord[], id: string) {
  return users.find((entry) => entry.id === id);
}

export async function findUserByInviteToken(users: UserRecord[], token: string) {
  const hash = await hashInviteToken(token);
  return users.find((entry) => entry.invite_token_hash === hash);
}
