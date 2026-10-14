import { NextResponse } from "next/server";
import { getCart, mergeIntoCart, replaceCart, sanitizeLines } from "@/lib/server/cart";
import { jsonError, readJson } from "@/lib/server/http";
import { getCurrentUser } from "@/lib/server/session";

const NO_STORE = { "Cache-Control": "no-store" };

/** The signed-in user's saved cart. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Not signed in.");
  return NextResponse.json({ lines: getCart(user.id) }, { headers: NO_STORE });
}

/** Replaces the saved cart with `{ lines }`. */
export async function PUT(req: Request) {
  const parsed = await readJson(req);
  if ("response" in parsed) return parsed.response;
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Not signed in.");
  return NextResponse.json({ lines: replaceCart(user.id, sanitizeLines(parsed.body.lines)) }, { headers: NO_STORE });
}

/** Adds `{ lines }` on top of the saved cart (e.g. a cart built while signed out). */
export async function POST(req: Request) {
  const parsed = await readJson(req);
  if ("response" in parsed) return parsed.response;
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Not signed in.");
  return NextResponse.json({ lines: mergeIntoCart(user.id, sanitizeLines(parsed.body.lines)) }, { headers: NO_STORE });
}
