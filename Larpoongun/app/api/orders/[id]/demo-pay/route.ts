import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/server/http";
import { getOrderForUser, markOrderPaid, markOrderUnpaid } from "@/lib/server/orders";
import { paymentMode } from "@/lib/server/payments";
import { getCurrentUser } from "@/lib/server/session";

/** Simulated payment provider, only available when Stripe isn't configured. `{ outcome: "approve" | "decline" }` */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (paymentMode() !== "demo") return jsonError(404, "Demo payments are disabled while Stripe is configured.");

  const parsed = await readJson(req);
  if ("response" in parsed) return parsed.response;
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Please sign in.");

  const { id } = await params;
  const order = getOrderForUser(id, user.id);
  if (!order || order.payment_provider !== "demo") return jsonError(404, "Order not found.");
  if (order.status !== "pending") return jsonError(409, `This order is already ${order.status}.`);

  const outcome = parsed.body.outcome;
  if (outcome === "approve") {
    markOrderPaid(order.id, `demo_${randomBytes(8).toString("hex")}`);
  } else if (outcome === "decline") {
    markOrderUnpaid(order.id, "failed");
  } else {
    return jsonError(400, "Unknown outcome.");
  }
  return NextResponse.json({ status: outcome === "approve" ? "paid" : "failed" });
}
