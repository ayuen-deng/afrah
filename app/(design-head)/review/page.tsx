"use client";

import * as React from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { hodStore, type HODTask } from "@/components/layouts/DesignHeadShell";

type DesignerRef = { name?: string };

function designerName(t: HODTask) {
  const d = t.designer as unknown as DesignerRef;
  return d?.name ?? "Designer";
}

function readTasks() {
  return hodStore.readTasks();
}
function writeTasks(next: HODTask[]) {
  hodStore.writeTasks(next);
}

export default function InternalReviewPage() {
  const { showToast } = useToast();

  const [tasks, setTasks] = React.useState<HODTask[]>([]);
  const [active, setActive] = React.useState<HODTask | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    hodStore.seedIfMissing();
    setTasks(readTasks());
    const onUpdate = () => setTasks(readTasks());
    window.addEventListener("afrah_hod_tasks_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_hod_tasks_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const items = React.useMemo(
    () => tasks.filter((t) => t.status === "internal_review"),
    [tasks],
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[24px] font-semibold text-gray-900">Internal Review</div>
        <div className="mt-1 text-sm text-gray-600">
          Submitted work from designers — approve or request revision.
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-3">
          {items.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left hover:bg-gray-50"
            >
              <div>
                <div className="text-sm font-semibold text-gray-900">{t.campaign}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {designerName(t)} • {t.company} •{" "}
                  <span className="font-mono">{t.deadline}</span>
                </div>
              </div>
              <Badge variant="info" dot>
                Internal Review
              </Badge>
            </button>
          ))}
          {items.length ? null : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
              No submissions awaiting internal review.
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={Boolean(active)}
        onClose={() => {
          if (saving) return;
          setActive(null);
        }}
        title="Review Submission"
        footer={
          active ? (
            <>
              <Button variant="secondary" onClick={() => setActive(null)} disabled={saving}>
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  if (!active) return;
                  setSaving(true);
                  try {
                    await new Promise((r) => setTimeout(r, 900));
                    const next = readTasks().map((x) =>
                      x.id !== active.id
                        ? x
                        : {
                            ...x,
                            status: "revision_requested" as const,
                            revision_count: (x.revision_count ?? 0) + 1,
                            client_notes:
                              "Please adjust the layout and simplify the message.",
                          },
                    );
                    writeTasks(next);
                    showToast({
                      type: "success",
                      title: "Revision requested",
                      message: "Task moved to Client Revisions.",
                    });
                    setActive(null);
                  } finally {
                    setSaving(false);
                  }
                }}
                loading={saving}
              >
                <RotateCcw className="h-4 w-4" />
                Request Revision
              </Button>
              <Button
                onClick={async () => {
                  if (!active) return;
                  setSaving(true);
                  try {
                    await new Promise((r) => setTimeout(r, 900));
                    const next = readTasks().map((x) =>
                      x.id !== active.id ? x : { ...x, status: "sent_to_client" as const },
                    );
                    writeTasks(next);
                    showToast({
                      type: "success",
                      title: "Approved",
                      message: "Approved and sent to client (simulation).",
                    });
                    setActive(null);
                  } finally {
                    setSaving(false);
                  }
                }}
                loading={saving}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve — Send to Client
              </Button>
            </>
          ) : null
        }
      >
        {active ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                File preview (simulated)
              </div>
              <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Latest file
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-900">
                  {(active.files?.[0]?.name ?? "—")}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Brief comparison</div>
                <div className="mt-2 text-sm text-gray-600">
                  Compare submission against brief requirements (simulation).
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-green-50 p-3 text-sm text-green-800">
                    <span>Resolution matches screen</span>
                    <span className="font-semibold">OK</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    <span>Text density</span>
                    <span className="font-semibold">Review</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Notes</div>
                <div className="mt-2 text-sm text-gray-600">
                  Campaign: <span className="font-semibold text-gray-900">{active.campaign}</span>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Designer: <span className="font-semibold text-gray-900">{designerName(active)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
