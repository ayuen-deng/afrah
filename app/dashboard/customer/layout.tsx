import type { Metadata } from "next";

import { CustomerShell } from "@/components/layouts/CustomerShell";

export const metadata: Metadata = {
  title: "Afrah Media — Customer",
};

export const dynamic = "force-dynamic";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerShell>{children}</CustomerShell>;
}
