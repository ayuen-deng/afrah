"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Blocks,
  Bell,
  FileClock,
  LayoutDashboard,
  PlugZap,
  Settings,
  Users,
} from "lucide-react";

import { type SidebarNavItem } from "@/components/ui/Sidebar";
import { AppShellFrame } from "@/components/layouts/AppShellFrame";
import { useToast } from "@/components/ui/Toast";

function breadcrumbFromPath(pathname: string) {
  if (pathname === "/super-admin") return ["Super Admin", "System Health"];
  if (pathname.startsWith("/users")) return ["Super Admin", "User Management"];
  if (pathname.startsWith("/flags")) return ["Super Admin", "Feature Flags"];
  if (pathname.startsWith("/audit")) return ["Super Admin", "Audit Logs"];
  if (pathname.startsWith("/settings")) return ["Super Admin", "Settings"];
  if (pathname.startsWith("/integrations")) return ["Super Admin", "Integrations"];
  return ["Super Admin"];
}

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const items: SidebarNavItem[] = [
    { href: "/super-admin", label: "System Health", icon: LayoutDashboard },
    { href: "/users", label: "User Management", icon: Users },
    { href: "/flags", label: "Feature Flags", icon: Blocks },
    { href: "/audit", label: "Audit Logs", icon: FileClock },
    { href: "/super-admin/notifications", label: "Notifications", icon: Bell },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/integrations", label: "Integrations", icon: PlugZap },
  ];

  const user = { name: "System Administrator", initials: "SA" };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    showToast({ type: "info", title: "Signed out", message: "Super admin session closed." });
    router.push("/login");
  };

  return (
    <AppShellFrame
      roleLabel="Super Admin"
      items={items}
      user={user}
      breadcrumb={breadcrumbFromPath(pathname)}
      onLogout={logout}
      onNotificationsClick={() =>
        showToast({ type: "info", title: "System notifications", message: "Latest platform alerts loaded." })
      }
      sidebarFooterExtra={
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to App
        </Link>
      }
    >
      {children}
    </AppShellFrame>
  );
}
