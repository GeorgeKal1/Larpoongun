"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LogoMark } from "@/components/Logo";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Sign-in failed.");
    } catch {
      setError("Couldn't reach the server. Is it running?");
    }
    setBusy(false);
  }

  return (
    <div className="page">
      <div className="container">
        <div className="auth-card">
          <div className="auth-brand">
            <LogoMark size={48} />
            <span className="pay-provider">Admin</span>
            <h1>Staff sign in</h1>
            <p>Manage orders and payments.</p>
          </div>
          {!configured ? (
            <p className="form-error">
              Admin login isn&apos;t set up yet. Add <code>ADMIN_USERNAME</code> and <code>ADMIN_PASSWORD</code> to{" "}
              <code>.env.local</code> and restart the server.
            </p>
          ) : (
            <form className="auth-form" onSubmit={onSubmit}>
              <label>
                Username
                <input name="username" required autoComplete="username" autoFocus />
              </label>
              <label>
                Password
                <input name="password" type="password" required autoComplete="current-password" />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="btn btn-lg btn-block" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
