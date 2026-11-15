import type { Metadata } from "next";
import { cookies } from "next/headers";

import { OperationsShell } from "@/components/layouts/OperationsShell";
import { InternalStaffShell } from "@/components/layouts/InternalStaffShell";

export const metadata: Metadata = {
  title: "Afrah Media — Operations",
};

export const dynamic = "force-dynamic";

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  const role = cookies().get("role")?.value;
  if (role === "internal_staff") {
    return <InternalStaffShell>{children}</InternalStaffShell>;
  }
  return <OperationsShell>{children}</OperationsShell>;
}
