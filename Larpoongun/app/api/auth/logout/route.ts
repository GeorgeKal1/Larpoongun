import { NextResponse } from "next/server";
import { readJson } from "@/lib/server/http";
import { destroySession } from "@/lib/server/session";

export async function POST(req: Request) {
  const parsed = await readJson(req);
  if ("response" in parsed) return parsed.response;
  await destroySession();
  return NextResponse.json({ ok: true });
}
