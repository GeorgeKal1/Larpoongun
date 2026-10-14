"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PublicUser } from "./types";

type Result = { error?: string };

interface AuthContextValue {
  user: PublicUser | null;
  /** "loading" until we've asked the server who is signed in. */
  status: "loading" | "ready";
  login: (email: string, password: string) => Promise<Result>;
  register: (name: string, email: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function postJson(url: string, payload: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, data };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as { user: PublicUser | null };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setStatus("ready");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(() => {
    const submit = async (url: string, payload: unknown): Promise<Result> => {
      try {
        const { ok, data } = await postJson(url, payload);
        if (!ok) return { error: typeof data.error === "string" ? data.error : "Something went wrong. Please try again." };
        setUser(data.user as PublicUser);
        return {};
      } catch {
        return { error: "Couldn't reach the server. Is it running?" };
      }
    };

    return {
      user,
      status,
      refresh,
      login: (email, password) => submit("/api/auth/login", { email, password }),
      register: (name, email, password) => submit("/api/auth/register", { name, email, password }),
      logout: async () => {
        await postJson("/api/auth/logout", {}).catch(() => undefined);
        setUser(null);
      },
    };
  }, [user, status, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
