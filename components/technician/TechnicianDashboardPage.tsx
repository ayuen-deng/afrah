"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Wrench } from "lucide-react";

import { labels, readTech, seedTech, stats, techEvent } from "@/components/technician/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

const variant = (v: string): "error" | "warning" | "success" | "info" =>
  v === "urgent" ? "error" : v === "medium" ? "warning" : v === "resolved" ? "success" : "info";
const order = { urgent: 0, medium: 1, low: 2 } as const;

export function TechnicianDashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = React.useState(readTech());
  const [numbers, setNumbers] = React.useState({ active: 2, urgent: 1, completed: 1 });

  React.useEffect(() => {
    seedTech();
    const refresh = () => {
      setTasks([...readTech()].sort((a, b) => order[a.priority] - order[b.priority]));
      setNumbers(stats());
    };
    refresh();
    window.addEventListener(techEvent, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(techEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="My Tasks"
        subtitle="Urgent field work is surfaced first so you can move fast and keep screens online."
        actions={<Button variant="secondary" onClick={() => router.push("/report")}>Report New Fault</Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Wrench} value={numbers.active} label="Active" iconColorClassName="bg-blue-100 text-blue-600" />
        <StatCard icon={AlertTriangle} value={<span className="text-red-600">{numbers.urgent}</span>} label="Urgent" iconColorClassName="bg-red-100 text-red-600" />
        <StatCard icon={CheckCircle2} value={numbers.completed} label="Completed" iconColorClassName="bg-green-100 text-green-600" />
      </div>
      <Card className="p-0">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="text-lg font-semibold text-gray-900">Task Queue</div>
        </div>
        <div className="divide-y divide-gray-100">
          {tasks.map((task) => (
            <button key={task.id} type="button" onClick={() => router.push(`/tasks/${task.id}`)} className={["flex w-full items-start gap-4 px-6 py-5 text-left transition hover:bg-gray-50", task.priority === "urgent" && task.status !== "resolved" ? "border-l-4 border-red-500" : ""].join(" ")}>
              <img src={task.photo} alt={task.screen} className="h-20 w-28 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-gray-900">{task.screen}</div>
                  <Badge variant={variant(task.priority)} dot>{task.priority}</Badge>
                  <Badge variant={variant(task.status)} dot>{labels[task.status]}</Badge>
                </div>
                <div className="mt-1 text-sm text-gray-600">{task.title}</div>
                <div className="mt-2 text-xs text-gray-500">{task.location} • Assigned {task.assigned}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
