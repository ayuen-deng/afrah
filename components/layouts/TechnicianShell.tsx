"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, Bell, ClipboardList, LayoutDashboard } from "lucide-react";

import { seedTech, stats, techEvent } from "@/components/technician/store";
import { type SidebarNavItem } from "@/components/ui/Sidebar";
import { AppShellFrame } from "@/components/layouts/AppShellFrame";
import { useToast } from "@/components/ui/Toast";

const crumb = (p: string) =>
  p === "/dashboard/technician"
    ? ["Technician", "My Tasks"]
    : p.startsWith("/tasks/")
      ? ["Technician", "Task Detail"]
      : p.startsWith("/history")
        ? ["Technician", "Task History"]
        : ["Technician", "Report Fault"];

export function TechnicianShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const [active, setActive] = React.useState(2);

  React.useEffect(() => {
    seedTech();
    const refresh = () => setActive(stats().active);
    refresh();
    window.addEventListener(techEvent, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(techEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const items: SidebarNavItem[] = [
    { href: "/dashboard/technician", label: "My Tasks", icon: LayoutDashboard, badge: active },
    { href: "/history", label: "Task History", icon: ClipboardList },
    { href: "/report", label: "Report Fault", icon: AlertTriangle },
    { href: "/dashboard/technician/notifications", label: "Notifications", icon: Bell, badge: active },
  ];

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    showToast({ type: "info", title: "Signed out", message: "You have been logged out." });
    router.push("/login");
  };

  return (
    <AppShellFrame
      roleLabel="Technician"
      items={items}
      user={{ name: "Patrick Oryema", initials: "PO" }}
      breadcrumb={crumb(pathname)}
      onLogout={logout}
      onNotificationsClick={() =>
        showToast({ type: "info", title: "Technician alerts", message: "Field alerts refreshed." })
      }
    >
      {children}
    </AppShellFrame>
  );
}
