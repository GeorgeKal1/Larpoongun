import type { Metadata } from "next";
import { CheckoutView } from "@/components/CheckoutView";
import { paymentMode } from "@/lib/server/payments";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  const { cancelled } = await searchParams;
  return <CheckoutView mode={paymentMode()} cancelled={Boolean(cancelled)} />;
}
