"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BadgeDollarSign,
  FileText,
  GitBranch,
  LayoutDashboard,
  Target,
  Users,
} from "lucide-react";

import { mockLeads } from "@/lib/mockData";
import { type SidebarNavItem } from "@/components/ui/Sidebar";
import { AppShellFrame } from "@/components/layouts/AppShellFrame";
import { useToast } from "@/components/ui/Toast";

type Stage = "new" | "contacted" | "quoted" | "negotiating" | "won" | "lost";

type Lead = (typeof mockLeads)[number] & {
  stage: Stage;
  days_in_stage: number;
};

function readLeads(): Lead[] {
  try {
    const raw = window.localStorage.getItem("afrah_sales_leads");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Lead[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function seedLeadsIfMissing() {
  const existing = readLeads();
  if (existing.length) return;
  const seeded = (mockLeads as unknown as Lead[]).map((l) => ({ ...l }));
  window.localStorage.setItem("afrah_sales_leads", JSON.stringify(seeded));
  window.dispatchEvent(new Event("afrah_sales_leads_updated"));
}

function countActivePipeline() {
  const leads = readLeads();
  return leads.filter((l) => l.stage !== "won" && l.stage !== "lost").length;
}

function breadcrumbFromPath(pathname: string) {
  const mapping: Record<string, string> = {
    "/dashboard/sales": "Sales Dashboard",
    "/pipeline": "Pipeline",
    "/leads": "My Leads",
    "/clients": "My Clients",
    "/commission": "Commission",
    "/quotes": "Quotations",
  };

  if (mapping[pathname]) return ["Sales", mapping[pathname]];
  const base = Object.keys(mapping).find((p) => p !== "/" && pathname.startsWith(`${p}/`));
  if (base) return ["Sales", mapping[base] ?? "Details", "Details"];
  return ["Sales"];
}

export function SalesShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const [activeCount, setActiveCount] = React.useState(0);

  React.useEffect(() => {
    seedLeadsIfMissing();
    setActiveCount(countActivePipeline());
    const onUpdate = () => setActiveCount(countActivePipeline());
    window.addEventListener("afrah_sales_leads_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_sales_leads_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const items: SidebarNavItem[] = React.useMemo(
    () => [
      { href: "/dashboard/sales", label: "Sales Dashboard", icon: LayoutDashboard },
      { href: "/pipeline", label: "Pipeline", icon: GitBranch, badge: activeCount },
      { href: "/leads", label: "My Leads", icon: Target },
      { href: "/clients", label: "My Clients", icon: Users },
      { href: "/commission", label: "Commission", icon: BadgeDollarSign },
      { href: "/quotes", label: "Quotations", icon: FileText },
      { href: "/dashboard/sales/notifications", label: "Notifications", icon: Bell },
    ],
    [activeCount],
  );

  const breadcrumb = React.useMemo(() => breadcrumbFromPath(pathname), [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    showToast({
      type: "info",
      title: "Signed out",
      message: "You've been logged out.",
    });
    router.push("/login");
  };

  return (
    <AppShellFrame
      roleLabel="Sales"
      items={items}
      user={{ name: "Sales Executive", initials: "SE" }}
      breadcrumb={breadcrumb}
      onLogout={logout}
      onNotificationsClick={() =>
        showToast({
          type: "info",
          title: "Notifications",
          message: "No new notifications right now.",
        })
      }
    >
      {children}
    </AppShellFrame>
  );
}
