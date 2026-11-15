"use client";

import * as React from "react";
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, SlidersHorizontal } from "lucide-react";

import { mockEmployees } from "@/lib/mockData";
import { DesignerTasksPage } from "@/components/designer/DesignerTasksPage";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { hodStore, type HODTask } from "@/components/layouts/DesignHeadShell";

type View = "kanban" | "list";
type Status = HODTask["status"];

function readRole() {
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("role="));
  return cookie?.split("=")[1] ?? "";
}

const statusOrder: Status[] = [
  "to_do",
  "in_progress",
  "internal_review",
  "sent_to_client",
  "revision_requested",
  "done",
];

const statusLabel: Record<Status, string> = {
  to_do: "To Do",
  in_progress: "In Progress",
  internal_review: "Internal Review",
  sent_to_client: "Sent to Client",
  revision_requested: "Revision Requested",
  done: "Done",
};

function statusVariant(status: Status) {
  if (status === "done") return "success" as const;
  if (status === "revision_requested") return "warning" as const;
  if (status === "internal_review") return "info" as const;
  if (status === "sent_to_client") return "info" as const;
  if (status === "in_progress") return "info" as const;
  return "neutral" as const;
}

function readTasks() {
  return hodStore.readTasks();
}
function writeTasks(next: HODTask[]) {
  hodStore.writeTasks(next);
}
function readAds() {
  return hodStore.readAds();
}

type DesignerRef = { name?: string };

