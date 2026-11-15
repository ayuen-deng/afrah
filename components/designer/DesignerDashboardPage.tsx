"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CalendarClock, CheckCircle2, TimerReset, TrendingUp } from "lucide-react";

import { designerDefaultId, designerTaskEventName, getDesignerStats, getDesignerTasks, seedDesignerTasksIfMissing } from "@/components/designer/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";

export function DesignerDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = React.useState(() => getDesignerStats(designerDefaultId));
  const [tasks, setTasks] = React.useState(() => getDesignerTasks(designerDefaultId));

  React.useEffect(() => {
    seedDesignerTasksIfMissing();
    const refresh = () => {
      setStats(getDesignerStats(designerDefaultId));
      setTasks(getDesignerTasks(designerDefaultId));
    };
    refresh();
    window.addEventListener(designerTaskEventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(designerTaskEventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const activeTasks = tasks.filter((task) => task.status !== "done").slice(0, 3);
  const recentMessages = tasks
    .map((task) => ({ task, message: task.messages?.[task.messages.length - 1] }))
    .filter((entry) => entry.message)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Good morning, Brian</div>
          <div className="mt-1 text-sm text-gray-600">
            Your creative queue, deadlines, and latest feedback for Friday, 04/04/2024.
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push("/resources")}>
            Open Resources
          </Button>
          <Button onClick={() => router.push("/tasks")}>View All Tasks</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <StatCard icon={BriefcaseBusiness} iconColorClassName="text-gray-700 bg-slate-100" value={stats.todo} label="To Do" trend={{ value: "+0.0%", direction: "up" }} />
        <StatCard icon={CalendarClock} iconColorClassName="text-warning bg-amber-100" value={stats.dueToday} label="Due Today" trend={{ value: "+0.0%", direction: "up" }} />
        <StatCard icon={TimerReset} iconColorClassName="text-primary bg-blue-100" value={stats.inProgress} label="In Progress" trend={{ value: "+6.0%", direction: "up" }} />
        <StatCard icon={CheckCircle2} iconColorClassName="text-success bg-green-100" value={stats.done} label="Completed This Month" trend={{ value: "+12.0%", direction: "up" }} />
        <StatCard icon={TrendingUp} iconColorClassName="text-success bg-green-100" value={`${stats.onTimeRate}%`} label="On-Time Rate" trend={{ value: "+4.0%", direction: "up" }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[18px] font-semibold text-gray-800">Active tasks</div>
              <div className="mt-1 text-sm text-gray-600">
                Open a task to continue designing or submit work for review.
              </div>
            </div>
            <Button variant="secondary" onClick={() => router.push("/tasks?status=in_progress")}>
              In Progress
            </Button>
          </div>

          <div className="mt-6 grid gap-4">
            {activeTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => router.push(`/tasks/${task.id}`)}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{task.campaign}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      {task.company} | {task.screen}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="info">{task.screen}</Badge>
                      <Badge variant={task.complexity === "high" ? "warning" : "neutral"}>{task.complexity}</Badge>
                      <Badge variant={task.status === "revision_requested" ? "warning" : "info"} dot>
                        {task.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-left lg:text-right">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Deadline</div>
                    <div className="mt-1 font-mono text-sm text-gray-900">{task.deadline}</div>
                    <div className="mt-2 text-xs text-amber-600">5 days remaining</div>
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Open Task
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Quick messages</div>
          <div className="mt-1 text-sm text-gray-600">Latest message per task.</div>
          <div className="mt-6 space-y-4">
            {recentMessages.map(({ task, message }) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="block rounded-2xl border border-gray-200 bg-white p-4 transition hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{task.campaign}</div>
                    <div className="mt-1 text-xs text-gray-500">{message?.sender}</div>
                  </div>
                  <Badge variant="info">Chat</Badge>
                </div>
                <div className="mt-3 text-sm text-gray-700">{message?.text}</div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
