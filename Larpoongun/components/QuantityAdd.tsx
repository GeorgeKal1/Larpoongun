"use client";

import { useState } from "react";
import { AddToCartButton } from "./AddToCartButton";

export function QuantityAdd({ slug }: { slug: string }) {
  const [qty, setQty] = useState(1);

  return (
    <div className="qty-add">
      <div className="stepper" role="group" aria-label="Quantity">
        <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
          −
        </button>
        <span>{qty}</span>
        <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase quantity">
          +
        </button>
      </div>
      <AddToCartButton slug={slug} qty={qty} />
    </div>
  );
}
