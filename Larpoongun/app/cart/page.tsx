"use client";

import Link from "next/link";
import { ProductArt } from "@/components/ProductArt";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { FREE_SHIPPING_FROM_CENTS, formatCents, shippingFor, toCents } from "@/lib/pricing";

export default function CartPage() {
  const { lines, subtotal, setQty, remove, ready, saved } = useCart();
  const shipping = shippingFor(toCents(subtotal)) / 100;

  if (!ready) {
    return (
      <div className="page">
        <div className="container empty-state">
          <p>Loading your cart…</p>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="page">
        <div className="container empty-state">
          <h1>Your cart is empty</h1>
          <p>Nothing on the stringer yet.</p>
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
          <h1>Your cart</h1>
        </header>
        <div className="cart-layout">
          <ul className="cart-lines">
            {lines.map(({ product, qty }) => (
              <li key={product.slug} className="cart-line">
                <Link href={`/products/${product.slug}`} className="cart-line-art">
                  <ProductArt art={product.art} accent={product.accent} />
                </Link>
                <div className="cart-line-info">
                  <Link href={`/products/${product.slug}`}>
                    <strong>{product.name}</strong>
                  </Link>
                  <span>{formatPrice(product.price)}</span>
                </div>
                <div className="stepper" role="group" aria-label={`Quantity of ${product.name}`}>
                  <button type="button" onClick={() => setQty(product.slug, qty - 1)} aria-label="Decrease quantity">
                    −
                  </button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => setQty(product.slug, qty + 1)} aria-label="Increase quantity">
                    +
                  </button>
                </div>
                <span className="cart-line-total">{formatPrice(product.price * qty)}</span>
                <button type="button" className="link-btn" onClick={() => remove(product.slug)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <aside className="summary">
            <h2>Summary</h2>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
              </div>
              <div className="summary-total">
                <dt>Total</dt>
                <dd>{formatPrice(subtotal + shipping)}</dd>
              </div>
            </dl>
            {shipping > 0 && (
              <p className="hint">Free shipping on orders over {formatCents(FREE_SHIPPING_FROM_CENTS)}.</p>
            )}
            <Link href="/checkout" className="btn btn-lg btn-block">
              Checkout
            </Link>
            <p className="hint save-hint">
              {saved ? (
                "✓ Saved to your account"
              ) : (
                <>
                  <Link href="/account?next=/cart">Sign in</Link> or{" "}
                  <Link href="/account?mode=register&next=/cart">create an account</Link> to keep this cart.
                </>
              )}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
