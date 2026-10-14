import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { jsonError, readJson } from "@/lib/server/http";
import { getDummyHash, verifyPassword } from "@/lib/server/password";
import { createSession } from "@/lib/server/session";

interface UserRow {
  id: number;
  email: string;
  name: string;
  password_hash: string;
}

export async function POST(req: Request) {
  const parsed = await readJson(req);
  if ("response" in parsed) return parsed.response;
  const { body } = parsed;

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  if (!email || !password) return jsonError(400, "Please enter your email and password.");

  const user = getDb()
    .prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?")
    .get(email) as UserRow | undefined;

  // Always run a hash check so response time doesn't reveal whether the email exists.
  const ok = await verifyPassword(password, user?.password_hash ?? (await getDummyHash()));
  if (!user || !ok) return jsonError(401, "Incorrect email or password.");

  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
