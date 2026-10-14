import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/server/admin-auth";
import { deleteOrder, getOrderByPublicId, parseOrderPatch, updateOrder } from "@/lib/server/admin-orders";
import { jsonError, readJson } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

/** Edits an order. Body: any of status, fulfillment, name, email, address, city, postcode, admin_note, items. */
export async function PATCH(req: Request, { params }: Ctx) {
  const parsed = await readJson(req);
  if ("response" in parsed) return parsed.response;
  const admin = await getAdmin();
  if (!admin) return jsonError(401, "Admin sign-in required.");

  const order = getOrderByPublicId((await params).id);
  if (!order) return jsonError(404, "Order not found.");

  const patch = parseOrderPatch(parsed.body);
  if (typeof patch === "string") return jsonError(400, patch);

  const updated = updateOrder(order.id, patch, `admin:${admin}`);
  if (typeof updated === "string") return jsonError(400, updated);
  return NextResponse.json({ order: updated });
}

/** Permanently deletes an order and its history. */
export async function DELETE(req: Request, { params }: Ctx) {
  const parsed = await readJson(req);
  if ("response" in parsed) return parsed.response;
  const admin = await getAdmin();
  if (!admin) return jsonError(401, "Admin sign-in required.");

  const order = getOrderByPublicId((await params).id);
  if (!order) return jsonError(404, "Order not found.");
  if (parsed.body.confirm !== order.public_id) return jsonError(400, "Confirm by sending the order id.");

  deleteOrder(order.id);
  console.info(`[admin] ${admin} deleted order ${order.public_id}`);
  return NextResponse.json({ ok: true });
}
