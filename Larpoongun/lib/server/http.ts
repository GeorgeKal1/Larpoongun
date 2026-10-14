import { NextResponse } from "next/server";

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/**
 * Parses a JSON body from a same-origin request. Returns a Response to send back if the
 * request should be rejected. Cross-site form posts can't send `application/json`, and the
 * Origin check stops cross-site scripts, so together they guard the cookie-authenticated routes.
 */
export async function readJson(req: Request): Promise<{ body: Record<string, unknown> } | { response: NextResponse }> {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) {
    return { response: jsonError(403, "Cross-origin request blocked.") };
  }
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return { response: jsonError(415, "Expected JSON.") };
  }
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return { body };
  } catch {
    return { response: jsonError(400, "Invalid JSON body.") };
  }
}
