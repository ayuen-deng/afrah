import type { Metadata } from "next";
import { cookies } from "next/headers";

import { CeoShell } from "@/components/layouts/CeoShell";
import { InternalStaffShell } from "@/components/layouts/InternalStaffShell";
import { SuperAdminShell } from "@/components/layouts/SuperAdminShell";

export const metadata: Metadata = {
  title: "Afrah Media — CEO",
};

export const dynamic = "force-dynamic";

export default function CeoLayout({ children }: { children: React.ReactNode }) {
  const role = cookies().get("role")?.value;
  if (role === "super_admin") {
    return <SuperAdminShell>{children}</SuperAdminShell>;
  }
  if (role === "internal_staff") {
    return <InternalStaffShell>{children}</InternalStaffShell>;
  }
  return <CeoShell>{children}</CeoShell>;
}
