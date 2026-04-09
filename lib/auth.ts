const SESSION_COOKIE = "pb_session";
const ROLE_OVERRIDE_COOKIE = "pb_role_override";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 3;
export const SESSION_TTL_SECONDS = 60 * 60 * 3;

export type AppAuthRole = "admin" | "rep" | "tech";

export type AuthSession = {
  userId: string;
  email: string;
  name?: string;
  role: AppAuthRole;
  phone?: string;
  birthday?: string;
  profile_completed_at?: string;
  is_admin: boolean;
  originalRole?: AppAuthRole;
  is_test_mode?: boolean;
  exp: number;
};

const encoder = new TextEncoder();

function getSecret(): string {
  return process.env.AUTH_SECRET ?? "";
}

function toBase64Url(input: Uint8Array): string {
  let base64: string;
  if (typeof btoa === "function") {
    let binary = "";
    input.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    base64 = btoa(binary);
  } else {
    base64 = Buffer.from(input).toString("base64");
  }
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(padded, "base64"));
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toBase64Url(new Uint8Array(signature));
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signatureBytes = fromBase64Url(signature);
  const signatureArray: Uint8Array<ArrayBuffer> = new Uint8Array(signatureBytes);
  return crypto.subtle.verify("HMAC", key, signatureArray, encoder.encode(data));
}

function encodeTokenPayload(payload: AuthSession): string {
  const json = JSON.stringify(payload);
  return toBase64Url(encoder.encode(json));
}

function decodeTokenPayload(payload: string): AuthSession | null {
  try {
    const decoded = new TextDecoder().decode(fromBase64Url(payload));
    return JSON.parse(decoded) as AuthSession;
  } catch {
    return null;
  }
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getRoleOverrideCookieName() {
  return ROLE_OVERRIDE_COOKIE;
}

function isValidRole(value: string | undefined | null): value is AppAuthRole {
  return value === "admin" || value === "rep" || value === "tech";
}

export async function createSessionToken(
  user: Omit<AuthSession, "exp">,
  ttlMs: number = SESSION_TTL_MS
): Promise<string> {
  const secret = getSecret();
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }
  const payload: AuthSession = { ...user, exp: Date.now() + ttlMs };
  const payloadEncoded = encodeTokenPayload(payload);
  const signature = await hmacSign(payloadEncoded, secret);
  return `${payloadEncoded}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  const secret = getSecret();
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts as [string, string];
  const ok = await hmacVerify(payload, signature, secret);
  if (!ok) return null;
  const decoded = decodeTokenPayload(payload);
  if (!decoded) return null;
  if (!decoded.role || !isValidRole(decoded.role)) {
    decoded.role = decoded.is_admin ? "admin" : "rep";
  }
  decoded.originalRole = isValidRole(decoded.originalRole) ? decoded.originalRole : decoded.role;
  decoded.is_test_mode = false;
  if (decoded.exp < Date.now()) return null;
  return decoded;
}

export async function hashPin(pin: string): Promise<{ salt: string; hash: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = toBase64Url(saltBytes);
  const hash = await hashPinWithSalt(pin, salt);
  return { salt, hash };
}

export async function hashPinWithSalt(pin: string, salt: string): Promise<string> {
  const data = encoder.encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toBase64Url(new Uint8Array(digest));
}

export async function verifyPin(pin: string, salt: string, hash: string): Promise<boolean> {
  const computed = await hashPinWithSalt(pin, salt);
  return computed === hash;
}

export function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) return {};
  const entries = header.split(";").map((part) => part.trim());
  const cookies: Record<string, string> = {};
  for (const entry of entries) {
    if (!entry) continue;
    const idx = entry.indexOf("=");
    if (idx === -1) continue;
    const key = entry.slice(0, idx).trim();
    const value = entry.slice(idx + 1).trim();
    cookies[key] = value;
  }
  return cookies;
}

export async function getSessionFromRequest(request: Request): Promise<AuthSession | null> {
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;

  const overrideRole = cookies[ROLE_OVERRIDE_COOKIE];
  if (session.is_admin && isValidRole(overrideRole)) {
    session.role = overrideRole;
    session.is_test_mode = overrideRole !== session.originalRole;
  }

  return session;
}
