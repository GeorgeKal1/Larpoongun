"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

export function AddToCartButton({ slug, qty = 1, compact = false }: { slug: string; qty?: number; compact?: boolean }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <button
      type="button"
      className={`btn ${compact ? "btn-sm" : ""} ${added ? "btn-done" : ""}`}
      onClick={() => {
        add(slug, qty);
        setAdded(true);
      }}
    >
      {added ? "Added ✓" : compact ? "Add" : "Add to cart"}
    </button>
  );
}
