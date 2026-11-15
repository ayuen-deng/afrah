"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  LineChart,
  MapPinned,
  Megaphone,
  Settings,
  ShieldCheck,
  Target,
} from "lucide-react";

import { ceoStore, getCeoDashboardStats } from "@/components/ceo/store";
import { type SidebarNavItem } from "@/components/ui/Sidebar";
import { AppShellFrame } from "@/components/layouts/AppShellFrame";
import { useToast } from "@/components/ui/Toast";

function breadcrumbFromPath(pathname: string) {
  if (pathname === "/dashboard/ceo") return ["CEO", "Executive Overview"];
  if (pathname.startsWith("/map")) return ["CEO", "Live Map"];
  if (pathname.startsWith("/approvals")) return ["CEO", "Approvals"];
  if (pathname.startsWith("/kpis")) return ["CEO", "KPI Tracker"];
  if (pathname.startsWith("/analytics")) return ["CEO", "Analytics"];
  if (pathname.startsWith("/announcements")) return ["CEO", "Announcements"];
  if (pathname.startsWith("/settings")) return ["CEO", "Settings"];
  return ["CEO"];
}

export function CeoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const [badges, setBadges] = React.useState({ offline: 0, approvals: 0 });

  React.useEffect(() => {
    ceoStore.seed();
    const refresh = () => {
      const stats = getCeoDashboardStats();
      setBadges({
        offline: ceoStore.readScreens().filter((screen) => screen.status === "offline").length,
        approvals: stats.pendingApprovals,
      });
    };
    refresh();
    window.addEventListener(ceoStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(ceoStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const items: SidebarNavItem[] = [
    { href: "/dashboard/ceo", label: "Executive Overview", icon: LayoutDashboard },
    { href: "/map", label: "Live Map", icon: MapPinned, badge: badges.offline },
    { href: "/approvals", label: "Approvals", icon: ShieldCheck, badge: badges.approvals },
    { href: "/kpis", label: "KPI Tracker", icon: Target },
    { href: "/analytics", label: "Analytics", icon: LineChart },
    { href: "/announcements", label: "Announcements", icon: Megaphone },
    { href: "/dashboard/ceo/notifications", label: "Notifications", icon: Bell, badge: badges.offline + badges.approvals },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const user = { name: "Demo Principal", initials: "DP" };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    showToast({ type: "info", title: "Signed out", message: "You have been logged out." });
    router.push("/login");
  };

  return (
    <AppShellFrame
      roleLabel="CEO"
      items={items}
      user={user}
      breadcrumb={breadcrumbFromPath(pathname)}
      onLogout={logout}
      onNotificationsClick={() =>
        showToast({ type: "info", title: "Notifications", message: "CEO notifications refreshed." })
      }
    >
      {children}
    </AppShellFrame>
  );
}
