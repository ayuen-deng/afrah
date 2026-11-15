"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Bell,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Package,
  ScreenShare,
  UserCheck,
  UserCog,
  UserMinus,
  Users,
  WalletCards,
} from "lucide-react";

import { operationsStore } from "@/components/operations/store";
import { type SidebarNavItem } from "@/components/ui/Sidebar";
import { AppShellFrame } from "@/components/layouts/AppShellFrame";
import { useToast } from "@/components/ui/Toast";

function breadcrumbFromPath(pathname: string, tab: string | null) {
  if (pathname === "/dashboard/operations") return ["Operations", "Overview"];
  if (pathname === "/people") return ["Operations", "People", tab ? tab.replaceAll("-", " ") : "employees"];
  if (pathname.startsWith("/people/employees/")) return ["Operations", "People", "Employee Profile"];
  if (pathname.startsWith("/people/onboarding/")) return ["Operations", "People", "Onboarding Detail"];
  if (pathname.startsWith("/people/offboarding/")) return ["Operations", "People", "Offboarding Detail"];
  if (pathname === "/office") return ["Operations", "Office", tab ?? "inventory"];
  if (pathname === "/screens") return ["Operations", "Screen Assets", tab ?? "inventory"];
  if (pathname.startsWith("/assets/")) return ["Operations", "Asset Registry", "Asset Profile"];
  if (pathname === "/assets") return ["Operations", "Asset Registry", tab ?? "registry"];
  return ["Operations"];
}

export function OperationsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [counts, setCounts] = React.useState({ pending: 0, recruitment: 0, performance: 0, leave: 0, offline: 0 });

  React.useEffect(() => {
    operationsStore.seed();
    const refresh = () => {
      setCounts({
        pending: operationsStore.readEmployees().filter((employee) => employee.status === "onboarding").length,
        recruitment: operationsStore.readJobPositions().reduce(
          (total, position) =>
            total +
            position.applications.filter((application: { stage: string }) => application.stage === "applied").length,
          0,
        ),
        performance: operationsStore.readReviews().filter((review) => review.status === "overdue").length,
        leave: operationsStore.readLeaveRequests().filter((request) => request.status === "pending").length,
        offline: operationsStore.readScreenAssets().filter((screen) => screen.status === "offline").length,
      });
    };
    refresh();
    window.addEventListener(operationsStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(operationsStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const items: SidebarNavItem[] = React.useMemo(
    () => [
      { href: "/dashboard/operations", label: "Overview", icon: LayoutDashboard },
      { section: "People", href: "/people?tab=employees", label: "Employees", icon: Users, badge: counts.pending },
      { section: "People", href: "/people?tab=recruitment", label: "Recruitment", icon: UserCog, badge: counts.recruitment },
      { section: "People", href: "/people?tab=onboarding", label: "Onboarding", icon: UserCheck },
      { section: "People", href: "/people?tab=performance", label: "Performance", icon: ClipboardCheck, badge: counts.performance },
      { section: "People", href: "/people?tab=leave", label: "Leave", icon: CalendarDays, badge: counts.leave },
      { section: "People", href: "/people?tab=payroll", label: "Payroll & Compensation", icon: WalletCards },
      { section: "People", href: "/people?tab=training", label: "Training", icon: GraduationCap },
      { section: "People", href: "/people?tab=engagement", label: "Engagement", icon: HeartHandshake },
      { section: "People", href: "/people?tab=attendance", label: "Attendance", icon: CalendarDays },
      { section: "People", href: "/people?tab=offboarding", label: "Offboarding", icon: UserMinus },
      { section: "Operations", href: "/office?tab=inventory", label: "Office", icon: Building2 },
      { section: "Operations", href: "/screens?tab=inventory", label: "Screen Assets", icon: ScreenShare, badge: counts.offline },
      { section: "Operations", href: "/assets?tab=registry", label: "Asset Registry", icon: Package },
      { section: "Operations", href: "/dashboard/operations/notifications", label: "Notifications", icon: Bell, badge: counts.pending + counts.recruitment + counts.performance + counts.leave + counts.offline },
    ],
    [counts],
  );

  const breadcrumb = React.useMemo(
    () => breadcrumbFromPath(pathname, searchParams.get("tab")),
    [pathname, searchParams],
  );

  const user = { name: "Amara Nantongo", initials: "AN" };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    showToast({ type: "info", title: "Signed out", message: "You have been logged out." });
    router.push("/login");
  };

  return (
    <AppShellFrame
      roleLabel="Operations"
      items={items}
      user={user}
      breadcrumb={breadcrumb}
      onLogout={logout}
      onNotificationsClick={() =>
        showToast({ type: "info", title: "Notifications", message: "Operations notifications refreshed." })
      }
    >
      {children}
    </AppShellFrame>
  );
}
