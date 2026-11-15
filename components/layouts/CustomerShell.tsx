"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart2,
  BadgeDollarSign,
  Bell,
  FileText,
  LayoutDashboard,
  MonitorPlay,
  Receipt,
  User,
} from "lucide-react";

import { type SidebarNavItem } from "@/components/ui/Sidebar";
import { AppShellFrame } from "@/components/layouts/AppShellFrame";
import { useToast } from "@/components/ui/Toast";

const customerNavItems: SidebarNavItem[] = [
  { href: "/dashboard/customer", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/customer/screens", label: "Browse Screens", icon: MonitorPlay },
  { href: "/dashboard/customer/campaigns", label: "My Campaigns", icon: FileText },
  { href: "/dashboard/customer/brand-assets", label: "Brand Assets", icon: BadgeDollarSign },
  { href: "/dashboard/customer/quotes", label: "Quotes", icon: Receipt },
  { href: "/dashboard/customer/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/customer/reports", label: "Reports", icon: BarChart2 },
  { href: "/dashboard/customer/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/customer/profile", label: "Profile", icon: User },
];

function readCustomerProfile(): { name: string; initials: string } {
  try {
    const raw = window.localStorage.getItem("afrah_customer_profile");
    if (!raw) return { name: "Sarah Nakato", initials: "SN" };
    const parsed = JSON.parse(raw) as { name?: string; initials?: string };
    const name = parsed.name?.trim() ? parsed.name : "Sarah Nakato";
    const initials = parsed.initials?.trim() ? parsed.initials : "SN";
    return { name, initials };
  } catch {
    return { name: "Sarah Nakato", initials: "SN" };
  }
}

function breadcrumbFromPath(pathname: string) {
  const base = "/dashboard/customer";
  if (!pathname.startsWith(base)) return ["Customer"];
  const rest = pathname.slice(base.length).split("/").filter(Boolean);

  const mapping: Record<string, string> = {
    screens: "Browse Screens",
    campaigns: "My Campaigns",
    "brand-assets": "Brand Assets",
    quotes: "Quotes",
    invoices: "Invoices",
    reports: "Reports",
    profile: "Profile",
    onboarding: "Onboarding",
  };

  const crumbs = ["Customer"];
  if (!rest.length) return [...crumbs, "Home"];

  rest.forEach((seg, idx) => {
    const label = mapping[seg] ?? (idx === rest.length - 1 ? "Details" : seg);
    crumbs.push(label);
  });
  return crumbs;
}

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = React.useState<{ name: string; initials: string }>({
    name: "Sarah Nakato",
    initials: "SN",
  });

  const breadcrumb = React.useMemo(() => breadcrumbFromPath(pathname), [pathname]);

  React.useEffect(() => {
    setUser(readCustomerProfile());

    const onUpdate = () => setUser(readCustomerProfile());
    window.addEventListener("afrah_profile_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_profile_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

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
      roleLabel="Customer"
      items={customerNavItems}
      user={user}
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
