import { NextResponse } from "next/server";
import { sanitizeLines } from "@/lib/server/cart";
import { jsonError, readJson } from "@/lib/server/http";
import { createOrder, markOrderUnpaid, type ShippingDetails } from "@/lib/server/orders";
import { paymentMode, startStripeCheckout } from "@/lib/server/payments";
import { getCurrentUser } from "@/lib/server/session";

function field(body: Record<string, unknown>, key: keyof ShippingDetails, max: number): string | null {
  const value = typeof body[key] === "string" ? (body[key] as string).trim() : "";
  return value && value.length <= max ? value : null;
}

/** Creates an order from `{ lines, name, address, city, postcode }` and returns where to pay. */
export async function POST(req: Request) {
  const parsed = await readJson(req);
  if ("response" in parsed) return parsed.response;
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Please sign in to check out.");

  const { body } = parsed;
  const shipping = {
    name: field(body, "name", 80),
    address: field(body, "address", 200),
    city: field(body, "city", 80),
    postcode: field(body, "postcode", 20),
  };
  if (!shipping.name || !shipping.address || !shipping.city || !shipping.postcode) {
    return jsonError(400, "Please fill in your name and full delivery address.");
  }
  const lines = sanitizeLines(body.lines);
  if (lines.length === 0) return jsonError(400, "Your cart is empty.");

  const provider = paymentMode();
  const order = createOrder(user, lines, shipping as ShippingDetails, provider);

  if (provider === "demo") {
    return NextResponse.json({ orderId: order.public_id, redirectUrl: `/pay/${order.public_id}` }, { status: 201 });
  }

  try {
    const redirectUrl = await startStripeCheckout(order, new URL(req.url).origin);
    return NextResponse.json({ orderId: order.public_id, redirectUrl }, { status: 201 });
  } catch (err) {
    console.error("[payments] Stripe checkout failed:", err);
    markOrderUnpaid(order.id, "failed");
    return jsonError(502, "Couldn't start the payment with Stripe. Check your Stripe keys and try again.");
  }
}
