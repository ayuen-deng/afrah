import type { Metadata } from "next";

import { SuperAdminShell } from "@/components/layouts/SuperAdminShell";

export const metadata: Metadata = {
  title: "Afrah Media — Super Admin",
};

export const dynamic = "force-dynamic";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
