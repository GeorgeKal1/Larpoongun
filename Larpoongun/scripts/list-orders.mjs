// Prints every order in the database: `npm run orders` (add a status to filter, e.g. `npm run orders paid`).
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "larpoongun.db");
if (!fs.existsSync(dbPath)) {
  console.log(`No database yet at ${dbPath}. Start the app and place an order first.`);
  process.exit(0);
}

const db = new Database(dbPath, { readonly: true, fileMustExist: true });
const hasOrders = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'orders'").get();
if (!hasOrders) {
  console.log("No orders table yet. Place an order first.");
  process.exit(0);
}

const status = process.argv[2];
const orders = db
  .prepare(
    `SELECT o.*, (SELECT group_concat(qty || ' x ' || name, ', ') FROM order_items WHERE order_id = o.id) AS items
     FROM orders o ${status ? "WHERE o.status = ?" : ""} ORDER BY o.created_at DESC`,
  )
  .all(...(status ? [status] : []));

const euros = (cents) => `€${(cents / 100).toFixed(2)}`;
console.table(
  orders.map((o) => ({
    order: o.public_id,
    placed: new Date(o.created_at).toLocaleString(),
    customer: o.email,
    status: o.status,
    total: euros(o.total_cents),
    via: o.payment_provider,
    items: o.items,
  })),
);
const paid = orders.filter((o) => o.status === "paid");
console.log(`${orders.length} orders, ${paid.length} paid, revenue ${euros(paid.reduce((n, o) => n + o.total_cents, 0))}`);
