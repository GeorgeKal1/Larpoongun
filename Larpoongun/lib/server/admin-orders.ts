import { formatCents, shippingFor, toCents } from "@/lib/pricing";
import { getProduct } from "@/lib/products";
import { getDb } from "./db";
import {
  FULFILLMENTS,
  getOrderById,
  logOrderEvent,
  ORDER_STATUSES,
  type Fulfillment,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "./orders";

export interface OrderFilters {
  status?: string;
  fulfillment?: string;
  provider?: string;
  /** Matches order id, email or customer name. */
  q?: string;
}

/** Every order (all customers), newest first. */
export function listAllOrders(filters: OrderFilters = {}): Order[] {
  const where: string[] = [];
  const args: unknown[] = [];
  if (filters.status && ORDER_STATUSES.includes(filters.status as OrderStatus)) {
    where.push("status = ?");
    args.push(filters.status);
  }
  if (filters.fulfillment && FULFILLMENTS.includes(filters.fulfillment as Fulfillment)) {
    where.push("fulfillment = ?");
    args.push(filters.fulfillment);
  }
  if (filters.provider === "demo" || filters.provider === "stripe") {
    where.push("payment_provider = ?");
    args.push(filters.provider);
  }
  const q = filters.q?.trim();
  if (q) {
    where.push("(public_id LIKE ? OR email LIKE ? OR name LIKE ?)");
    const like = `%${q.replace(/[%_]/g, "")}%`;
    args.push(like, like, like);
  }
  const rows = getDb()
    .prepare(`SELECT id FROM orders ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT 500`)
    .all(...args) as { id: number }[];
  return rows.map((r) => getOrderById(r.id)!);
}

export function getOrderByPublicId(publicId: string): Order | null {
  const row = getDb().prepare("SELECT id FROM orders WHERE public_id = ?").get(publicId) as { id: number } | undefined;
  return row ? getOrderById(row.id) : null;
}

export interface Stats {
  orders: number;
  paidOrders: number;
  revenueCents: number;
  pendingCents: number;
  toShip: number;
  customers: number;
  byStatus: Record<OrderStatus, number>;
  byProvider: { provider: string; count: number; cents: number }[];
}

export function getStats(): Stats {
  const db = getDb();
  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  for (const row of db.prepare("SELECT status, COUNT(*) n FROM orders GROUP BY status").all() as {
    status: OrderStatus;
    n: number;
  }[]) {
    byStatus[row.status] = row.n;
  }
  const one = <T>(sql: string) => db.prepare(sql).get() as T;
  return {
    orders: Object.values(byStatus).reduce((a, b) => a + b, 0),
    paidOrders: byStatus.paid,
    revenueCents: one<{ c: number | null }>("SELECT SUM(total_cents) c FROM orders WHERE status = 'paid'").c ?? 0,
    pendingCents: one<{ c: number | null }>("SELECT SUM(total_cents) c FROM orders WHERE status = 'pending'").c ?? 0,
    toShip: one<{ n: number }>("SELECT COUNT(*) n FROM orders WHERE status = 'paid' AND fulfillment = 'unfulfilled'").n,
    customers: one<{ n: number }>("SELECT COUNT(*) n FROM users").n,
    byStatus,
    byProvider: db
      .prepare(
        `SELECT payment_provider provider, COUNT(*) count, SUM(total_cents) cents
         FROM orders WHERE status = 'paid' GROUP BY payment_provider`,
      )
      .all() as Stats["byProvider"],
  };
}

export interface OrderPatch {
  status?: OrderStatus;
  fulfillment?: Fulfillment;
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  postcode?: string;
  admin_note?: string | null;
  /** Full replacement of the line items. Existing lines keep their recorded price. */
  items?: { slug: string; qty: number }[];
}

const TEXT_FIELDS = ["name", "email", "address", "city", "postcode"] as const;
const TEXT_LIMITS: Record<(typeof TEXT_FIELDS)[number], number> = {
  name: 80,
  email: 254,
  address: 200,
  city: 80,
  postcode: 20,
};

/** Validates untrusted input into an OrderPatch, or returns an error message. */
export function parseOrderPatch(body: Record<string, unknown>): OrderPatch | string {
  const patch: OrderPatch = {};
  if (body.status !== undefined) {
    if (!ORDER_STATUSES.includes(body.status as OrderStatus)) return "Unknown payment status.";
    patch.status = body.status as OrderStatus;
  }
  if (body.fulfillment !== undefined) {
    if (!FULFILLMENTS.includes(body.fulfillment as Fulfillment)) return "Unknown fulfilment status.";
    patch.fulfillment = body.fulfillment as Fulfillment;
  }
  for (const key of TEXT_FIELDS) {
    if (body[key] === undefined) continue;
    const value = typeof body[key] === "string" ? (body[key] as string).trim() : "";
    if (!value || value.length > TEXT_LIMITS[key]) return `Please enter a valid ${key}.`;
    patch[key] = value;
  }
  if (body.admin_note !== undefined) {
    const note = typeof body.admin_note === "string" ? body.admin_note.trim() : "";
    if (note.length > 2000) return "Note is too long.";
    patch.admin_note = note || null;
  }
  if (body.items !== undefined) {
    if (!Array.isArray(body.items)) return "Invalid items.";
    const items = new Map<string, number>();
    for (const raw of body.items as unknown[]) {
      const { slug, qty } = (raw ?? {}) as Record<string, unknown>;
      if (typeof slug !== "string" || typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > 99) {
        return "Each item needs a product and a whole quantity from 1 to 99.";
      }
      items.set(slug, qty);
    }
    if (items.size === 0) return "An order needs at least one item. Cancel or delete it instead.";
    patch.items = [...items].map(([slug, qty]) => ({ slug, qty }));
  }
  return patch;
}

/**
 * Applies an admin's changes and records each one in the order history.
 * Note: this changes our records only. It never charges or refunds anyone through Stripe.
 */
export function updateOrder(orderId: number, patch: OrderPatch, actor: string): Order | string {
  const db = getDb();
  const result = db.transaction((): Order | string => {
    const order = getOrderById(orderId);
    if (!order) return "Order not found.";
    const changes: string[] = [];
    const sets: string[] = [];
    const args: unknown[] = [];
    const set = (column: string, value: unknown) => {
      sets.push(`${column} = ?`);
      args.push(value);
    };

    if (patch.status && patch.status !== order.status) {
      set("status", patch.status);
      if (patch.status === "paid" && !order.paid_at) set("paid_at", Date.now());
      changes.push(`Payment status: ${order.status} → ${patch.status}`);
    }
    if (patch.fulfillment && patch.fulfillment !== order.fulfillment) {
      set("fulfillment", patch.fulfillment);
      changes.push(`Fulfilment: ${order.fulfillment} → ${patch.fulfillment}`);
    }
    for (const key of TEXT_FIELDS) {
      const value = patch[key];
      if (value !== undefined && value !== order[key]) {
        set(key, value);
        changes.push(`${key[0].toUpperCase()}${key.slice(1)}: “${order[key]}” → “${value}”`);
      }
    }
    if (patch.admin_note !== undefined && patch.admin_note !== order.admin_note) {
      set("admin_note", patch.admin_note);
      changes.push(patch.admin_note ? "Note updated" : "Note removed");
    }

    if (patch.items) {
      const existing = new Map(order.items.map((i) => [i.slug, i]));
      const next: OrderItem[] = [];
      for (const { slug, qty } of patch.items) {
        const old = existing.get(slug);
        if (old) {
          next.push({ ...old, qty });
        } else {
          const product = getProduct(slug);
          if (!product) return `Unknown product: ${slug}`;
          next.push({ slug, name: product.name, unit_price_cents: toCents(product.price), qty });
        }
      }

      const before = new Map(order.items.map((i) => [i.slug, i.qty]));
      const after = new Map(next.map((i) => [i.slug, i.qty]));
      const itemChanges = [
        ...next.filter((i) => !before.has(i.slug)).map((i) => `added ${i.qty} × ${i.name}`),
        ...order.items.filter((i) => !after.has(i.slug)).map((i) => `removed ${i.name}`),
        ...next
          .filter((i) => before.has(i.slug) && before.get(i.slug) !== i.qty)
          .map((i) => `${i.name} ${before.get(i.slug)} → ${i.qty}`),
      ];

      if (itemChanges.length) {
        db.prepare("DELETE FROM order_items WHERE order_id = ?").run(order.id);
        const insert = db.prepare(
          "INSERT INTO order_items (order_id, slug, name, unit_price_cents, qty) VALUES (?, ?, ?, ?, ?)",
        );
        for (const i of next) insert.run(order.id, i.slug, i.name, i.unit_price_cents, i.qty);

        const subtotal = next.reduce((n, i) => n + i.unit_price_cents * i.qty, 0);
        const shipping = shippingFor(subtotal);
        set("subtotal_cents", subtotal);
        set("shipping_cents", shipping);
        set("total_cents", subtotal + shipping);
        changes.push(
          `Items: ${itemChanges.join(", ")}. Total ${formatCents(order.total_cents)} → ${formatCents(subtotal + shipping)}`,
        );
      }
    }

    if (changes.length === 0) return order;
    set("updated_at", Date.now());
    db.prepare(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`).run(...args, order.id);
    for (const c of changes) logOrderEvent(order.id, actor, c);
    return getOrderById(order.id)!;
  })();
  return result;
}

export function deleteOrder(orderId: number): boolean {
  return getDb().prepare("DELETE FROM orders WHERE id = ?").run(orderId).changes > 0;
}
