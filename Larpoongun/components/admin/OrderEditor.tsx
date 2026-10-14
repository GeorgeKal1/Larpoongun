"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { formatCents, shippingFor } from "@/lib/pricing";
import type { Order } from "@/lib/server/orders";

const STATUSES = ["pending", "paid", "failed", "cancelled"] as const;
const FULFILLMENTS = ["unfulfilled", "shipped", "delivered", "returned"] as const;

interface CatalogItem {
  slug: string;
  name: string;
  price_cents: number;
}

interface Line {
  slug: string;
  name: string;
  unit_price_cents: number;
  qty: number;
}

async function send(method: "PATCH" | "DELETE", orderId: string, body: unknown) {
  const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
}

export function OrderEditor({ order, catalog }: { order: Order; catalog: CatalogItem[] }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(order.items);
  const [addSlug, setAddSlug] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const subtotal = useMemo(() => lines.reduce((n, l) => n + l.unit_price_cents * l.qty, 0), [lines]);
  const shipping = shippingFor(subtotal);
  const itemsChanged =
    JSON.stringify(lines.map((l) => [l.slug, l.qty])) !== JSON.stringify(order.items.map((i) => [i.slug, i.qty]));

  async function run(action: () => Promise<void>, ok: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage({ kind: "ok", text: ok });
      router.refresh();
    } catch (err) {
      setMessage({ kind: "error", text: (err as Error).message });
    }
    setBusy(false);
  }

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = Object.fromEntries(
      ["status", "fulfillment", "name", "email", "address", "city", "postcode", "admin_note"].map((k) => [
        k,
        String(form.get(k) ?? ""),
      ]),
    );
    if (itemsChanged) body.items = lines.map(({ slug, qty }) => ({ slug, qty }));
    void run(() => send("PATCH", order.public_id, body), "Order saved.");
  }

  function setQty(slug: string, qty: number) {
    setLines((ls) => ls.map((l) => (l.slug === slug ? { ...l, qty: Math.max(1, Math.min(99, qty)) } : l)));
  }

  function addItem() {
    const product = catalog.find((p) => p.slug === addSlug);
    if (!product) return;
    setLines((ls) =>
      ls.some((l) => l.slug === product.slug)
        ? ls.map((l) => (l.slug === product.slug ? { ...l, qty: Math.min(99, l.qty + 1) } : l))
        : [...ls, { slug: product.slug, name: product.name, unit_price_cents: product.price_cents, qty: 1 }],
    );
    setAddSlug("");
  }

  function deleteOrder() {
    const typed = window.prompt(`This permanently deletes the order and its history.\nType ${order.public_id} to confirm.`);
    if (typed !== order.public_id) return;
    void run(async () => {
      await send("DELETE", order.public_id, { confirm: order.public_id });
      router.replace("/admin");
    }, "Order deleted.");
  }

  return (
    <form className="admin-editor" onSubmit={save}>
      <section className="admin-panel">
        <h2>Status</h2>
        <div className="form-row">
          <label>
            Payment status
            <select name="status" defaultValue={order.status}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fulfilment
            <select name="fulfillment" defaultValue={order.fulfillment}>
              {FULFILLMENTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
        </div>
        {order.payment_provider === "stripe" && (
          <p className="hint">
            Changing the status here only updates our records. Refunds and charges are made in the Stripe dashboard.
          </p>
        )}
      </section>

      <section className="admin-panel">
        <h2>Items</h2>
        <table className="admin-table admin-items">
          <thead>
            <tr>
              <th>Product</th>
              <th className="num">Price</th>
              <th>Qty</th>
              <th className="num">Line total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.slug}>
                <td>{l.name}</td>
                <td className="num">{formatCents(l.unit_price_cents)}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={l.qty}
                    onChange={(e) => setQty(l.slug, Number(e.target.value) || 1)}
                    aria-label={`Quantity of ${l.name}`}
                    className="qty-input"
                  />
                </td>
                <td className="num">{formatCents(l.unit_price_cents * l.qty)}</td>
                <td>
                  <button
                    type="button"
                    className="link-btn"
                    disabled={lines.length === 1}
                    title={lines.length === 1 ? "An order needs at least one item" : undefined}
                    onClick={() => setLines((ls) => ls.filter((x) => x.slug !== l.slug))}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="admin-add-item">
          <select value={addSlug} onChange={(e) => setAddSlug(e.target.value)} aria-label="Product to add">
            <option value="">Add a product…</option>
            {catalog.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} · {formatCents(p.price_cents)}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-sm btn-ghost" onClick={addItem} disabled={!addSlug}>
            Add
          </button>
        </div>
        <dl className="admin-dl admin-totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatCents(subtotal)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{shipping === 0 ? "Free" : formatCents(shipping)}</dd>
          </div>
          <div className="summary-total">
            <dt>Total</dt>
            <dd>{formatCents(subtotal + shipping)}</dd>
          </div>
        </dl>
        {itemsChanged && (
          <p className="hint">
            Items changed: total was {formatCents(order.total_cents)}. Save to apply.
            {order.status === "paid" && " The customer is not charged or refunded automatically."}
          </p>
        )}
      </section>

      <section className="admin-panel">
        <h2>Customer & delivery</h2>
        <div className="form-row">
          <label>
            Name
            <input name="name" defaultValue={order.name} required maxLength={80} />
          </label>
          <label>
            Email
            <input name="email" type="email" defaultValue={order.email} required maxLength={254} />
          </label>
        </div>
        <label>
          Address
          <input name="address" defaultValue={order.address} required maxLength={200} />
        </label>
        <div className="form-row">
          <label>
            City
            <input name="city" defaultValue={order.city} required maxLength={80} />
          </label>
          <label>
            Postcode
            <input name="postcode" defaultValue={order.postcode} required maxLength={20} />
          </label>
        </div>
        <label>
          Internal note
          <textarea name="admin_note" defaultValue={order.admin_note ?? ""} maxLength={2000} rows={3} />
        </label>
      </section>

      {message && (
        <p className={message.kind === "ok" ? "notice" : "form-error"} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}
      <div className="admin-editor-actions">
        <button type="submit" className="btn btn-lg" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button type="button" className="btn btn-lg btn-danger" onClick={deleteOrder} disabled={busy}>
          Delete order
        </button>
      </div>
    </form>
  );
}
