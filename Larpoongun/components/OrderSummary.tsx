import { formatCents } from "@/lib/pricing";
import type { Fulfillment, Order, OrderStatus } from "@/lib/server/orders";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  failed: "Payment failed",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status status-${status}`}>{STATUS_LABEL[status]}</span>;
}

const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
  unfulfilled: "Not shipped",
  shipped: "Shipped",
  delivered: "Delivered",
  returned: "Returned",
};

export function FulfillmentBadge({ fulfillment }: { fulfillment: Fulfillment }) {
  return <span className={`status fulfil-${fulfillment}`}>{FULFILLMENT_LABEL[fulfillment]}</span>;
}

export function formatDate(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(ms);
}

export function OrderSummary({ order }: { order: Order }) {
  return (
    <>
      <ul className="summary-items">
        {order.items.map((i) => (
          <li key={i.slug}>
            <span>
              {i.qty} × {i.name}
            </span>
            <span>{formatCents(i.unit_price_cents * i.qty)}</span>
          </li>
        ))}
      </ul>
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>{formatCents(order.subtotal_cents)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{order.shipping_cents === 0 ? "Free" : formatCents(order.shipping_cents)}</dd>
        </div>
        <div className="summary-total">
          <dt>Total</dt>
          <dd>{formatCents(order.total_cents)}</dd>
        </div>
      </dl>
    </>
  );
}
