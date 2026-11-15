"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { BellRing, BriefcaseBusiness, FileText, LayoutDashboard, Wrench } from "lucide-react";

import { readStaffAnnouncements, readStaffAssets, seedStaff, staffEvent } from "@/components/staff/store";
import { type SidebarNavItem } from "@/components/ui/Sidebar";
import { AppShellFrame } from "@/components/layouts/AppShellFrame";
import { useToast } from "@/components/ui/Toast";

const crumb = (p: string) =>
  p === "/dashboard/staff"
    ? ["Staff", "Home"]
    : p.startsWith("/leave")
      ? ["Staff", "My Leave"]
      : p.startsWith("/assets")
        ? ["Staff", "My Assets"]
        : p.startsWith("/payslips")
          ? ["Staff", "My Payslips"]
          : p.startsWith("/maintenance")
            ? ["Staff", "Maintenance Request"]
            : ["Staff", "Announcements"];

export function InternalStaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const [badges, setBadges] = React.useState({ leave: 1, assets: 2, ann: 1 });

  React.useEffect(() => {
    seedStaff();
    const refresh = () =>
      setBadges({
        leave: readStaffAssets().filter((a) => !a.acknowledged).length ? 1 : 0,
        assets: readStaffAssets().filter((a) => !a.acknowledged).length,
        ann: readStaffAnnouncements().filter((a) => !a.read).length,
      });
    refresh();
    window.addEventListener(staffEvent, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(staffEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const items: SidebarNavItem[] = [
    { href: "/dashboard/staff", label: "Home", icon: LayoutDashboard },
    { href: "/leave", label: "My Leave", icon: BriefcaseBusiness, badge: badges.leave },
    { href: "/assets", label: "My Assets", icon: Wrench, badge: badges.assets },
    { href: "/payslips", label: "My Payslips", icon: FileText },
    { href: "/maintenance", label: "Maintenance Request", icon: Wrench },
    { href: "/announcements", label: "Announcements", icon: BellRing, badge: badges.ann },
    { href: "/dashboard/staff/notifications", label: "Notifications", icon: BellRing, badge: badges.ann },
  ];

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    showToast({ type: "info", title: "Signed out", message: "You have been logged out." });
    router.push("/login");
  };

  return (
    <AppShellFrame
      roleLabel="Staff"
      items={items}
      user={{ name: "Joseph Okello", initials: "JO" }}
      breadcrumb={crumb(pathname)}
      onLogout={logout}
      onNotificationsClick={() =>
        showToast({ type: "info", title: "Announcements", message: "Staff notifications refreshed." })
      }
    >
      {children}
    </AppShellFrame>
  );
}
