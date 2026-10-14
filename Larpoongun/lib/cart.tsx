"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./auth";
import { getProduct, type Product } from "./products";
import type { CartLine } from "./types";

export type { CartLine };

type Action =
  | { type: "add"; slug: string; qty?: number }
  | { type: "setQty"; slug: string; qty: number }
  | { type: "remove"; slug: string }
  | { type: "clear" }
  | { type: "hydrate"; lines: CartLine[] };

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case "add": {
      const qty = action.qty ?? 1;
      const existing = state.find((l) => l.slug === action.slug);
      if (existing) return state.map((l) => (l.slug === action.slug ? { ...l, qty: Math.min(99, l.qty + qty) } : l));
      return [...state, { slug: action.slug, qty }];
    }
    case "setQty":
      if (action.qty <= 0) return state.filter((l) => l.slug !== action.slug);
      return state.map((l) => (l.slug === action.slug ? { ...l, qty: Math.min(99, action.qty) } : l));
    case "remove":
      return state.filter((l) => l.slug !== action.slug);
    case "clear":
      return [];
    case "hydrate":
      return action.lines;
  }
}

/**
 * Where the cart currently lives:
 * - "pending": still finding out who is signed in / loading the saved cart
 * - "guest":   signed out, kept in this browser's localStorage
 * - "account": signed in, saved in the database
 */
type CartMode = "pending" | "guest" | "account";

interface CartContextValue {
  lines: (CartLine & { product: Product })[];
  count: number;
  subtotal: number;
  /** False until the cart has been loaded, so pages don't flash "empty". */
  ready: boolean;
  /** True when the cart is saved to the signed-in account. */
  saved: boolean;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  /** Re-reads the saved cart, e.g. after the server removed paid items. */
  reload: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);
const GUEST_KEY = "larpoongun-cart";

function readGuestCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as CartLine[]).filter((l) => getProduct(l.slug) && Number.isInteger(l.qty) && l.qty > 0);
  } catch {
    return [];
  }
}

function writeGuestCart(lines: CartLine[]) {
  try {
    if (lines.length) localStorage.setItem(GUEST_KEY, JSON.stringify(lines));
    else localStorage.removeItem(GUEST_KEY);
  } catch {
    // storage unavailable — the cart still works for this page view
  }
}

async function cartRequest(method: "POST" | "PUT", lines: CartLine[]): Promise<CartLine[]> {
  const res = await fetch("/api/cart", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines }),
    keepalive: true,
  });
  if (!res.ok) throw Object.assign(new Error(`Cart sync failed (${res.status})`), { status: res.status });
  return ((await res.json()) as { lines: CartLine[] }).lines;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, status, refresh } = useAuth();
  const userId = user?.id ?? null;
  const [state, dispatch] = useReducer(reducer, []);
  const [mode, setMode] = useState<CartMode>("pending");

  // One sign-in sync per user, even though dev-mode StrictMode runs effects twice.
  const signInSync = useRef<{ userId: number; promise: Promise<CartLine[]> } | null>(null);
  // Writes go out one at a time so the database never ends up with an older cart.
  const writeChain = useRef<Promise<unknown>>(Promise.resolve());
  const lastSaved = useRef<string>("");

  // Load the right cart whenever the signed-in user changes.
  useEffect(() => {
    if (status !== "ready") return;

    if (userId === null) {
      signInSync.current = null;
      dispatch({ type: "hydrate", lines: readGuestCart() });
      setMode("guest");
      return;
    }

    let cancelled = false;
    setMode("pending");
    if (signInSync.current?.userId !== userId) {
      // Fold anything added while signed out into the saved cart, then forget the local copy.
      const guest = readGuestCart();
      const promise = cartRequest("POST", guest).then((lines) => {
        writeGuestCart([]);
        return lines;
      });
      signInSync.current = { userId, promise };
    }
    signInSync.current.promise
      .then((lines) => {
        if (cancelled) return;
        lastSaved.current = JSON.stringify(lines);
        dispatch({ type: "hydrate", lines });
        setMode("account");
      })
      .catch(() => {
        if (cancelled) return;
        // Session gone or server down: fall back to the browser cart.
        signInSync.current = null;
        dispatch({ type: "hydrate", lines: readGuestCart() });
        setMode("guest");
        void refresh();
      });
    return () => {
      cancelled = true;
    };
  }, [status, userId, refresh]);

  // Save changes to wherever the cart lives.
  useEffect(() => {
    if (mode === "guest") {
      writeGuestCart(state);
    } else if (mode === "account") {
      const snapshot = JSON.stringify(state);
      if (snapshot === lastSaved.current) return;
      lastSaved.current = snapshot;
      writeChain.current = writeChain.current
        .then(() => cartRequest("PUT", state))
        .catch((err: { status?: number }) => {
          if (err.status === 401) void refresh();
        });
    }
  }, [state, mode, refresh]);

  const reload = useCallback(async () => {
    if (mode !== "account") return;
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const { lines } = (await res.json()) as { lines: CartLine[] };
      lastSaved.current = JSON.stringify(lines);
      dispatch({ type: "hydrate", lines });
    } catch {
      // keep what we have
    }
  }, [mode]);

  const value = useMemo<CartContextValue>(() => {
    const lines = state.flatMap((l) => {
      const product = getProduct(l.slug);
      return product ? [{ ...l, product }] : [];
    });
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((n, l) => n + l.qty * l.product.price, 0),
      ready: mode !== "pending",
      saved: mode === "account",
      add: (slug, qty) => dispatch({ type: "add", slug, qty }),
      setQty: (slug, qty) => dispatch({ type: "setQty", slug, qty }),
      remove: (slug) => dispatch({ type: "remove", slug }),
      clear: () => dispatch({ type: "clear" }),
      reload,
    };
  }, [state, mode, reload]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
