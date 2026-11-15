"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarClock,
  Bell,
  FileText,
  LayoutDashboard,
  MessagesSquare,
  Users,
  UserRound,
  ClipboardList,
} from "lucide-react";

import { mockQueries } from "@/lib/mockData";
import { type SidebarNavItem } from "@/components/ui/Sidebar";
import { AppShellFrame } from "@/components/layouts/AppShellFrame";
import { useToast } from "@/components/ui/Toast";

type Reminder = { id: string; due: string; done?: boolean };

function readReminders(): Reminder[] {
  try {
    const raw = window.localStorage.getItem("afrah_cs_reminders");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Reminder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function seedRemindersIfMissing() {
  const existing = readReminders();
  if (existing.length) return;
  const seed: Reminder[] = [
    { id: "rem-001", due: "04/04/2024 11:00", done: false },
    { id: "rem-002", due: "04/04/2024 16:00", done: false },
  ];
  window.localStorage.setItem("afrah_cs_reminders", JSON.stringify(seed));
}

function countDueReminders() {
  const reminders = readReminders();
  return reminders.filter((r) => !r.done).length;
}

function breadcrumbFromPath(pathname: string) {
  const mapping: Record<string, string> = {
    "/dashboard/customer-service": "Dashboard",
    "/queries": "Queries",
    "/visitors": "Visitor Log",
    "/quotes": "Quotations",
    "/book": "Book for Customer",
    "/customers": "Customers",
    "/reminders": "Reminders",
  };

  if (mapping[pathname]) return ["Customer Service", mapping[pathname]];

  const base = Object.keys(mapping).find((p) => p !== "/" && pathname.startsWith(`${p}/`));
  if (base) return ["Customer Service", mapping[base] ?? "Details", "Details"];
  return ["Customer Service"];
}

export function CustomerServiceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const [dueCount, setDueCount] = React.useState(0);

  const newQueriesCount = React.useMemo(
    () => mockQueries.filter((q) => q.status === "new").length,
    [],
  );

  React.useEffect(() => {
    seedRemindersIfMissing();
    setDueCount(countDueReminders());
    const onUpdate = () => setDueCount(countDueReminders());
    window.addEventListener("afrah_cs_reminders_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_cs_reminders_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const items: SidebarNavItem[] = React.useMemo(
    () => [
      { href: "/dashboard/customer-service", label: "Dashboard", icon: LayoutDashboard },
      { href: "/queries", label: "Queries", icon: MessagesSquare, badge: newQueriesCount },
      { href: "/visitors", label: "Visitor Log", icon: ClipboardList },
      { href: "/quotes", label: "Quotations", icon: FileText },
      { href: "/book", label: "Book for Customer", icon: CalendarClock },
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/dashboard/customer-service/notifications", label: "Notifications", icon: Bell, badge: dueCount + newQueriesCount },
      { href: "/reminders", label: "Reminders", icon: UserRound, badge: dueCount },
    ],
    [dueCount, newQueriesCount],
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
      roleLabel="Customer Service"
      items={items}
      user={{ name: "Diana Auma", initials: "DA" }}
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
