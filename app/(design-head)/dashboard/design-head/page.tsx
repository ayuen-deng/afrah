"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  Clock,
  FileWarning,
  Sparkles,
  UserPlus,
} from "lucide-react";

import { mockEmployees } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { hodStore, type HODTask } from "@/components/layouts/DesignHeadShell";
import { ClientOnly } from "@/components/utils/ClientOnly";

type TabKey = "tasks" | "history" | "performance";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

type DesignerRef = {
  id?: string;
  name?: string;
  ontime_rate?: number;
};

function workloadFor(designerId: string, tasks: HODTask[]) {
  const active = tasks.filter((t) => {
    const d = t.designer as unknown as DesignerRef;
    return d?.id === designerId && t.status !== "done";
  });
  const inProgress = active.filter((t) => t.status === "in_progress").length;
  const total = Math.max(1, active.length);
  const pct = clamp01((inProgress + 0.5) / (total + 1));
  return { active, count: active.length, pct };
}

export default function DesignHeadHomePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [tasks, setTasks] = React.useState<HODTask[]>([]);
  const [profileOpenFor, setProfileOpenFor] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<TabKey>("tasks");

  React.useEffect(() => {
    hodStore.seedIfMissing();
    setTasks(hodStore.readTasks());
    const onUpdate = () => setTasks(hodStore.readTasks());
    window.addEventListener("afrah_hod_tasks_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_hod_tasks_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const designers = React.useMemo(
    () => mockEmployees.filter((e) => e.dept === "Design"),
    [],
  );

  const stats = {
    pendingReview: hodStore.countPendingReview(),
    aiFlagged: hodStore.countAIFLagged(),
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    overdue: tasks.filter((t) => t.deadline < "04/04/2024" && t.status !== "done").length,
    available: hodStore.countTeamAvailable(),
  };

  const notifications = React.useMemo(
    () => [
      {
        id: "n-001",
        title: "AI flagged a video submission",
        body: "Third-party logo detected — please review before approval.",
        type: "warning" as const,
      },
      {
        id: "n-002",
        title: "Internal review pending",
        body: "MTN Screen Takeover needs final approval before sending to client.",
        type: "info" as const,
      },
      {
        id: "n-003",
        title: "New booking requires creative",
        body: "Pearl Dairy campaign deadline approaching.",
        type: "important" as const,
      },
    ],
    [],
  );

  const chartData = React.useMemo(() => {
    const labels = [
      { k: "to_do", label: "To Do" },
      { k: "in_progress", label: "In Progress" },
      { k: "internal_review", label: "Internal Review" },
      { k: "sent_to_client", label: "Sent" },
      { k: "revision_requested", label: "Revisions" },
      { k: "done", label: "Done" },
    ] as const;

    return labels.map((l) => ({
      name: l.label,
      count: tasks.filter((t) => t.status === l.k).length,
    }));
  }, [tasks]);

  const selectedDesigner = React.useMemo(() => {
    if (!profileOpenFor) return null;
    return designers.find((d) => d.id === profileOpenFor) ?? null;
  }, [designers, profileOpenFor]);

  const selectedWorkload = React.useMemo(() => {
    if (!selectedDesigner) return null;
    return workloadFor(selectedDesigner.id, tasks);
  }, [selectedDesigner, tasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Design Operations</div>
          <div className="mt-1 text-sm text-gray-600">
            Review queue, task flow, and team workload.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              showToast({
                type: "success",
                title: "Export ready",
                message: "Design operations export prepared successfully.",
              })
            }
          >
            Export
          </Button>
          <Button onClick={() => router.push("/queue")}>Open Review Queue</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <button type="button" onClick={() => router.push("/queue")} className="text-left">
          <StatCard
            icon={Clock}
            iconColorClassName="text-warning bg-amber-100"
            value={stats.pendingReview}
            label="Pending Review"
            trend={{ value: "+12.5%", direction: "up" }}
          />
        </button>
        <button type="button" onClick={() => router.push("/queue")} className="text-left">
          <StatCard
            icon={FileWarning}
            iconColorClassName="text-warning bg-amber-100"
            value={stats.aiFlagged}
            label="AI Flagged"
            trend={{ value: "+3.0%", direction: "up" }}
          />
        </button>
        <button type="button" onClick={() => router.push("/tasks")} className="text-left">
          <StatCard
            icon={Sparkles}
            iconColorClassName="text-primary bg-blue-100"
            value={stats.inProgress}
            label="Tasks In Progress"
            trend={{ value: "+5.2%", direction: "up" }}
          />
        </button>
        <button type="button" onClick={() => router.push("/tasks")} className="text-left">
          <StatCard
            icon={AlertTriangle}
            iconColorClassName="text-error bg-red-100"
            value={stats.overdue}
            label="Tasks Overdue"
            trend={{ value: "-1.0%", direction: "down" }}
          />
        </button>
        <button type="button" onClick={() => router.push("/team")} className="text-left">
          <StatCard
            icon={UserPlus}
            iconColorClassName="text-success bg-green-100"
            value={stats.available}
            label="Team Available"
            trend={{ value: "+2.0%", direction: "up" }}
          />
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[18px] font-semibold text-gray-800">Designer workload</div>
              <div className="mt-1 text-sm text-gray-600">
                Click a designer to view profile. Assign tasks instantly.
              </div>
            </div>
            <Button variant="secondary" onClick={() => router.push("/tasks")}>
              Assign Task
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            {designers.map((d) => {
              const w = workloadFor(d.id, tasks);
              const pct = Math.round(w.pct * 100);
              const barColor =
                w.count >= 3 ? "bg-amber-400" : w.count >= 2 ? "bg-blue-500" : "bg-green-500";
              return (
                <div
                  key={d.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpenFor(d.id);
                      setTab("tasks");
                    }}
                    className="flex items-center gap-3 text-left"
                  >
                    <img
                      src={d.photo}
                      alt={d.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-gray-900">{d.name}</div>
                      <div className="mt-0.5 text-xs text-gray-500">{w.count} active task(s)</div>
                    </div>
                  </button>

                  <div className="flex flex-1 items-center gap-3 sm:justify-end">
                    <div className="w-full max-w-[280px]">
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{pct}% load</div>
                    </div>
                    <Button
                      onClick={() => {
                        window.localStorage.setItem(
                          "afrah_hod_create_task_prefill_designer",
                          d.id,
                        );
                        router.push("/tasks");
                        showToast({
                          type: "info",
                          title: "Assign task",
                          message: `Opening Task Board with ${d.first ?? d.name} pre-selected.`,
                        });
                      }}
                    >
                      Assign Task
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Notifications</div>
          <div className="mt-1 text-sm text-gray-600">Latest updates and alerts.</div>
          <div className="mt-6 space-y-3">
            {notifications.map((n) => {
              const border =
                n.type === "important"
                  ? "border-blue-200 bg-blue-50"
                  : n.type === "warning"
                    ? "border-amber-200 bg-amber-50"
                    : "border-gray-200 bg-white";
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() =>
                    showToast({
                      type: n.type === "warning" ? "error" : "info",
                      title: n.title,
                      message: n.body,
                    })
                  }
                  className={`w-full rounded-xl border p-4 text-left hover:bg-gray-50 ${border}`}
                >
                  <div className="text-sm font-semibold text-gray-900">{n.title}</div>
                  <div className="mt-1 text-sm text-gray-600">{n.body}</div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[18px] font-semibold text-gray-800">Task pipeline snapshot</div>
            <div className="mt-1 text-sm text-gray-600">Counts by workflow stage.</div>
          </div>
          <Button variant="secondary" onClick={() => router.push("/tasks")}>
            Open Board
          </Button>
        </div>
        <div className="mt-6 h-[260px] w-full">
          <ClientOnly>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 4, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={44} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
                  formatter={(value) => String(value ?? 0)}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ClientOnly>
        </div>
      </Card>

      <Modal
        open={Boolean(profileOpenFor)}
        onClose={() => setProfileOpenFor(null)}
        title="Designer Profile"
        footer={
          <>
            <Button variant="secondary" onClick={() => setProfileOpenFor(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (!selectedDesigner) return;
                window.localStorage.setItem("afrah_hod_create_task_prefill_designer", selectedDesigner.id);
                router.push("/tasks");
                showToast({ type: "info", title: "Assign task", message: "Opening Task Board…" });
                setProfileOpenFor(null);
              }}
            >
              Assign Task
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-4">
          <img
            src={selectedDesigner?.photo ?? ""}
            alt={selectedDesigner?.name ?? "Designer"}
            className="h-16 w-16 rounded-2xl object-cover"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-lg font-semibold text-gray-900">{selectedDesigner?.name}</div>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 font-mono">
                {selectedDesigner?.employee_id ?? selectedDesigner?.id}
              </span>
              <Badge variant="info">Design</Badge>
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {selectedDesigner?.position ?? "Designer"} • {formatUGX(selectedDesigner?.salary ?? 0)}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Active Tasks
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{selectedWorkload?.count ?? 0}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              On-Time
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {Math.round(((selectedDesigner as unknown as DesignerRef)?.ontime_rate ?? 92))}%
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Rating
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {String(selectedDesigner?.performance_rating ?? 4.1)}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(["tasks", "history", "performance"] as const).map((k) => {
            const active = tab === k;
            const label = k === "tasks" ? "Tasks" : k === "history" ? "History" : "Performance";
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  active ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>

        {tab === "tasks" ? (
          <div className="mt-5 space-y-2">
            {(selectedWorkload?.active ?? []).slice(0, 6).map((t) => (
              <button
                key={t.id}
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left hover:bg-gray-50"
                onClick={() => {
                  window.localStorage.setItem("afrah_hod_task_focus_id", t.id);
                  router.push("/tasks");
                  showToast({ type: "info", title: "Task", message: "Opening task detail…" });
                  setProfileOpenFor(null);
                }}
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900">{t.campaign}</div>
                  <div className="mt-1 text-xs text-gray-500">{t.company}</div>
                </div>
                <Badge variant={t.status === "done" ? "success" : "info"} dot>
                  {t.status.replaceAll("_", " ")}
                </Badge>
              </button>
            ))}
            {(selectedWorkload?.active ?? []).length ? null : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                No active tasks.
              </div>
            )}
          </div>
        ) : tab === "history" ? (
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            History view is simulated for now — use Task Board for full details.
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-gray-900">Performance snapshot</div>
              <Badge variant="success" dot>
                On track
              </Badge>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              On-time rate and workload are within expected thresholds.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
