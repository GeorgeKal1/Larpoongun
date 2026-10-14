"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { LogoMark } from "./Logo";

type Mode = "login" | "register";

export function AccountView({ initialMode, next }: { initialMode: Mode; next?: string }) {
  const { user, status } = useAuth();

  return (
    <div className="page">
      <div className="container">
        {status === "loading" ? (
          <p className="auth-loading">Loading…</p>
        ) : user ? (
          <Profile />
        ) : (
          <AuthForm initialMode={initialMode} next={next} />
        )}
      </div>
    </div>
  );
}

function Profile() {
  const { user, logout } = useAuth();
  const { count, subtotal, ready } = useCart();
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  return (
    <div className="auth-card">
      <div className="profile-head">
        <span className="avatar avatar-lg">{user.name.charAt(0).toUpperCase()}</span>
        <div>
          <h1>Hi, {user.name.split(" ")[0]}</h1>
          <p>{user.email}</p>
        </div>
      </div>
      <div className="profile-cart">
        <strong>Your saved cart</strong>
        <span>
          {!ready ? "Loading…" : count === 0 ? "Empty" : `${count} item${count === 1 ? "" : "s"} · ${formatPrice(subtotal)}`}
        </span>
        <p className="hint">Your cart is saved to your account, so it&apos;s still there next time you sign in.</p>
      </div>
      <div className="auth-actions">
        <Link href="/cart" className="btn btn-lg">
          View cart
        </Link>
        <Link href="/account/orders" className="btn btn-lg btn-ghost">
          Your orders
        </Link>
        <button
          type="button"
          className="btn btn-lg btn-ghost"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await logout();
            setBusy(false);
          }}
        >
          {busy ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}

function AuthForm({ initialMode, next }: { initialMode: Mode; next?: string }) {
  const { login, register } = useAuth();
  const { count } = useCart();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    if (mode === "register" && password !== form.get("confirm")) {
      setError("Passwords don't match.");
      return;
    }

    setBusy(true);
    setError(null);
    const result =
      mode === "login" ? await login(email, password) : await register(String(form.get("name") ?? ""), email, password);
    setBusy(false);

    if (result.error) setError(result.error);
    else if (next) router.push(next);
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
  }

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <LogoMark size={48} />
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p>
          {mode === "login"
            ? "Sign in to pick up your saved cart."
            : "An account keeps your cart saved between visits and devices."}
        </p>
      </div>

      <div className="auth-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => switchMode("login")}>
          Sign in
        </button>
        <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => switchMode("register")}>
          Register
        </button>
      </div>

      <form className="auth-form" onSubmit={onSubmit} key={mode}>
        {mode === "register" && (
          <label>
            Name
            <input name="name" required maxLength={80} autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        {mode === "register" && (
          <label>
            Confirm password
            <input name="confirm" type="password" required minLength={8} autoComplete="new-password" />
          </label>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {count > 0 && (
          <p className="hint">
            The {count} item{count === 1 ? "" : "s"} in your cart will be added to your account.
          </p>
        )}

        <button type="submit" className="btn btn-lg btn-block" disabled={busy}>
          {busy ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
