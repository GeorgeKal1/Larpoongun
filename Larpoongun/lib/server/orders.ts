import { randomBytes } from "node:crypto";
import { CURRENCY, shippingFor, toCents } from "@/lib/pricing";
import { getProduct } from "@/lib/products";
import type { CartLine, PublicUser } from "@/lib/types";
import { getDb } from "./db";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";
export type Fulfillment = "unfulfilled" | "shipped" | "delivered" | "returned";
export type PaymentProvider = "demo" | "stripe";

export const ORDER_STATUSES: OrderStatus[] = ["pending", "paid", "failed", "cancelled"];
export const FULFILLMENTS: Fulfillment[] = ["unfulfilled", "shipped", "delivered", "returned"];

export interface ShippingDetails {
  name: string;
  address: string;
  city: string;
  postcode: string;
}

export interface OrderItem {
  slug: string;
  name: string;
  unit_price_cents: number;
  qty: number;
}

export interface Order extends ShippingDetails {
  id: number;
  public_id: string;
  user_id: number | null;
  email: string;
  status: OrderStatus;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  payment_provider: PaymentProvider;
  payment_ref: string | null;
  created_at: number;
  paid_at: number | null;
  fulfillment: Fulfillment;
  admin_note: string | null;
  updated_at: number | null;
  items: OrderItem[];
}

export interface OrderEvent {
  id: number;
  at: number;
  actor: string;
  message: string;
}

type OrderRow = Omit<Order, "items">;

/** Appends to the order's history (shown in the admin area). */
export function logOrderEvent(orderId: number, actor: string, message: string): void {
  getDb()
    .prepare("INSERT INTO order_events (order_id, at, actor, message) VALUES (?, ?, ?, ?)")
    .run(orderId, Date.now(), actor, message);
}

export function listOrderEvents(orderId: number): OrderEvent[] {
  return getDb()
    .prepare("SELECT id, at, actor, message FROM order_events WHERE order_id = ? ORDER BY at, id")
    .all(orderId) as OrderEvent[];
}

function newPublicId(): string {
  return `LG-${randomBytes(5).toString("hex").toUpperCase()}`;
}

function withItems(row: OrderRow | undefined): Order | null {
  if (!row) return null;
  const items = getDb()
    .prepare("SELECT slug, name, unit_price_cents, qty FROM order_items WHERE order_id = ? ORDER BY rowid")
    .all(row.id) as OrderItem[];
  return { ...row, items };
}

/** Prices come from the catalog on the server, never from the browser. */
export function createOrder(
  user: PublicUser,
  lines: CartLine[],
  shipping: ShippingDetails,
  provider: PaymentProvider,
): Order {
  const items: OrderItem[] = lines.flatMap((l) => {
    const product = getProduct(l.slug);
    return product ? [{ slug: product.slug, name: product.name, unit_price_cents: toCents(product.price), qty: l.qty }] : [];
  });
  if (items.length === 0) throw new Error("Cannot create an empty order.");

  const subtotal = items.reduce((n, i) => n + i.unit_price_cents * i.qty, 0);
  const shippingCents = shippingFor(subtotal);
  const db = getDb();

  const id = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO orders (public_id, user_id, email, name, address, city, postcode, status,
           subtotal_cents, shipping_cents, total_cents, currency, payment_provider, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        newPublicId(),
        user.id,
        user.email,
        shipping.name,
        shipping.address,
        shipping.city,
        shipping.postcode,
        subtotal,
        shippingCents,
        subtotal + shippingCents,
        CURRENCY,
        provider,
        Date.now(),
      );
    const orderId = Number(result.lastInsertRowid);
    const insertItem = db.prepare(
      "INSERT INTO order_items (order_id, slug, name, unit_price_cents, qty) VALUES (?, ?, ?, ?, ?)",
    );
    for (const i of items) insertItem.run(orderId, i.slug, i.name, i.unit_price_cents, i.qty);
    logOrderEvent(orderId, "customer", `Order placed (${provider} payment)`);
    return orderId;
  })();

  return getOrderById(id)!;
}

export function getOrderById(id: number): Order | null {
  return withItems(getDb().prepare("SELECT * FROM orders WHERE id = ?").get(id) as OrderRow | undefined);
}

/** Looks an order up by its public id, but only if it belongs to this user. */
export function getOrderForUser(publicId: string, userId: number): Order | null {
  return withItems(
    getDb().prepare("SELECT * FROM orders WHERE public_id = ? AND user_id = ?").get(publicId, userId) as
      | OrderRow
      | undefined,
  );
}

export function listOrdersForUser(userId: number): Order[] {
  const rows = getDb()
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as OrderRow[];
  return rows.map((r) => withItems(r)!);
}

export function setPaymentRef(orderId: number, ref: string): void {
  getDb().prepare("UPDATE orders SET payment_ref = ? WHERE id = ?").run(ref, orderId);
}

/**
 * Marks a pending order paid and takes the bought items out of the customer's saved cart.
 * Safe to call more than once (e.g. from both the return page and a webhook).
 */
export function markOrderPaid(orderId: number, paymentRef?: string): boolean {
  const db = getDb();
  return db.transaction(() => {
    const changed = db
      .prepare(
        `UPDATE orders SET status = 'paid', paid_at = ?, payment_ref = COALESCE(?, payment_ref)
         WHERE id = ? AND status = 'pending'`,
      )
      .run(Date.now(), paymentRef ?? null, orderId).changes;
    if (!changed) return false;

    const order = getOrderById(orderId)!;
    logOrderEvent(orderId, "payment", `Payment received${paymentRef ? ` (${paymentRef})` : ""}`);
    if (order.user_id !== null) {
      // Only remove what was bought, in case they added more while paying.
      const remove = db.prepare("DELETE FROM cart_items WHERE user_id = ? AND slug = ? AND qty <= ?");
      const reduce = db.prepare("UPDATE cart_items SET qty = qty - ? WHERE user_id = ? AND slug = ? AND qty > ?");
      for (const i of order.items) {
        remove.run(order.user_id, i.slug, i.qty);
        reduce.run(i.qty, order.user_id, i.slug, i.qty);
      }
    }
    return true;
  })();
}

/** Closes a pending order without payment. */
export function markOrderUnpaid(orderId: number, status: "failed" | "cancelled"): boolean {
  const changed =
    getDb().prepare("UPDATE orders SET status = ? WHERE id = ? AND status = 'pending'").run(status, orderId).changes > 0;
  if (changed) logOrderEvent(orderId, "payment", status === "failed" ? "Payment failed" : "Payment cancelled");
  return changed;
}
