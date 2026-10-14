import { NextResponse } from "next/server";
import { adminLogout } from "@/lib/server/admin-auth";
import { readJson } from "@/lib/server/http";

export async function POST(req: Request) {
  const parsed = await readJson(req);
  if ("response" in parsed) return parsed.response;
  await adminLogout();
  return NextResponse.json({ ok: true });
}
