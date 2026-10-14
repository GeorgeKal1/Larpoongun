import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";

/**
 * Admin login. The username and password come from ADMIN_USERNAME / ADMIN_PASSWORD in
 * .env.local (never committed), so the repository itself contains no credentials.
 * If they aren't set, the admin area stays locked.
 */

export const ADMIN_COOKIE = "lg_admin";
const SESSION_HOURS = 8;
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const sha256 = (value: string) => createHash("sha256").update(value).digest();

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
}

let warnedWeak = false;
function checkCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) return false;
  if (process.env.NODE_ENV === "production" && expectedPass.length < 12 && !warnedWeak) {
    warnedWeak = true;
    console.warn("[admin] ADMIN_PASSWORD is short. Use a long random password anywhere other than your own machine.");
  }
  // Compare fixed-length hashes in constant time so timing doesn't leak how much matched.
  const userOk = timingSafeEqual(sha256(username), sha256(expectedUser));
  const passOk = timingSafeEqual(sha256(password), sha256(expectedPass));
  return userOk && passOk;
}

// Failed attempts per client, in memory: enough to stop brute-forcing a short password.
const failures = new Map<string, { count: number; until: number }>();

/**
 * Forwarded-for headers can be faked by anyone, so they're only used behind a proxy you
 * control (TRUST_PROXY=1). Otherwise all attempts share one counter.
 */
export function clientKey(req: Request): string {
  if (process.env.TRUST_PROXY !== "1") return "direct";
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

export function lockedOutFor(key: string): number {
  const entry = failures.get(key);
  if (!entry || entry.count < MAX_FAILURES) return 0;
  const left = entry.until - Date.now();
  if (left <= 0) {
    failures.delete(key);
    return 0;
  }
  return left;
}

/** Checks the credentials; on success starts an admin session (sets the cookie). */
export async function adminLogin(key: string, username: string, password: string): Promise<boolean> {
  if (!checkCredentials(username, password)) {
    const entry = failures.get(key);
    const count = entry && entry.until > Date.now() ? entry.count + 1 : 1;
    failures.set(key, { count, until: Date.now() + LOCKOUT_MS });
    return false;
  }
  failures.delete(key);

  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const expiresAt = now + SESSION_HOURS * 60 * 60 * 1000;
  const db = getDb();
  db.prepare("DELETE FROM admin_sessions WHERE expires_at < ?").run(now);
  db.prepare("INSERT INTO admin_sessions (token_hash, username, expires_at, created_at) VALUES (?, ?, ?, ?)").run(
    sha256(token).toString("hex"),
    username,
    expiresAt,
    now,
  );
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
  return true;
}

/** The signed-in admin's username, or null. */
export async function getAdmin(): Promise<string | null> {
  if (!adminConfigured()) return null;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare("SELECT username FROM admin_sessions WHERE token_hash = ? AND expires_at > ?")
    .get(sha256(token).toString("hex"), Date.now()) as { username: string } | undefined;
  return row?.username ?? null;
}

/** For admin pages: sends anyone who isn't signed in back to the /admin login. */
export async function requireAdmin(): Promise<string> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin");
  return admin;
}

export async function adminLogout(): Promise<void> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM admin_sessions WHERE token_hash = ?").run(sha256(token).toString("hex"));
  store.delete(ADMIN_COOKIE);
}
