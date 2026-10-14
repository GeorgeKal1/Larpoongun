/** Money is handled in integer cents everywhere except display, so totals never drift. */

export const CURRENCY = "EUR";
export const SHIPPING_CENTS = 990;
export const FREE_SHIPPING_FROM_CENTS = 15000;

export const toCents = (euros: number) => Math.round(euros * 100);

export function shippingFor(subtotalCents: number): number {
  return subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_FROM_CENTS ? 0 : SHIPPING_CENTS;
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY }).format(cents / 100);
}
