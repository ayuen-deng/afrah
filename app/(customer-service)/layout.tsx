import type { Metadata } from "next";
import { cookies } from "next/headers";

import { CustomerServiceShell } from "@/components/layouts/CustomerServiceShell";
import { SalesShell } from "@/components/layouts/SalesShell";

export const metadata: Metadata = {
  title: "Afrah Media — Customer Service",
};

export default function CustomerServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = cookies().get("role")?.value;
  if (role === "sales_executive") {
    return <SalesShell>{children}</SalesShell>;
  }
  return <CustomerServiceShell>{children}</CustomerServiceShell>;
}

