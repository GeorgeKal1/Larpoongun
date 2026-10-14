"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "Dive" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=spearguns", label: "Spearguns" },
];

export function Header() {
  const { count } = useCart();
  const { user, status } = useAuth();
  const pathname = usePathname();

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return (
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/admin" aria-label="LarpoonGun admin">
            <Logo size={38} />
          </Link>
          <span className="pay-provider">Admin</span>
          <nav className="main-nav">
            <Link href="/">View shop ↗</Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" aria-label="LarpoonGun home">
          <Logo size={38} />
        </Link>
        <nav className="main-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/account"
          className={`account-link ${status === "loading" ? "is-loading" : ""}`}
          aria-label={user ? `Account: ${user.name}` : "Sign in"}
        >
          {user ? (
            <>
              <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="account-name">{user.name.split(" ")[0]}</span>
            </>
          ) : (
            <span>Sign in</span>
          )}
        </Link>
        <Link href="/cart" className="cart-link" aria-label={`Cart, ${count} items`}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="20" r="1.4" fill="currentColor" />
            <circle cx="17" cy="20" r="1.4" fill="currentColor" />
          </svg>
          {count > 0 && <span className="cart-badge">{count}</span>}
        </Link>
      </div>
    </header>
  );
}
