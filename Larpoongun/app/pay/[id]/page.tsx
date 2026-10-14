import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DemoPayment } from "@/components/DemoPayment";
import { OrderSummary } from "@/components/OrderSummary";
import { formatCents } from "@/lib/pricing";
import { getOrderForUser } from "@/lib/server/orders";
import { paymentMode } from "@/lib/server/payments";
import { getCurrentUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "Payment" };

/** Stand-in for a payment provider's hosted page, used when Stripe isn't configured. */
export default async function DemoPayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/account?next=/pay/${encodeURIComponent(id)}`);

  const order = getOrderForUser(id, user.id);
  if (!order || order.payment_provider !== "demo" || paymentMode() !== "demo") notFound();
  if (order.status !== "pending") redirect(`/orders/${order.public_id}`);

  return (
    <div className="page">
      <div className="container">
        <div className="pay-card">
          <span className="pay-provider">LarpoonPay · demo</span>
          <h1>{formatCents(order.total_cents)}</h1>
          <p className="hint">
            Order {order.public_id}. This simulates a payment provider; no card is needed and nothing is charged.
          </p>
          <div className="summary">
            <OrderSummary order={order} />
          </div>
          <DemoPayment orderId={order.public_id} amount={formatCents(order.total_cents)} />
        </div>
      </div>
    </div>
  );
}
