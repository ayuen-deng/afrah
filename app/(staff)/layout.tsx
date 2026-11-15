import type { Metadata } from "next";
import { InternalStaffShell } from "@/components/layouts/InternalStaffShell";
export const metadata: Metadata = { title: "Afrah Media — Staff" };
export const dynamic = "force-dynamic";
export default function StaffLayout({ children }: { children: React.ReactNode }) { return <InternalStaffShell>{children}</InternalStaffShell>; }
