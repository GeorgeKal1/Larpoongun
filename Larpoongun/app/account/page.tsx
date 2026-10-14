import type { Metadata } from "next";
import { AccountView } from "@/components/AccountView";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; next?: string }>;
}) {
  const { mode, next } = await searchParams;
  // Only same-site paths, so ?next= can't bounce people to another website.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return <AccountView initialMode={mode === "register" ? "register" : "login"} next={safeNext} />;
}
