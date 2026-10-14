"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatCents, shippingFor, toCents } from "@/lib/pricing";

export function CheckoutView({ mode, cancelled }: { mode: "demo" | "stripe"; cancelled: boolean }) {
  const { user, status } = useAuth();
  const { lines, subtotal, ready } = useCart();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const subtotalCents = toCents(subtotal);
  const shippingCents = shippingFor(subtotalCents);

  async function placeOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map(({ slug, qty }) => ({ slug, qty })),
          name: form.get("name"),
          address: form.get("address"),
          city: form.get("city"),
          postcode: form.get("postcode"),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { redirectUrl?: string; error?: string };
      if (!res.ok || !data.redirectUrl) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      // Stripe's page is on another site, so leave the app; the demo page is ours.
      if (data.redirectUrl.startsWith("http")) window.location.assign(data.redirectUrl);
      else router.push(data.redirectUrl);
    } catch {
      setError("Couldn't reach the server. Is it running?");
      setBusy(false);
    }
  }

  if (status === "loading" || !ready) {
    return (
      <div className="page">
        <div className="container empty-state">
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <div className="container empty-state">
          <h1>Sign in to check out</h1>
          <p>Your cart comes with you, and your orders are saved to your account.</p>
          <div className="auth-actions center">
            <Link href="/account?next=/checkout" className="btn btn-lg">
              Sign in
            </Link>
            <Link href="/account?mode=register&next=/checkout" className="btn btn-lg btn-ghost">
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="page">
        <div className="container empty-state">
          <h1>Nothing to check out</h1>
          <Link href="/shop" className="btn btn-lg">
            Browse gear
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <header className="page-header">
          <h1>Checkout</h1>
        </header>
        <div className="cart-layout">
          <form className="checkout-form" onSubmit={placeOrder}>
            {cancelled && <p className="notice">Payment cancelled. Your cart is still here whenever you&apos;re ready.</p>}
            <h2>Delivery</h2>
            <label>
              Full name
              <input name="name" required maxLength={80} autoComplete="name" defaultValue={user.name} />
            </label>
            <label>
              Email
              <input type="email" value={user.email} readOnly disabled />
            </label>
            <label>
              Address
              <input name="address" required maxLength={200} autoComplete="street-address" />
            </label>
            <div className="form-row">
              <label>
                City
                <input name="city" required maxLength={80} autoComplete="address-level2" />
              </label>
              <label>
                Postcode
                <input name="postcode" required maxLength={20} autoComplete="postal-code" />
              </label>
            </div>

            <div className="pay-method">
              {mode === "stripe" ? (
                <>
                  <strong>Pay with Stripe (test mode)</strong>
                  <span>You&apos;ll enter your card on Stripe&apos;s secure page. Use test card 4242 4242 4242 4242.</span>
                </>
              ) : (
                <>
                  <strong>Demo payment</strong>
                  <span>No real payment provider is connected. You can approve or decline the payment on the next page.</span>
                </>
              )}
            </div>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-lg btn-block" disabled={busy}>
              {busy ? "One moment…" : `Continue to payment · ${formatCents(subtotalCents + shippingCents)}`}
            </button>
          </form>

          <aside className="summary">
            <h2>Order summary</h2>
            <ul className="summary-items">
              {lines.map(({ product, qty }) => (
                <li key={product.slug}>
                  <span>
                    {qty} × {product.name}
                  </span>
                  <span>{formatCents(toCents(product.price) * qty)}</span>
                </li>
              ))}
            </ul>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatCents(subtotalCents)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{shippingCents === 0 ? "Free" : formatCents(shippingCents)}</dd>
              </div>
              <div className="summary-total">
                <dt>Total</dt>
                <dd>{formatCents(subtotalCents + shippingCents)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </div>
  );
}
