import { NextResponse } from "next/server";
import { adminConfigured, adminLogin, clientKey, lockedOutFor } from "@/lib/server/admin-auth";
import { jsonError, readJson } from "@/lib/server/http";

export async function POST(req: Request) {
  const parsed = await readJson(req);
  if ("response" in parsed) return parsed.response;
  if (!adminConfigured()) {
    return jsonError(503, "Admin login isn't set up. Add ADMIN_USERNAME and ADMIN_PASSWORD to .env.local.");
  }

  const key = clientKey(req);
  const wait = lockedOutFor(key);
  if (wait > 0) {
    return jsonError(429, `Too many failed attempts. Try again in ${Math.ceil(wait / 60000)} minutes.`);
  }

  const { username, password } = parsed.body;
  const ok =
    typeof username === "string" &&
    typeof password === "string" &&
    (await adminLogin(key, username.trim().slice(0, 100), password.slice(0, 200)));
  if (!ok) return jsonError(401, "Incorrect username or password.");
  return NextResponse.json({ ok: true });
}
