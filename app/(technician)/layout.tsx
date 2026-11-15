import type { Metadata } from "next";
import { TechnicianShell } from "@/components/layouts/TechnicianShell";
export const metadata: Metadata = { title: "Afrah Media — Technician" };
export const dynamic = "force-dynamic";
export default function TechnicianLayout({ children }: { children: React.ReactNode }) { return <TechnicianShell>{children}</TechnicianShell>; }
