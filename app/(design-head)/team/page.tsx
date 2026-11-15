"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Star } from "lucide-react";

import { mockEmployees } from "@/lib/mockData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { hodStore, type HODTask } from "@/components/layouts/DesignHeadShell";
import { ClientOnly } from "@/components/utils/ClientOnly";

type DesignerRef = { id?: string; name?: string };

type DesignerRow = {
  id: string;
  name: string;
  photo: string;
  initials: string;
  skills: string[];
  active_tasks: number;
  due_today: number;
  overdue: number;
  ontime_rate: number;
  availability: "Available" | "Busy";
};

function computeRows(tasks: HODTask[]): DesignerRow[] {
  const designers = mockEmployees.filter((e) => e.dept === "Design");
  return designers.map((d) => {
    const active = tasks.filter((t) => {
      const ref = t.designer as unknown as DesignerRef;
      return ref?.id === d.id && t.status !== "done";
    });
    const dueToday = active.filter((t) => t.deadline === "04/04/2024").length;
    const overdue = active.filter((t) => t.deadline < "04/04/2024").length;
    const ontimeRate = (d as unknown as { ontime_rate?: number }).ontime_rate;
    const ontime = Math.round(typeof ontimeRate === "number" ? ontimeRate : 92);
    const availability = active.length >= 3 ? "Busy" : "Available";
    return {
      id: d.id,
      name: d.name,
      photo: d.photo,
      initials: d.initials ?? d.name.split(" ").map((p) => p[0]).join(""),
      skills: (d.skills ?? []) as string[],
      active_tasks: active.length,
      due_today: dueToday,
      overdue,
      ontime_rate: ontime,
      availability,
    };
  });
}

export default function TeamOverviewPage() {
  const { showToast } = useToast();

  const [tasks, setTasks] = React.useState<HODTask[]>([]);
  const [selected, setSelected] = React.useState<DesignerRow | null>(null);
  const [tab, setTab] = React.useState<"tasks" | "history" | "performance">("tasks");

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

  const rows = React.useMemo(() => computeRows(tasks), [tasks]);

  const columns: DataTableColumn<DesignerRow>[] = React.useMemo(
    () => [
      {
        key: "designer",
        header: "Designer",
        cell: (r) => (
          <div className="flex items-center gap-3">
            <img src={r.photo} alt={r.name} className="h-9 w-9 rounded-full object-cover" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-gray-900">{r.name}</div>
              <div className="mt-0.5 truncate text-xs text-gray-500">{r.skills.slice(0, 2).join(", ") || "—"}</div>
            </div>
          </div>
        ),
        className: "min-w-[280px]",
      },
      { key: "active", header: "Active Tasks", cell: (r) => <span className="text-sm font-semibold text-gray-900">{r.active_tasks}</span> },
      { key: "due", header: "Due Today", cell: (r) => <span className="text-sm text-gray-700">{r.due_today}</span> },
      { key: "over", header: "Overdue", cell: (r) => <span className="text-sm text-gray-700">{r.overdue}</span> },
      {
        key: "ontime",
        header: "On-Time",
        cell: (r) => (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-gray-900">{r.ontime_rate}%</span>
          </div>
        ),
      },
      {
        key: "availability",
        header: "Availability",
        cell: (r) => (
          <Badge variant={r.availability === "Available" ? "success" : "warning"} dot>
            {r.availability}
          </Badge>
        ),
      },
    ],
    [],
  );

  const perfChart = React.useMemo(() => {
    return [
      { label: "To Do", v: tasks.filter((t) => t.status === "to_do").length },
      { label: "In Progress", v: tasks.filter((t) => t.status === "in_progress").length },
      { label: "Review", v: tasks.filter((t) => t.status === "internal_review").length },
      { label: "Revisions", v: tasks.filter((t) => t.status === "revision_requested").length },
      { label: "Done", v: tasks.filter((t) => t.status === "done").length },
    ];
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Team Overview</div>
          <div className="mt-1 text-sm text-gray-600">
            Designers, workload, skills, and availability.
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => showToast({ type: "success", title: "Export ready", message: "Team export prepared successfully." })}
        >
          Export
        </Button>
      </div>

      <Card className="p-6">
        <DataTable<DesignerRow>
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={(r) => {
            setSelected(r);
            setTab("tasks");
          }}
          rowActions={(r) => [
            { label: "View profile", onClick: () => { setSelected(r); setTab("tasks"); } },
            { label: "Assign task", onClick: () => { window.localStorage.setItem("afrah_hod_create_task_prefill_designer", r.id); showToast({ type: "info", title: "Assign task", message: "Open Task Board to create a task for this designer." }); } },
          ]}
        />
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Designer Profile"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (!selected) return;
                window.localStorage.setItem("afrah_hod_create_task_prefill_designer", selected.id);
                showToast({ type: "info", title: "Assign task", message: "Open Task Board to create a task." });
              }}
            >
              Assign Task
            </Button>
          </>
        }
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <img src={selected.photo} alt={selected.name} className="h-16 w-16 rounded-2xl object-cover" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-lg font-semibold text-gray-900">{selected.name}</div>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 font-mono">{selected.id}</span>
                  <Badge variant="info">Design</Badge>
                </div>
                <div className="mt-1 text-sm text-gray-600">{selected.skills.join(", ") || "—"}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["tasks", "history", "performance"] as const).map((k) => {
                const active = tab === k;
                const label = k === "tasks" ? "Tasks" : k === "history" ? "History" : "Performance";
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className={["rounded-lg px-3 py-2 text-sm font-medium", active ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {tab === "tasks" ? (
              <div className="space-y-2">
                {tasks
                  .filter((t) => {
                    const ref = t.designer as unknown as DesignerRef;
                    return ref?.id === selected.id && t.status !== "done";
                  })
                  .slice(0, 6)
                  .map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{t.campaign}</div>
                        <div className="mt-1 text-xs text-gray-500 font-mono">{t.deadline}</div>
                      </div>
                      <Badge variant="info" dot>{t.status.replaceAll("_", " ")}</Badge>
                    </div>
                  ))}
                {tasks.some((t) => {
                  const ref = t.designer as unknown as DesignerRef;
                  return ref?.id === selected.id && t.status !== "done";
                }) ? null : (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No active tasks.</div>
                )}
              </div>
            ) : tab === "history" ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                History view is simulated.
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Performance chart</div>
                <div className="mt-4 h-[220px] w-full">
                  <ClientOnly>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={perfChart} margin={{ left: 4, right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} width={44} allowDecimals={false} />
                        <Tooltip formatter={(v) => String(v ?? 0)} />
                        <Bar dataKey="v" fill="#2563EB" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ClientOnly>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
