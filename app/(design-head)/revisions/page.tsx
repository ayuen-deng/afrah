"use client";

import * as React from "react";
import { Send } from "lucide-react";

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

export default function ClientRevisionsPage() {
  const { showToast } = useToast();

  const [tasks, setTasks] = React.useState<HODTask[]>([]);
  const [active, setActive] = React.useState<HODTask | null>(null);
  const [sending, setSending] = React.useState(false);

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
    () => tasks.filter((t) => t.status === "revision_requested"),
    [tasks],
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[24px] font-semibold text-gray-900">Client Revisions</div>
        <div className="mt-1 text-sm text-gray-600">
          Client revision requests — send back to designers and track revision count.
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
              <div className="flex items-center gap-2">
                <Badge variant="warning" dot>
                  Revision Requested
                </Badge>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                  {t.revision_count ?? 1}x
                </span>
              </div>
            </button>
          ))}
          {items.length ? null : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
              No client revisions right now.
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={Boolean(active)}
        onClose={() => {
          if (sending) return;
          setActive(null);
        }}
        title="Revision Detail"
        footer={
          active ? (
            <>
              <Button variant="secondary" onClick={() => setActive(null)} disabled={sending}>
                Close
              </Button>
              <Button
                loading={sending}
                onClick={async () => {
                  if (!active) return;
                  setSending(true);
                  try {
                    await new Promise((r) => setTimeout(r, 900));
                    const next = readTasks().map((x) =>
                      x.id !== active.id ? x : { ...x, status: "in_progress" as const },
                    );
                    writeTasks(next);
                    showToast({
                      type: "success",
                      title: "Sent",
                      message: "Revision sent to designer (simulation).",
                    });
                    setActive(null);
                  } finally {
                    setSending(false);
                  }
                }}
              >
                <Send className="h-4 w-4" />
                Send to Designer
              </Button>
            </>
          ) : null
        }
      >
        {active ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-sm font-semibold text-gray-900">Client notes</div>
              <div className="mt-2 text-sm text-gray-700">
                {active.client_notes ?? "Client requested adjustments to layout and messaging."}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-sm font-semibold text-gray-900">Previous version</div>
              <div className="mt-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                Previous file preview (simulated)
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-amber-50 p-4 text-sm text-amber-800">
              Revision count: <span className="font-semibold">{active.revision_count ?? 1}</span>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
