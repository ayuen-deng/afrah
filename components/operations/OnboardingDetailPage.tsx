"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";

import { operationsStore } from "@/components/operations/store";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export function OnboardingDetailPage({ onboardingId }: { onboardingId: string }) {
  const { showToast } = useToast();
  const [record, setRecord] = React.useState<any | null>(null);
  const [taskModal, setTaskModal] = React.useState<any | null>(null);
  const [workflowView, setWorkflowView] = React.useState(false);

  React.useEffect(() => {
    operationsStore.seed();
    const refresh = () => setRecord(operationsStore.readOnboarding().find((item: any) => item.id === onboardingId) ?? null);
    refresh();
    window.addEventListener(operationsStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(operationsStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [onboardingId]);

  if (!record) return <Card className="p-6">Onboarding record not found.</Card>;

  const grouped = {
    "Account Setup": record.tasks.filter((task: any) => task.category === "Account Setup"),
    Documents: record.tasks.filter((task: any) => task.category === "Documents"),
    Training: record.tasks.filter((task: any) => task.category === "Training"),
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-3">
              <BackButton />
              <div className="flex items-center gap-4">
                <img src={record.photo} alt={record.employee} className="h-20 w-20 rounded-full object-cover" />
                <div>
                  <div className="text-[24px] font-semibold text-gray-900">{record.employee}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="info">{record.employee_id}</Badge>
                    <Badge variant="neutral">Junior Designer</Badge>
                    <Badge variant="info">Onboarding</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setWorkflowView((current) => !current)}>{workflowView ? "Board View" : "Workflow View"}</Button>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{record.progress}%</span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-gray-100">
            <div className="h-3 rounded-full bg-primary" style={{ width: `${record.progress}%` }} />
          </div>
        </div>
      </Card>

      {!workflowView ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Object.entries(grouped).map(([title, tasks]: any) => (
            <Card key={title} className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-[18px] font-semibold text-gray-800">{title}</div>
                <Badge variant="neutral">{tasks.length}</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {tasks.map((task: any) => (
                  <button key={task.id} type="button" onClick={() => setTaskModal(task)} className="w-full rounded-2xl border border-gray-200 bg-slate-50 p-4 text-left">
                    <div className="text-sm font-semibold text-gray-900">{task.title}</div>
                    <div className="mt-2"><Badge variant={task.status === "complete" ? "success" : task.status === "in_progress" ? "warning" : "neutral"}>{task.status}</Badge></div>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {Object.entries(grouped).map(([title, tasks]: any) => {
            const done = tasks.filter((task: any) => task.status === "complete").length;
            return (
              <Card key={title} className="p-5">
                <div className="text-[18px] font-semibold text-gray-800">{title}</div>
                <div className="mt-3 text-sm text-gray-600">{done}/{tasks.length} complete</div>
                <div className="mt-3 h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${(done / tasks.length) * 100}%` }} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={Boolean(taskModal)} onClose={() => setTaskModal(null)} title={taskModal?.title}>
        {taskModal ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-700">Responsible: {taskModal.responsible}</div>
            {taskModal.requires_upload ? <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">Upload required for this task.</div> : null}
            <Button
              onClick={() => {
                const next = operationsStore.readOnboarding().map((item: any) =>
                  item.id !== record.id
                    ? item
                    : {
                        ...item,
                        progress: Math.min(100, item.progress + 7),
                        tasks: item.tasks.map((task: any) => task.id === taskModal.id ? { ...task, status: "complete" } : task),
                      },
                );
                operationsStore.writeOnboarding(next);
                setTaskModal(null);
                showToast({ type: "success", title: "Saved", message: "Task updated." });
              }}
            >
              Save
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
