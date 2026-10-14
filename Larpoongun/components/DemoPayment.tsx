"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";

export function DemoPayment({ orderId, amount }: { orderId: string; amount: string }) {
  const router = useRouter();
  const { reload } = useCart();
  const [busy, setBusy] = useState<"approve" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pay(outcome: "approve" | "decline") {
    setBusy(outcome);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/demo-pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Payment failed. Please try again.");
        setBusy(null);
        return;
      }
      if (outcome === "approve") await reload();
      router.replace(`/orders/${encodeURIComponent(orderId)}`);
    } catch {
      setError("Couldn't reach the server. Is it running?");
      setBusy(null);
    }
  }

  return (
    <div className="pay-actions">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="btn btn-lg btn-block" disabled={busy !== null} onClick={() => pay("approve")}>
        {busy === "approve" ? "Processing…" : `Pay ${amount}`}
      </button>
      <button
        type="button"
        className="btn btn-lg btn-block btn-ghost"
        disabled={busy !== null}
        onClick={() => pay("decline")}
      >
        {busy === "decline" ? "Processing…" : "Simulate a declined card"}
      </button>
    </div>
  );
}
