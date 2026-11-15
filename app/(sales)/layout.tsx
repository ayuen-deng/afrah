import type { Metadata } from "next";

import { SalesShell } from "@/components/layouts/SalesShell";

export const metadata: Metadata = {
  title: "Afrah Media — Sales",
};

export const dynamic = "force-dynamic";

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return <SalesShell>{children}</SalesShell>;
}
