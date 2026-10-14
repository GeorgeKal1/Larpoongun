import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CartRefresh } from "@/components/CartRefresh";
import { formatDate, OrderSummary, StatusBadge } from "@/components/OrderSummary";
import { getOrderForUser } from "@/lib/server/orders";
import { syncStripeOrder } from "@/lib/server/payments";
import { getCurrentUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "Order" };

const HEADLINE = {
  paid: "Thanks, your order is confirmed",
  pending: "Waiting for payment",
  failed: "Payment didn't go through",
  cancelled: "Order cancelled",
} as const;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/account?next=/orders/${encodeURIComponent(id)}`);

  let order = getOrderForUser(id, user.id);
  if (!order) notFound();

  // Coming back from Stripe: confirm the payment with Stripe directly.
  if (order.status === "pending" && order.payment_provider === "stripe") {
    try {
      await syncStripeOrder(order);
      order = getOrderForUser(id, user.id)!;
    } catch (err) {
      console.error("[payments] Could not confirm Stripe session:", err);
    }
  }

  return (
    <div className="page">
      <div className="container">
        {order.status === "paid" && <CartRefresh />}
        <nav className="breadcrumbs">
          <Link href="/account/orders">Your orders</Link> / <span>{order.public_id}</span>
        </nav>
        <div className="cart-layout">
          <div className="order-main">
            <StatusBadge status={order.status} />
            <h1>{HEADLINE[order.status]}</h1>
            <p className="hint">
              Order {order.public_id} · placed {formatDate(order.created_at)}
              {order.paid_at && ` · paid ${formatDate(order.paid_at)}`}
            </p>
            <div className="order-address">
              <strong>Delivering to</strong>
              <span>{order.name}</span>
              <span>{order.address}</span>
              <span>
                {order.postcode} {order.city}
              </span>
              <span className="hint">{order.email}</span>
            </div>
            <p className="hint">
              Payment method: {order.payment_provider === "stripe" ? "Stripe (test mode)" : "demo payment"}. This is a
              test store, so nothing will be shipped.
            </p>
            {(order.status === "failed" || order.status === "cancelled") && (
              <Link href="/checkout" className="btn btn-lg">
                Try again
              </Link>
            )}
            {order.status === "pending" && order.payment_provider === "demo" && (
              <Link href={`/pay/${order.public_id}`} className="btn btn-lg">
                Complete payment
              </Link>
            )}
          </div>
          <aside className="summary">
            <h2>Summary</h2>
            <OrderSummary order={order} />
          </aside>
        </div>
      </div>
    </div>
  );
}
