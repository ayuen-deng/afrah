import type { Metadata } from "next";
import { cookies } from "next/headers";

import { CeoShell } from "@/components/layouts/CeoShell";
import { FinanceShell } from "@/components/layouts/FinanceShell";

export const metadata: Metadata = {
  title: "Afrah Media — Finance",
};

export const dynamic = "force-dynamic";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const role = cookies().get("role")?.value;
  if (role === "ceo") {
    return <CeoShell>{children}</CeoShell>;
  }
  return <FinanceShell>{children}</FinanceShell>;
}
