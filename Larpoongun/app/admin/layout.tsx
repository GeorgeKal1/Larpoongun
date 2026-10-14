import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminBar } from "@/components/admin/AdminBar";
import { getAdmin } from "@/lib/server/admin-auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · LarpoonGun" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getAdmin();
  return (
    <div className="admin">
      {admin && <AdminBar username={admin} />}
      {children}
    </div>
  );
}
