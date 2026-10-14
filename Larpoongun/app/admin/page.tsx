import Link from "next/link";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { formatDate, FulfillmentBadge, StatusBadge } from "@/components/OrderSummary";
import { formatCents } from "@/lib/pricing";
import { adminConfigured, getAdmin } from "@/lib/server/admin-auth";
import { getStats, listAllOrders } from "@/lib/server/admin-orders";
import { FULFILLMENTS, ORDER_STATUSES } from "@/lib/server/orders";

type Search = { status?: string; fulfillment?: string; q?: string };

export default async function AdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  if (!(await getAdmin())) return <AdminLogin configured={adminConfigured()} />;

  const filters = await searchParams;
  const stats = getStats();
  const orders = listAllOrders(filters);
  const filtered = Boolean(filters.status || filters.fulfillment || filters.q);

  return (
    <div className="page">
      <div className="container">
        <header className="page-header">
          <h1>Orders</h1>
          <p>Every order from every customer.</p>
        </header>

        <div className="stat-grid">
          <div className="stat">
            <span>Revenue (paid)</span>
            <strong>{formatCents(stats.revenueCents)}</strong>
            <small>{stats.paidOrders} paid orders</small>
          </div>
          <div className="stat">
            <span>Awaiting payment</span>
            <strong>{formatCents(stats.pendingCents)}</strong>
            <small>{stats.byStatus.pending} pending orders</small>
          </div>
          <div className="stat">
            <span>To ship</span>
            <strong>{stats.toShip}</strong>
            <small>paid, not shipped yet</small>
          </div>
          <div className="stat">
            <span>All orders</span>
            <strong>{stats.orders}</strong>
            <small>
              {stats.byStatus.failed} failed · {stats.byStatus.cancelled} cancelled · {stats.customers} customers
            </small>
          </div>
        </div>

        <form className="admin-filters" method="get">
          <input name="q" placeholder="Search order id, email or name" defaultValue={filters.q} />
          <select name="status" defaultValue={filters.status ?? ""}>
            <option value="">Any payment status</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select name="fulfillment" defaultValue={filters.fulfillment ?? ""}>
            <option value="">Any fulfilment</option>
            {FULFILLMENTS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button type="submit" className="btn">
            Filter
          </button>
          {filtered && (
            <Link href="/admin" className="link-btn">
              Clear
            </Link>
          )}
        </form>

        {orders.length === 0 ? (
          <p className="empty-state">{filtered ? "No orders match these filters." : "No orders yet."}</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Placed</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Fulfilment</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.public_id}`} className="admin-link">
                        {o.public_id}
                      </Link>
                    </td>
                    <td className="nowrap">{formatDate(o.created_at)}</td>
                    <td>
                      {o.name}
                      <small>{o.email}</small>
                    </td>
                    <td className="items-cell">{o.items.map((i) => `${i.qty} × ${i.name}`).join(", ")}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td>
                      <FulfillmentBadge fulfillment={o.fulfillment} />
                    </td>
                    <td className="num">{formatCents(o.total_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
