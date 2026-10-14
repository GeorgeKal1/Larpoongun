import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { jsonError, readJson } from "@/lib/server/http";
import { hashPassword } from "@/lib/server/password";
import { createSession } from "@/lib/server/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const parsed = await readJson(req);
  if ("response" in parsed) return parsed.response;
  const { body } = parsed;

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || name.length > 80) return jsonError(400, "Please enter your name.");
  if (!EMAIL_RE.test(email) || email.length > 254) return jsonError(400, "Please enter a valid email address.");
  if (password.length < 8) return jsonError(400, "Password must be at least 8 characters.");
  if (password.length > 200) return jsonError(400, "Password is too long.");

  const db = getDb();
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) {
    return jsonError(409, "An account with this email already exists. Try signing in.");
  }

  const passwordHash = await hashPassword(password);
  let userId: number;
  try {
    const result = db
      .prepare("INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)")
      .run(email, name, passwordHash, Date.now());
    userId = Number(result.lastInsertRowid);
  } catch {
    // Lost a race with a concurrent sign-up for the same email.
    return jsonError(409, "An account with this email already exists. Try signing in.");
  }

  await createSession(userId);
  return NextResponse.json({ user: { id: userId, email, name } }, { status: 201 });
}
