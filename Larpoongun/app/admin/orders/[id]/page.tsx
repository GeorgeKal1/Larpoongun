import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderEditor } from "@/components/admin/OrderEditor";
import { formatDate, FulfillmentBadge, StatusBadge } from "@/components/OrderSummary";
import { formatCents, toCents } from "@/lib/pricing";
import { products } from "@/lib/products";
import { requireAdmin } from "@/lib/server/admin-auth";
import { getOrderByPublicId } from "@/lib/server/admin-orders";
import { listOrderEvents } from "@/lib/server/orders";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await params).id };
}

export default async function AdminOrderPage({ params }: Props) {
  await requireAdmin();
  const order = getOrderByPublicId((await params).id);
  if (!order) notFound();
  const events = listOrderEvents(order.id);
  const catalog = products.map((p) => ({ slug: p.slug, name: p.name, price_cents: toCents(p.price) }));

  return (
    <div className="page">
      <div className="container">
        <nav className="breadcrumbs">
          <Link href="/admin">Orders</Link> / <span>{order.public_id}</span>
        </nav>
        <header className="admin-order-head">
          <div>
            <h1>{order.public_id}</h1>
            <p className="hint">
              Placed {formatDate(order.created_at)}
              {order.updated_at && ` · last edited ${formatDate(order.updated_at)}`}
            </p>
          </div>
          <div className="admin-order-badges">
            <StatusBadge status={order.status} />
            <FulfillmentBadge fulfillment={order.fulfillment} />
            <strong>{formatCents(order.total_cents)}</strong>
          </div>
        </header>

        <div className="admin-order-layout">
          {/* Remount after each save so the form shows what was stored. */}
          <OrderEditor key={order.updated_at ?? order.created_at} order={order} catalog={catalog} />

          <aside className="admin-side">
            <section className="admin-panel">
              <h2>Payment</h2>
              <dl className="admin-dl">
                <div>
                  <dt>Provider</dt>
                  <dd>{order.payment_provider === "stripe" ? "Stripe (test mode)" : "Demo"}</dd>
                </div>
                <div>
                  <dt>Reference</dt>
                  <dd>
                    <code className="ref">{order.payment_ref ?? "—"}</code>
                  </dd>
                </div>
                <div>
                  <dt>Paid at</dt>
                  <dd>{order.paid_at ? formatDate(order.paid_at) : "—"}</dd>
                </div>
                <div>
                  <dt>Customer account</dt>
                  <dd>{order.user_id ? `#${order.user_id}` : "deleted"}</dd>
                </div>
              </dl>
              {order.payment_provider === "stripe" && order.payment_ref && (
                <a
                  className="admin-link"
                  href={`https://dashboard.stripe.com/test/checkout/sessions/${order.payment_ref}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Stripe dashboard ↗
                </a>
              )}
            </section>

            <section className="admin-panel">
              <h2>History</h2>
              {events.length === 0 ? (
                <p className="hint">No history recorded for this order.</p>
              ) : (
                <ol className="timeline">
                  {events.map((e) => (
                    <li key={e.id}>
                      <span className="timeline-meta">
                        {formatDate(e.at)} · {e.actor}
                      </span>
                      {e.message}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
