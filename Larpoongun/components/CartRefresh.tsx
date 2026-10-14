"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/** After a paid order the server removes the bought items from the saved cart; pick that up. */
export function CartRefresh() {
  const { reload, saved } = useCart();
  useEffect(() => {
    if (saved) void reload();
  }, [saved, reload]);
  return null;
}
