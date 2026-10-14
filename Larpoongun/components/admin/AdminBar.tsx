"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/payments", label: "Payments" },
];

export function AdminBar({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => undefined);
    router.refresh();
  }

  return (
    <div className="admin-bar">
      <div className="container admin-bar-inner">
        <nav>
          {LINKS.map((l) => {
            const active = l.href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/orders") : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={active ? "active" : undefined}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <span className="admin-user">Signed in as {username}</span>
        <button type="button" className="btn btn-sm btn-ghost" onClick={signOut} disabled={busy}>
          {busy ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
