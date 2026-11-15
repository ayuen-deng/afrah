"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { designerDefaultId, designerTaskEventName, getDesignerTasks, seedDesignerTasksIfMissing } from "@/components/designer/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type TaskTab = "to_do" | "in_progress" | "internal_review" | "done";

const tabLabels: Record<TaskTab, string> = {
  to_do: "To Do",
  in_progress: "In Progress",
  internal_review: "In Review",
  done: "Done",
};

export function DesignerTasksPage() {
  const searchParams = useSearchParams();
  const initial = (searchParams.get("status") as TaskTab | null) ?? "to_do";
  const [activeTab, setActiveTab] = React.useState<TaskTab>(
    ["to_do", "in_progress", "internal_review", "done"].includes(initial) ? initial : "to_do",
  );
  const [tasks, setTasks] = React.useState(() => getDesignerTasks(designerDefaultId));

  React.useEffect(() => {
    seedDesignerTasksIfMissing();
    const refresh = () => setTasks(getDesignerTasks(designerDefaultId));
    refresh();
    window.addEventListener(designerTaskEventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(designerTaskEventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  React.useEffect(() => {
    const next = (searchParams.get("status") as TaskTab | null) ?? "to_do";
    if (["to_do", "in_progress", "internal_review", "done"].includes(next)) {
      setActiveTab(next);
    }
  }, [searchParams]);

  const filtered = tasks.filter((task) => {
    if (activeTab === "internal_review") return task.status === "internal_review" || task.status === "sent_to_client";
    return task.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Task List</div>
          <div className="mt-1 text-sm text-gray-600">
            Browse by status and open any card for the full creative workspace.
          </div>
        </div>
        <Button variant="secondary" onClick={() => window.history.back()}>
          Back
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(tabLabels) as TaskTab[]).map((tab) => {
            const selected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  selected ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((task) => {
          const isUrgent = task.deadline === "09/04/2024" || task.deadline === "08/04/2024";
          return (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{task.campaign}</div>
                  <div className="mt-1 text-sm text-gray-600">{task.company}</div>
                </div>
                <Badge variant={task.status === "done" ? "success" : task.status === "revision_requested" ? "warning" : "info"}>
                  {task.status.replaceAll("_", " ")}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="neutral">{task.screen}</Badge>
                <Badge variant={task.complexity === "high" ? "warning" : "info"}>{task.complexity}</Badge>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Deadline countdown</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-sm text-gray-900">{task.deadline}</span>
                  <span className={`text-xs font-medium ${isUrgent ? "text-amber-600" : "text-green-600"}`}>
                    {isUrgent ? "5 days left" : "On track"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
