"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  ListChecks,
  Columns3,
  ClipboardCheck,
  RotateCcw,
  ListVideo,
  LayoutTemplate,
  Users,
} from "lucide-react";

import { mockAdQueue, mockEmployees, mockTasks } from "@/lib/mockData";
import { type SidebarNavItem } from "@/components/ui/Sidebar";
import { AppShellFrame } from "@/components/layouts/AppShellFrame";
import { useToast } from "@/components/ui/Toast";

type AdStatus = "pending_review" | "approved" | "rejected" | "auto_rejected";

export type HODAd = Omit<(typeof mockAdQueue)[number], "status"> & {
  status: AdStatus;
};

type TaskStatus =
  | "to_do"
  | "in_progress"
  | "internal_review"
  | "sent_to_client"
  | "revision_requested"
  | "done";

export type HODTask = Omit<(typeof mockTasks)[number], "status"> & {
  status: TaskStatus;
  revision_count?: number;
  client_notes?: string;
};

function readAds(): HODAd[] {
  try {
    const raw = window.localStorage.getItem("afrah_hod_ads");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HODAd[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAds(next: HODAd[]) {
  window.localStorage.setItem("afrah_hod_ads", JSON.stringify(next));
  window.dispatchEvent(new Event("afrah_hod_ads_updated"));
}

function readTasks(): HODTask[] {
  try {
    const raw = window.localStorage.getItem("afrah_hod_tasks");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HODTask[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTasks(next: HODTask[]) {
  window.localStorage.setItem("afrah_hod_tasks", JSON.stringify(next));
  window.dispatchEvent(new Event("afrah_hod_tasks_updated"));
}

function seedIfMissing() {
  if (!readAds().length) {
    type AdBase = Omit<HODAd, "status">;
    const base = mockAdQueue as unknown as AdBase[];
    const withStatus = (ad: AdBase, status: AdStatus): HODAd => ({ ...ad, status });
    const seeded: HODAd[] = [
      withStatus(base[0], "pending_review"),
      withStatus({ ...base[0], id: "ad-003" }, "pending_review"),
      withStatus(base[1], "pending_review"),
      withStatus({ ...base[0], id: "ad-004" }, "approved"),
    ];
    writeAds(seeded);
  }

  if (!readTasks().length) {
    type TaskBase = Omit<HODTask, "status">;
    const base = mockTasks as unknown as TaskBase[];
    const withStatus = (task: TaskBase, status: TaskStatus): HODTask => ({ ...task, status });
    const seeded: HODTask[] = [
      { ...withStatus(base[0], "in_progress"), revision_count: 0 },
      { ...withStatus(base[1], "done"), revision_count: 1 },
      {
        ...withStatus(
          {
            ...base[0],
            id: "task-003",
            campaign: "MTN Screen Takeover",
            customer: "James Mwesigwa",
            company: "MTN Uganda",
            complexity: "high",
            deadline: "08/04/2024",
          },
          "internal_review",
        ),
        id: "task-003",
        campaign: "MTN Screen Takeover",
        customer: "James Mwesigwa",
        company: "MTN Uganda",
        complexity: "high",
        deadline: "08/04/2024",
        revision_count: 0,
      },
      {
        ...withStatus(
          {
            ...base[1],
            id: "task-004",
            campaign: "Roofings Group Promo",
            customer: "Moses Kato",
            company: "Roofings Group",
            complexity: "low",
            deadline: "06/04/2024",
          },
          "revision_requested",
        ),
        id: "task-004",
        campaign: "Roofings Group Promo",
        customer: "Moses Kato",
        company: "Roofings Group",
        complexity: "low",
        deadline: "06/04/2024",
        revision_count: 2,
        client_notes: "Please increase logo size and reduce the text.",
      },
      {
        ...withStatus(
          {
            ...base[0],
            id: "task-005",
            campaign: "Garden City Retail Loop",
            customer: "Grace Atuhaire",
    company: "Café Javas",
            complexity: "low",
            deadline: "10/04/2024",
          },
          "to_do",
        ),
        id: "task-005",
        campaign: "Garden City Retail Loop",
        customer: "Grace Atuhaire",
    company: "Café Javas",
        complexity: "low",
        deadline: "10/04/2024",
        revision_count: 0,
      },
    ];
    writeTasks(seeded);
  }
}

function countPendingReview() {
  return readAds().filter((a) => a.status === "pending_review").length;
}

function countAIFLagged() {
  return readAds().filter((a) => a.ai_status === "flagged").length;
}

function countTasksBy(status: TaskStatus) {
  return readTasks().filter((t) => t.status === status).length;
}

function countOverdue() {
  const tasks = readTasks();
  return tasks.filter((t) => t.deadline < "04/04/2024" && t.status !== "done").length;
}

function countTeamAvailable() {
  const designers = mockEmployees.filter((e) => e.dept === "Design");
  const tasks = readTasks();
  const byDesigner = new Map<string, number>();
  tasks.forEach((t) => {
    const id = (t.designer as unknown as { id?: string })?.id;
    if (!id) return;
    byDesigner.set(id, (byDesigner.get(id) ?? 0) + (t.status === "done" ? 0 : 1));
  });
  return designers.filter((d) => (byDesigner.get(d.id) ?? 0) < 2).length;
}

function breadcrumbFromPath(pathname: string) {
  const mapping: Record<string, string> = {
    "/dashboard/design-head": "Design Operations",
    "/queue": "Review Queue",
    "/tasks": "Task Board",
    "/review": "Internal Review",
    "/revisions": "Client Revisions",
    "/playlists": "Screen Playlists",
    "/templates": "Templates",
    "/team": "Team Overview",
  };
  if (mapping[pathname]) return ["Design Head", mapping[pathname]];
  const base = Object.keys(mapping).find((p) => p !== "/" && pathname.startsWith(`${p}/`));
  if (base) return ["Design Head", mapping[base] ?? "Details", "Details"];
  return ["Design Head"];
}

export function DesignHeadShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const [pendingCount, setPendingCount] = React.useState(0);
  const [tasksPending, setTasksPending] = React.useState(0);

  React.useEffect(() => {
    seedIfMissing();
    const refresh = () => {
      setPendingCount(countPendingReview());
      setTasksPending(countTasksBy("to_do"));
    };
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("afrah_hod_ads_updated", onUpdate);
    window.addEventListener("afrah_hod_tasks_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_hod_ads_updated", onUpdate);
      window.removeEventListener("afrah_hod_tasks_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const items: SidebarNavItem[] = React.useMemo(
    () => [
      { href: "/dashboard/design-head", label: "Design Operations", icon: LayoutDashboard },
      { href: "/queue", label: "Review Queue", icon: ListChecks, badge: pendingCount },
      { href: "/tasks", label: "Task Board", icon: Columns3, badge: tasksPending },
      { href: "/review", label: "Internal Review", icon: ClipboardCheck },
      { href: "/revisions", label: "Client Revisions", icon: RotateCcw },
      { href: "/playlists", label: "Screen Playlists", icon: ListVideo },
      { href: "/templates", label: "Templates", icon: LayoutTemplate },
      { href: "/team", label: "Team Overview", icon: Users },
      { href: "/dashboard/design-head/notifications", label: "Notifications", icon: Bell, badge: pendingCount + tasksPending },
    ],
    [pendingCount, tasksPending],
  );

  const breadcrumb = React.useMemo(() => breadcrumbFromPath(pathname), [pathname]);
  const user = { name: "Head of Design", initials: "HD" };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    showToast({ type: "info", title: "Signed out", message: "You've been logged out." });
    router.push("/login");
  };

  return (
    <AppShellFrame
      roleLabel="Design Head"
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

export const hodStore = {
  seedIfMissing,
  readAds,
  writeAds,
  readTasks,
  writeTasks,
  countPendingReview,
  countAIFLagged,
  countTasksBy,
  countOverdue,
  countTeamAvailable,
};
