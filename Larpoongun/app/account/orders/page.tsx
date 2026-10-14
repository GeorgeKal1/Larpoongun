import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatDate, StatusBadge } from "@/components/OrderSummary";
import { formatCents } from "@/lib/pricing";
import { listOrdersForUser } from "@/lib/server/orders";
import { getCurrentUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/account?next=/account/orders");
  const orders = listOrdersForUser(user.id);

  return (
    <div className="page">
      <div className="container">
        <header className="page-header">
          <h1>Your orders</h1>
          <p>
            {orders.length} order{orders.length === 1 ? "" : "s"}
          </p>
        </header>
        {orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders yet.</p>
            <Link href="/shop" className="btn btn-lg">
              Browse gear
            </Link>
          </div>
        ) : (
          <ul className="order-list">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.public_id}`} className="order-row">
                  <div>
                    <strong>{o.public_id}</strong>
                    <span className="hint">{formatDate(o.created_at)}</span>
                  </div>
                  <span className="order-row-items">
                    {o.items.map((i) => `${i.qty} × ${i.name}`).join(", ")}
                  </span>
                  <StatusBadge status={o.status} />
                  <strong className="order-row-total">{formatCents(o.total_cents)}</strong>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
