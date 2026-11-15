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

export function OffboardingDetailPage({ offboardingId }: { offboardingId: string }) {
  const { showToast } = useToast();
  const [record, setRecord] = React.useState<any | null>(null);
  const [taskModal, setTaskModal] = React.useState<any | null>(null);
  const [interviewOpen, setInterviewOpen] = React.useState(false);

  React.useEffect(() => {
    operationsStore.seed();
    const refresh = () => setRecord(operationsStore.readOffboarding().find((item: any) => item.id === offboardingId) ?? null);
    refresh();
    window.addEventListener(operationsStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(operationsStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [offboardingId]);

  if (!record) return <Card className="p-6">Offboarding record not found.</Card>;

  const columns = {
    "Notice Period": record.tasks.slice(0, 1),
    Handover: record.tasks.slice(1, 2),
    "Assets + Final Pay": record.tasks.slice(2, 5),
    Complete: record.tasks.slice(5),
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-3">
          <BackButton />
          <div className="flex items-center gap-4">
            <img src={record.photo} alt={record.employee} className="h-20 w-20 rounded-full object-cover" />
            <div>
              <div className="text-[24px] font-semibold text-gray-900">{record.employee}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="warning">{record.reason}</Badge>
                <Badge variant="neutral">{record.notice_date}</Badge>
                <Badge variant="neutral">{record.last_day}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 h-3 rounded-full bg-gray-100">
          <div className="h-3 rounded-full bg-amber-500" style={{ width: `${record.progress}%` }} />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => setInterviewOpen(true)}>Exit Interview</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {Object.entries(columns).map(([label, tasks]: any) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-[18px] font-semibold text-gray-800">{label}</div>
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

      <Modal open={Boolean(taskModal)} onClose={() => setTaskModal(null)} title={taskModal?.title}>
        {taskModal ? (
          <Button
            onClick={() => {
              const next = operationsStore.readOffboarding().map((item: any) =>
                item.id !== record.id
                  ? item
                  : {
                      ...item,
                      progress: Math.min(100, item.progress + 10),
                      tasks: item.tasks.map((task: any) =>
                        task.id === taskModal.id
                          ? { ...task, status: task.status === "pending" ? "in_progress" : "complete" }
                          : task,
                      ),
                    },
              );
              operationsStore.writeOffboarding(next);
              setTaskModal(null);
              showToast({ type: "success", title: "Updated", message: "Offboarding task updated." });
            }}
          >
            Save
          </Button>
        ) : null}
      </Modal>

      <Modal open={interviewOpen} onClose={() => setInterviewOpen(false)} title="Exit Interview">
        <Button
          onClick={() => {
            const next = operationsStore.readOffboarding().map((item: any) => item.id === record.id ? { ...item, exit_interview_done: true } : item);
            operationsStore.writeOffboarding(next);
            setInterviewOpen(false);
            showToast({ type: "success", title: "Saved", message: "Exit interview recorded." });
          }}
        >
          Save Interview
        </Button>
      </Modal>
    </div>
  );
}
