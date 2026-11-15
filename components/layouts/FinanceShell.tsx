"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Bell,
  FileSpreadsheet,
  LayoutDashboard,
  Receipt,
  RefreshCcw,
  ScrollText,
  Wallet,
  WalletCards,
} from "lucide-react";

import { financeStore } from "@/components/finance/store";
import { type SidebarNavItem } from "@/components/ui/Sidebar";
import { AppShellFrame } from "@/components/layouts/AppShellFrame";
import { useToast } from "@/components/ui/Toast";

function breadcrumbFromPath(pathname: string) {
  if (pathname === "/dashboard/finance") return ["Finance", "Dashboard"];
  if (pathname.startsWith("/invoices/new")) return ["Finance", "Invoices", "Create Invoice"];
  if (pathname.startsWith("/invoices")) return ["Finance", "Invoices"];
  if (pathname.startsWith("/payments")) return ["Finance", "Payments"];
  if (pathname.startsWith("/expenses")) return ["Finance", "Expenses"];
  if (pathname.startsWith("/petty-cash")) return ["Finance", "Petty Cash"];
  if (pathname.startsWith("/payroll")) return ["Finance", "Payroll"];
  if (pathname.startsWith("/quickbooks")) return ["Finance", "QuickBooks Sync"];
  if (pathname.startsWith("/reports")) return ["Finance", "Reports"];
  return ["Finance"];
}

export function FinanceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const [counts, setCounts] = React.useState({ invoices: 0 });

  React.useEffect(() => {
    financeStore.seed();
    const refresh = () => {
      const invoices = financeStore.readInvoices();
      setCounts({
        invoices: invoices.filter((invoice) => invoice.status === "unpaid" || invoice.status === "overdue").length,
      });
    };
    refresh();
    window.addEventListener(financeStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(financeStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const items: SidebarNavItem[] = [
    { href: "/dashboard/finance", label: "Dashboard", icon: LayoutDashboard },
    { href: "/invoices", label: "Invoices", icon: Receipt, badge: counts.invoices },
    { href: "/payments", label: "Payments", icon: WalletCards },
    { href: "/expenses", label: "Expenses", icon: Wallet },
    { href: "/petty-cash", label: "Petty Cash", icon: ArrowLeftRight },
    { href: "/payroll", label: "Payroll", icon: ScrollText },
    { href: "/quickbooks", label: "QuickBooks Sync", icon: RefreshCcw },
    { href: "/reports", label: "Reports", icon: FileSpreadsheet },
    { href: "/dashboard/finance/notifications", label: "Notifications", icon: Bell, badge: counts.invoices },
  ];

  const user = { name: "Fatuma Namutebi", initials: "FN" };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    showToast({ type: "info", title: "Signed out", message: "You have been logged out." });
    router.push("/login");
  };

  return (
    <AppShellFrame
      roleLabel="Finance"
      items={items}
      user={user}
      breadcrumb={breadcrumbFromPath(pathname)}
      onLogout={logout}
      onNotificationsClick={() =>
        showToast({ type: "info", title: "Notifications", message: "Finance notifications refreshed." })
      }
    >
      {children}
    </AppShellFrame>
  );
}