function DroppableColumn({
  id,
  title,
  count,
  children,
}: {
  id: Status;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="min-w-[300px]">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <Badge variant="neutral">{count}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={[
          "mt-3 min-h-[160px] rounded-xl border border-gray-200 bg-white p-3",
          isOver ? "ring-2 ring-primary/20" : "",
        ].join(" ")}
      >
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

function TaskCard({ task, onClick }: { task: HODTask; onClick: () => void }) {
  const draggableId = `task:${task.id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
  });
  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {};

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={[
        "w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:bg-gray-50",
        isDragging ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-900">{task.campaign}</div>
          <div className="mt-1 text-xs text-gray-500">
            {task.company} • {task.screen}
          </div>
        </div>
        <Badge variant={statusVariant(task.status)} dot>
          {statusLabel[task.status]}
        </Badge>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
          {task.complexity}
        </span>
        <span className="text-xs text-gray-500 font-mono">{task.deadline}</span>
      </div>
    </button>
  );
}

const createSchema = z.object({
  ad_id: z.string().min(2, "Select an approved ad."),
  designer_id: z.string().min(2, "Select a designer."),
  campaign: z.string().min(2, "Campaign is required."),
  company: z.string().min(2, "Company is required."),
  screen: z.string().min(2, "Screen is required."),
  complexity: z.enum(["low", "high"]),
  deadline: z.string().min(8, "Deadline is required."),
});
type CreateValues = z.infer<typeof createSchema>;

export default function TaskBoardPage() {
  const [role, setRole] = React.useState<string | null>(null);
  const { showToast } = useToast();

  const [view, setView] = React.useState<View>("kanban");
  const [tasks, setTasks] = React.useState<HODTask[]>([]);
  const [ads, setAds] = React.useState(readAds());
  const [search, setSearch] = React.useState("");

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createStep, setCreateStep] = React.useState(1);
  const [saving, setSaving] = React.useState(false);

  const [active, setActive] = React.useState<HODTask | null>(null);
  const [panelTab, setPanelTab] = React.useState<"brief" | "files" | "messages">("brief");

  React.useEffect(() => {
    setRole(readRole());
  }, []);

  const designers = React.useMemo(() => mockEmployees.filter((e) => e.dept === "Design"), []);
  const approvedAds = React.useMemo(() => ads.filter((a) => a.status === "approved"), [ads]);

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      ad_id: "",
      designer_id: "",
      campaign: "",
      company: "",
      screen: "",
      complexity: "low",
      deadline: "09/04/2024",
    },
  });

  React.useEffect(() => {
    hodStore.seedIfMissing();
    setTasks(readTasks());
    setAds(readAds());
    const onUpdate = () => setTasks(readTasks());
    const onAdsUpdate = () => setAds(readAds());
    window.addEventListener("afrah_hod_tasks_updated", onUpdate);
    window.addEventListener("afrah_hod_ads_updated", onAdsUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_hod_tasks_updated", onUpdate);
      window.removeEventListener("afrah_hod_ads_updated", onAdsUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  React.useEffect(() => {
    const focusId = window.localStorage.getItem("afrah_hod_task_focus_id");
    if (!focusId) return;
    window.localStorage.removeItem("afrah_hod_task_focus_id");
    const t = readTasks().find((x) => x.id === focusId) ?? null;
    if (t) {
      setActive(t);
      setPanelTab("brief");
    }
  }, [tasks]);

  React.useEffect(() => {
    const prefillDesigner = window.localStorage.getItem("afrah_hod_create_task_prefill_designer");
    const prefillAd = window.localStorage.getItem("afrah_hod_create_task_prefill_ad_id");
    if (prefillDesigner) form.setValue("designer_id", prefillDesigner);
    if (prefillAd) form.setValue("ad_id", prefillAd);
    if (prefillDesigner || prefillAd) {
      window.localStorage.removeItem("afrah_hod_create_task_prefill_designer");
      window.localStorage.removeItem("afrah_hod_create_task_prefill_ad_id");
      setCreateOpen(true);
      setCreateStep(1);
      showToast({ type: "info", title: "Create task", message: "Prefilled from previous action." });
    }
  }, [form, showToast]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.campaign.toLowerCase().includes(q) ||
        t.company.toLowerCase().includes(q) ||
        t.screen.toLowerCase().includes(q),
    );
  }, [search, tasks]);

  const grouped = React.useMemo(() => {
    const base: Record<Status, HODTask[]> = {
      to_do: [],
      in_progress: [],
      internal_review: [],
      sent_to_client: [],
      revision_requested: [],
      done: [],
    };
    filtered.forEach((t) => base[t.status].push(t));
    return base;
  }, [filtered]);

  function moveTask(taskId: string, nextStatus: Status) {
    const next = readTasks().map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t));
    writeTasks(next);
    showToast({ type: "success", title: "Moved", message: `Task moved to ${statusLabel[nextStatus]}.` });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active: drag, over } = event;
    if (!over) return;
    const dragId = String(drag.id);
    if (!dragId.startsWith("task:")) return;
    const taskId = dragId.replace("task:", "");
    moveTask(taskId, String(over.id) as Status);
  }

  function openTask(t: HODTask) {
    setActive(t);
    setPanelTab("brief");
  }

  async function createTask(values: CreateValues) {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 1100));
      const designer = designers.find((d) => d.id === values.designer_id);
      const ad = approvedAds.find((a) => a.id === values.ad_id) ?? undefined;
      const nextTask: HODTask = {
        id: `task-${String(Date.now()).slice(-6)}`,
        campaign: values.campaign,
        customer: ad?.customer ?? "—",
        company: values.company,
        designer: {
          id: designer?.id ?? values.designer_id,
          name: designer?.name ?? "Designer",
          initials: String(designer?.initials ?? "DS"),
          color: String(designer?.color ?? "bg-blue-500"),
          active_tasks: 0,
          ontime_rate: 92,
          skills: (designer?.skills ?? []) as string[],
        },
        screen: values.screen,
        dimensions: ad?.resolution ?? "1920×1080",
        complexity: values.complexity,
        deadline: values.deadline,
        status: "to_do",
        instructions: "Create and submit for internal review.",
        brief: {
          goal: "Customer-ready ad creative",
          audience: "Kampala viewers",
          message: "High-impact billboard creative",
          tone: "professional",
          colors: ["#2563EB", "#FFFFFF"],
          avoid: "Overcrowded text",
          notes: "Keep message short and bold.",
        },
        brand_assets: [],
        files: [],
        messages: [],
      };
      writeTasks([nextTask, ...readTasks()]);
      showToast({ type: "success", title: "Created", message: "Task added to To Do." });
      setCreateOpen(false);
      setCreateStep(1);
      form.reset();
    } finally {
      setSaving(false);
    }
  }

  const createFooter = (
    <>
      <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={saving}>
        Cancel
      </Button>
      <Button variant="secondary" onClick={() => setCreateStep((s) => Math.max(1, s - 1))} disabled={saving || createStep === 1}>
        Back
      </Button>
      <Button
        loading={saving}
        onClick={async () => {
          if (createStep < 3) {
            setCreateStep((s) => s + 1);
            return;
          }
          await form.handleSubmit(createTask)();
        }}
      >
        {createStep < 3 ? "Next" : "Create Task"}
      </Button>
    </>
  );

  if (role === null) {
    return (
      <Card className="p-6">
        <div className="text-sm text-gray-600">Loading task workspace...</div>
      </Card>
    );
  }

  if (role === "designer") {
    return <DesignerTasksPage />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Task Board</div>
          <div className="mt-1 text-sm text-gray-600">
            Kanban + list view. Drag cards between columns (dnd-kit).
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => showToast({ type: "success", title: "Export ready", message: "Task board export prepared successfully." })}
          >
            Export
          </Button>
          <Button
            onClick={() => {
              setCreateOpen(true);
              setCreateStep(1);
            }}
          >
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView("kanban")}
              className={[
                "rounded-md px-3 py-1.5 text-sm font-medium",
                view === "kanban" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              Board
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={[
                "rounded-md px-3 py-1.5 text-sm font-medium",
                view === "list" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              Workflow
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button
              variant="secondary"
              onClick={() => showToast({ type: "info", title: "Filter", message: "Filter and sort controls are simulated." })}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
      </Card>

      {view === "kanban" ? (
        <DndContext onDragEnd={onDragEnd}>
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-2">
              {statusOrder.map((s) => (
                <DroppableColumn key={s} id={s} title={statusLabel[s]} count={grouped[s].length}>
                  {grouped[s].map((t) => (
                    <TaskCard key={t.id} task={t} onClick={() => openTask(t)} />
                  ))}
                </DroppableColumn>
              ))}
            </div>
          </div>
        </DndContext>
      ) : (
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Tasks List</div>
          <div className="mt-6">
            <DataTable<HODTask>
              data={filtered}
              rowKey={(t) => t.id}
              onRowClick={(t) => openTask(t)}
              columns={[
                { key: "campaign", header: "Campaign", cell: (t) => <div><div className="text-sm font-semibold text-gray-900">{t.campaign}</div><div className="text-xs text-gray-500">{t.company}</div></div>, className: "min-w-[260px]" },
                { key: "designer", header: "Designer", cell: (t) => {
                  const d = t.designer as unknown as DesignerRef;
                  return <span className="text-sm text-gray-700">{d?.name ?? "—"}</span>;
                } },
                { key: "deadline", header: "Deadline", cell: (t) => <span className="font-mono text-sm text-gray-700">{t.deadline}</span> },
                { key: "status", header: "Status", cell: (t) => <Badge variant={statusVariant(t.status)} dot>{statusLabel[t.status]}</Badge> },
              ]}
            />
          </div>
        </Card>
      )}

      <AnimatePresence>
        {active ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50">
            <button type="button" className="absolute inset-0 bg-black/30 backdrop-blur-sm" aria-label="Close panel" onClick={() => setActive(null)} />
            <motion.div
              initial={{ x: 520 }}
              animate={{ x: 0 }}
              exit={{ x: 520 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-0 h-full w-full max-w-[520px] overflow-y-auto bg-white shadow-2xl"
            >
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold text-gray-900">{active.campaign}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      {active.company} • {active.screen} • <span className="font-mono">{active.deadline}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setActive(null)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Close
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {(["brief", "files", "messages"] as const).map((k) => {
                    const activeTab = panelTab === k;
                    const label = k === "brief" ? "Brief" : k === "files" ? "Files" : "Messages";
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setPanelTab(k)}
                        className={["rounded-lg px-3 py-2 text-sm font-medium", activeTab ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"].join(" ")}
                      >
                        {label}
                      </button>
                    );
                  })}
                  <Badge variant={statusVariant(active.status)} dot>
                    {statusLabel[active.status]}
                  </Badge>
                </div>
              </div>

              <div className="p-6">
                {panelTab === "brief" ? (
                  <div className="space-y-4">
                    <Card className="p-5">
                      <div className="text-[18px] font-semibold text-gray-800">Brief</div>
                      <div className="mt-3 text-sm text-gray-700">
                        <div className="rounded-xl border border-gray-200 bg-blue-50 p-4 text-blue-900">
                          {active.instructions ?? "No additional instructions provided."}
                        </div>
                      </div>
                      {active.brief ? (
                        <div className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Goal</div>
                            <div className="mt-2 font-semibold text-gray-900">{active.brief.goal}</div>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Message</div>
                            <div className="mt-2 font-semibold text-gray-900">{active.brief.message}</div>
                          </div>
                        </div>
                      ) : null}
                    </Card>

                    <Card className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[18px] font-semibold text-gray-800">Status</div>
                        <select
                          value={active.status}
                          onChange={(e) => moveTask(active.id, e.target.value as Status)}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          {statusOrder.map((s) => (
                            <option key={s} value={s}>
                              {statusLabel[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">Status changes update the board instantly.</div>
                    </Card>
                  </div>
                ) : panelTab === "files" ? (
                  <Card className="p-5">
                    <div className="text-[18px] font-semibold text-gray-800">Files</div>
                    <div className="mt-3 space-y-2">
                      {(active.files ?? []).map((f, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{f.name}</div>
                            <div className="mt-1 text-xs text-gray-500">{f.size} • v{f.version}</div>
                          </div>
                          <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Downloaded", message: "File download started." })}>
                            Download
                          </Button>
                        </div>
                      ))}
                      {(active.files ?? []).length ? null : (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No files yet.</div>
                      )}
                    </div>
                  </Card>
                ) : (
                  <Card className="p-5">
                    <div className="text-[18px] font-semibold text-gray-800">Messages</div>
                    <div className="mt-4 space-y-3">
                      {(active.messages ?? []).map((m, idx) => (
                        <div key={idx} className={["flex", m.side === "right" ? "justify-end" : "justify-start"].join(" ")}>
                          <div className="max-w-[85%] rounded-2xl border border-gray-200 bg-white p-4">
                            <div className="text-xs text-gray-500">{m.sender}</div>
                            <div className="mt-1 text-sm text-gray-700">{m.text}</div>
                            <div className="mt-2 text-xs text-gray-500 font-mono">{m.time}</div>
                          </div>
                        </div>
                      ))}
                      {(active.messages ?? []).length ? null : (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No messages yet.</div>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <input
                        placeholder="Type a message… (Enter to send)"
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          const text = (e.target as HTMLInputElement).value.trim();
                          if (!text) return;
                          (e.target as HTMLInputElement).value = "";
                          const next = readTasks().map((t) =>
                            t.id !== active.id
                              ? t
                              : {
                                  ...t,
                                  messages: [
                                    ...(t.messages ?? []),
                                    {
                                      sender: "Head of Design",
                                      initials: "HD",
                                      color: "bg-indigo-500",
                                      side: "left" as const,
                                      text,
                                      time: "04/04/2024 15:20",
                                    },
                                  ],
                                },
                          );
                          writeTasks(next);
                          showToast({ type: "success", title: "Sent", message: "Message sent." });
                        }}
                      />
                      <Button onClick={() => showToast({ type: "info", title: "Tip", message: "Press Enter to send." })}>Send</Button>
                    </div>
                  </Card>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Modal
        open={createOpen}
        onClose={() => {
          if (saving) return;
          setCreateOpen(false);
        }}
        title="Create Task"
        footer={createFooter}
      >
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className={createStep === 1 ? "font-semibold text-gray-900" : ""}>1. Link approved ad</span>
          <span>→</span>
          <span className={createStep === 2 ? "font-semibold text-gray-900" : ""}>2. Select designer</span>
          <span>→</span>
          <span className={createStep === 3 ? "font-semibold text-gray-900" : ""}>3. Task details</span>
        </div>

        {createStep === 1 ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              AI suggestion banner (simulation) — choose designer based on file type + workload.
            </div>
            <label className="text-sm font-medium text-gray-700">Approved ad</label>
            <select
              {...form.register("ad_id")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select approved ad…</option>
              {approvedAds.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.customer} — {a.screen}
                </option>
              ))}
            </select>
            {form.formState.errors.ad_id ? <div className="mt-1 text-xs text-red-600">{form.formState.errors.ad_id.message}</div> : null}
            {!approvedAds.length ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                No approved ads yet. Approve an ad in Review Queue first.
              </div>
            ) : null}
          </div>
        ) : createStep === 2 ? (
          <div className="mt-4 space-y-3">
            <label className="text-sm font-medium text-gray-700">Designer</label>
            <select
              {...form.register("designer_id")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select designer…</option>
              {designers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.position ?? "Designer"})
                </option>
              ))}
            </select>
            {form.formState.errors.designer_id ? <div className="mt-1 text-xs text-red-600">{form.formState.errors.designer_id.message}</div> : null}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Campaign</label>
              <input {...form.register("campaign")} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30" placeholder="Campaign name" />
              {form.formState.errors.campaign ? <div className="mt-1 text-xs text-red-600">{form.formState.errors.campaign.message}</div> : null}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Company</label>
              <input {...form.register("company")} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30" placeholder="Company" />
              {form.formState.errors.company ? <div className="mt-1 text-xs text-red-600">{form.formState.errors.company.message}</div> : null}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Screen</label>
              <input {...form.register("screen")} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30" placeholder="Screen" />
              {form.formState.errors.screen ? <div className="mt-1 text-xs text-red-600">{form.formState.errors.screen.message}</div> : null}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Complexity</label>
              <select {...form.register("complexity")} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30">
                <option value="low">low</option>
                <option value="high">high</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Deadline (DD/MM/YYYY)</label>
              <input {...form.register("deadline")} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30" placeholder="09/04/2024" />
              {form.formState.errors.deadline ? <div className="mt-1 text-xs text-red-600">{form.formState.errors.deadline.message}</div> : null}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
