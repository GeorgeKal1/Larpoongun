import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getOrderById, markOrderUnpaid } from "@/lib/server/orders";
import { applyStripeSession, constructStripeEvent, paymentMode } from "@/lib/server/payments";

/**
 * Stripe webhook (optional). Locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
 * and put the printed signing secret in STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  if (paymentMode() !== "stripe" || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 404 });
  }

  let event: Stripe.Event;
  try {
    event = constructStripeEvent(await req.text(), req.headers.get("stripe-signature") ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type.startsWith("checkout.session.")) {
    const session = event.data.object as Stripe.Checkout.Session;
    const order = getOrderById(Number(session.metadata?.order_id));
    if (order && order.payment_ref === session.id) {
      switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded":
          applyStripeSession(order, session);
          break;
        case "checkout.session.async_payment_failed":
          markOrderUnpaid(order.id, "failed");
          break;
        case "checkout.session.expired":
          markOrderUnpaid(order.id, "cancelled");
          break;
      }
    }
  }

  return NextResponse.json({ received: true });
}
