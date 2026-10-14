import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Logo size={28} />
        <nav>
          <Link href="/shop">Shop</Link>
          <Link href="/cart">Cart</Link>
        </nav>
        <small>© {new Date().getFullYear()} LarpoonGun · Demo store, no real orders</small>
      </div>
    </footer>
  );
}
