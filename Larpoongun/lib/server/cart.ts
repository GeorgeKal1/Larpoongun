import { getProduct } from "@/lib/products";
import type { CartLine } from "@/lib/types";
import { getDb } from "./db";

export const MAX_QTY = 99;

/** Keeps only known products with whole, positive quantities; merges duplicate slugs. */
export function sanitizeLines(input: unknown): CartLine[] {
  if (!Array.isArray(input)) return [];
  const merged = new Map<string, number>();
  for (const item of input.slice(0, 200)) {
    if (!item || typeof item !== "object") continue;
    const { slug, qty } = item as Record<string, unknown>;
    if (typeof slug !== "string" || !getProduct(slug)) continue;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) continue;
    merged.set(slug, Math.min(MAX_QTY, (merged.get(slug) ?? 0) + qty));
  }
  return [...merged].map(([slug, qty]) => ({ slug, qty }));
}

export function getCart(userId: number): CartLine[] {
  return getDb()
    .prepare("SELECT slug, qty FROM cart_items WHERE user_id = ? ORDER BY rowid")
    .all(userId) as CartLine[];
}

export function replaceCart(userId: number, lines: CartLine[]): CartLine[] {
  const db = getDb();
  const now = Date.now();
  db.transaction(() => {
    db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(userId);
    const insert = db.prepare("INSERT INTO cart_items (user_id, slug, qty, updated_at) VALUES (?, ?, ?, ?)");
    for (const l of lines) insert.run(userId, l.slug, l.qty, now);
  })();
  return getCart(userId);
}

/** Adds a guest cart on top of the saved one (used when someone signs in). */
export function mergeIntoCart(userId: number, lines: CartLine[]): CartLine[] {
  const db = getDb();
  const now = Date.now();
  const upsert = db.prepare(
    `INSERT INTO cart_items (user_id, slug, qty, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (user_id, slug) DO UPDATE SET qty = MIN(?, qty + excluded.qty), updated_at = excluded.updated_at`,
  );
  db.transaction(() => {
    for (const l of lines) upsert.run(userId, l.slug, l.qty, now, MAX_QTY);
  })();
  return getCart(userId);
}
