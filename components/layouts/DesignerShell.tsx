"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  CheckCheck,
  Bell,
  LayoutDashboard,
  Library,
} from "lucide-react";

import {
  designerDefaultId,
  designerTaskEventName,
  getDesignerStats,
  seedDesignerTasksIfMissing,
} from "@/components/designer/store";
import { type SidebarNavItem } from "@/components/ui/Sidebar";
import { AppShellFrame } from "@/components/layouts/AppShellFrame";
import { useToast } from "@/components/ui/Toast";

function breadcrumbFromPath(pathname: string) {
  const mapping: Record<string, string> = {
    "/dashboard/designer": "My Tasks",
    "/tasks": "Task List",
    "/performance": "My Performance",
    "/resources": "Resources",
  };

  if (mapping[pathname]) return ["Designer", mapping[pathname]];
  const base = Object.keys(mapping).find((entry) => entry !== "/" && pathname.startsWith(`${entry}/`));
  if (base) return ["Designer", mapping[base] ?? "Details", "Details"];
  return ["Designer"];
}

export function DesignerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const [counts, setCounts] = React.useState(() => getDesignerStats(designerDefaultId));

  React.useEffect(() => {
    seedDesignerTasksIfMissing();
    const refresh = () => setCounts(getDesignerStats(designerDefaultId));
    refresh();
    window.addEventListener(designerTaskEventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(designerTaskEventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const items: SidebarNavItem[] = React.useMemo(
    () => [
      { href: "/dashboard/designer", label: "My Tasks", icon: LayoutDashboard },
      { href: "/tasks?status=in_progress", label: "In Progress", icon: BriefcaseBusiness, badge: counts.inProgress },
      { href: "/tasks?status=done", label: "Completed", icon: CheckCheck, badge: counts.done },
      { href: "/performance", label: "My Performance", icon: BarChart3 },
      { href: "/resources", label: "Resources", icon: Library },
      { href: "/dashboard/designer/notifications", label: "Notifications", icon: Bell },
    ],
    [counts.done, counts.inProgress],
  );

  const breadcrumb = React.useMemo(() => breadcrumbFromPath(pathname), [pathname]);
  const user = { name: "Brian Kato", initials: "BK" };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    showToast({ type: "info", title: "Signed out", message: "You have been logged out." });
    router.push("/login");
  };

  return (
    <AppShellFrame
      roleLabel="Designer"
      items={items}
      user={user}
      breadcrumb={breadcrumb}
      onLogout={logout}
      onNotificationsClick={() =>
        showToast({ type: "info", title: "Notifications", message: "No new notifications right now." })
      }
    >
      {children}
    </AppShellFrame>
  );
}
