import Stripe from "stripe";
import { markOrderPaid, setPaymentRef, type Order, type PaymentProvider } from "./orders";

let warnedNonTestKey = false;

/**
 * Payments run in one of two modes:
 * - "stripe": STRIPE_SECRET_KEY is a test key (sk_test_…). Customers pay on Stripe's hosted
 *   Checkout page, so card details never touch this server.
 * - "demo": no key configured. A built-in page simulates the payment (approve or decline).
 */
export function paymentMode(): PaymentProvider {
  const key = process.env.STRIPE_SECRET_KEY;
  if (key?.startsWith("sk_test_")) return "stripe";
  if (key && !warnedNonTestKey) {
    warnedNonTestKey = true;
    console.warn("[payments] STRIPE_SECRET_KEY is not a test key (sk_test_…), so it is ignored; using demo payments.");
  }
  return "demo";
}

let stripe: Stripe | undefined;
function getStripe(): Stripe {
  stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!);
  return stripe;
}

/** Creates a Stripe Checkout Session for the order and returns the URL to send the customer to. */
export async function startStripeCheckout(order: Order, origin: string): Promise<string> {
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: order.email,
    client_reference_id: String(order.id),
    metadata: { order_id: String(order.id), public_id: order.public_id },
    line_items: order.items.map((i) => ({
      quantity: i.qty,
      price_data: {
        currency: order.currency.toLowerCase(),
        unit_amount: i.unit_price_cents,
        product_data: { name: i.name },
      },
    })),
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: order.shipping_cents === 0 ? "Free shipping" : "Standard shipping",
          fixed_amount: { amount: order.shipping_cents, currency: order.currency.toLowerCase() },
        },
      },
    ],
    success_url: `${origin}/orders/${order.public_id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout?cancelled=${order.public_id}`,
  });
  setPaymentRef(order.id, session.id);
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session.url;
}

/** Marks the order paid if Stripe confirms this session paid the right amount. */
export function applyStripeSession(order: Order, session: Stripe.Checkout.Session): boolean {
  const matches =
    session.id === order.payment_ref &&
    session.payment_status === "paid" &&
    session.amount_total === order.total_cents &&
    session.currency?.toUpperCase() === order.currency;
  return matches && markOrderPaid(order.id, session.id);
}

/** Called when the customer comes back from Stripe, in case the webhook hasn't arrived (or isn't set up). */
export async function syncStripeOrder(order: Order): Promise<void> {
  if (order.payment_provider !== "stripe" || order.status !== "pending" || !order.payment_ref) return;
  if (paymentMode() !== "stripe") return;
  const session = await getStripe().checkout.sessions.retrieve(order.payment_ref);
  applyStripeSession(order, session);
}

export function constructStripeEvent(payload: string, signature: string): Stripe.Event {
  return getStripe().webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!);
}
