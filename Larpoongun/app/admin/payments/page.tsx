import Link from "next/link";
import type { Metadata } from "next";
import { formatDate, StatusBadge } from "@/components/OrderSummary";
import { formatCents } from "@/lib/pricing";
import { requireAdmin } from "@/lib/server/admin-auth";
import { getStats, listAllOrders } from "@/lib/server/admin-orders";
import { ORDER_STATUSES } from "@/lib/server/orders";
import { paymentMode } from "@/lib/server/payments";

export const metadata: Metadata = { title: "Payments" };

type Search = { status?: string; provider?: string };

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const filters = await searchParams;
  const stats = getStats();
  const payments = listAllOrders(filters);
  const mode = paymentMode();

  return (
    <div className="page">
      <div className="container">
        <header className="page-header">
          <h1>Payments</h1>
          <p>
            Every payment attempt. Payments currently run in{" "}
            <strong>{mode === "stripe" ? "Stripe test mode" : "demo mode"}</strong>.
          </p>
        </header>

        <div className="stat-grid">
          <div className="stat">
            <span>Collected</span>
            <strong>{formatCents(stats.revenueCents)}</strong>
            <small>{stats.paidOrders} successful payments</small>
          </div>
          {stats.byProvider.map((p) => (
            <div className="stat" key={p.provider}>
              <span>Via {p.provider}</span>
              <strong>{formatCents(p.cents)}</strong>
              <small>{p.count} payments</small>
            </div>
          ))}
          <div className="stat">
            <span>Failed / cancelled</span>
            <strong>{stats.byStatus.failed + stats.byStatus.cancelled}</strong>
            <small>attempts</small>
          </div>
        </div>

        <form className="admin-filters" method="get">
          <select name="status" defaultValue={filters.status ?? ""}>
            <option value="">Any status</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select name="provider" defaultValue={filters.provider ?? ""}>
            <option value="">Any provider</option>
            <option value="demo">demo</option>
            <option value="stripe">stripe</option>
          </select>
          <button type="submit" className="btn">
            Filter
          </button>
          {(filters.status || filters.provider) && (
            <Link href="/admin/payments" className="link-btn">
              Clear
            </Link>
          )}
        </form>

        {payments.length === 0 ? (
          <p className="empty-state">No payments match.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Provider</th>
                  <th>Reference</th>
                  <th>Status</th>
                  <th>Paid at</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.public_id}`} className="admin-link">
                        {o.public_id}
                      </Link>
                    </td>
                    <td>{o.email}</td>
                    <td>{o.payment_provider}</td>
                    <td>
                      <code className="ref">{o.payment_ref ?? "—"}</code>
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="nowrap">{o.paid_at ? formatDate(o.paid_at) : "—"}</td>
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
