"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";

import { financeStore } from "@/components/finance/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

export function QuickbooksPage() {
  const { showToast } = useToast();
  const [state, setState] = React.useState<any>(null);
  const [connectOpen, setConnectOpen] = React.useState(false);

  React.useEffect(() => {
    financeStore.seed();
    const refresh = () => setState(financeStore.readQuickbooks());
    refresh();
    window.addEventListener(financeStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(financeStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!state) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="QuickBooks Sync"
        subtitle="Connect accounting sync, review queue status, and control category mappings."
        actions={<Button onClick={() => setConnectOpen(true)}>{state.connected ? "Reconnect" : "Connect QuickBooks"}</Button>}
      />

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[18px] font-semibold text-gray-800">Connection Status</div>
            <div className="mt-1 text-sm text-gray-600">{state.connected ? "Connected to QuickBooks Online" : "Not Connected"}</div>
          </div>
          <Badge variant={state.connected ? "success" : "neutral"}>{state.connected ? "Connected" : "Not Connected"}</Badge>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,1fr]">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[18px] font-semibold text-gray-800">Sync Queue</div>
            <Button
              variant="secondary"
              onClick={() => {
                financeStore.writeQuickbooks({
                  ...state,
                  queue: state.queue.map((item: any) => ({ ...item, status: "synced" })),
                  logs: [{ id: `log-${Date.now()}`, date: "04/04/2024 14:00", label: "Sync All", result: "success" }, ...state.logs],
                });
                showToast({ type: "success", title: "Synced", message: "All queue items synced." });
              }}
            >
              Sync All
            </Button>
          </div>
          <DataTable<any>
            data={state.queue}
            rowKey={(row) => row.id}
            selectable={false}
            columns={[
              { key: "type", header: "Type", cell: (row) => row.type },
              { key: "label", header: "Label", cell: (row) => row.label },
              { key: "status", header: "Status", cell: (row) => <Badge variant={row.status === "synced" ? "success" : "warning"}>{row.status}</Badge> },
            ]}
          />
        </Card>

        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Auto Sync</div>
          <div className="mt-5 space-y-4">
            {Object.entries(state.autoSync).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  financeStore.writeQuickbooks({ ...state, autoSync: { ...state.autoSync, [key]: !value } });
                  showToast({ type: "success", title: "Updated", message: `${key} auto-sync updated.` });
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-gray-200 p-4 text-left"
              >
                <span className="text-sm font-medium text-gray-900">{key}</span>
                <Badge variant={value ? "success" : "neutral"}>{value ? "On" : "Off"}</Badge>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="text-[18px] font-semibold text-gray-800">Category Mappings</div>
        <div className="mt-4 space-y-3">
          {state.mappings.map((mapping: any) => (
            <div key={mapping.id} className="flex items-center justify-between rounded-2xl border border-gray-200 p-4 text-sm">
              <span>{mapping.label}</span>
              <button
                type="button"
                onClick={() => showToast({ type: "success", title: "Saved", message: `${mapping.label} mapping updated.` })}
                className="rounded-lg border border-gray-200 px-3 py-2"
              >
                {mapping.mappedTo}
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-[18px] font-semibold text-gray-800">Sync Log</div>
        <div className="mt-4 space-y-3">
          {state.logs.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between rounded-2xl border border-gray-200 p-4 text-sm">
              <span>{log.date} - {log.label}</span>
              <Badge variant={log.result === "success" ? "success" : "warning"}>{log.result}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={connectOpen} onClose={() => setConnectOpen(false)} title="QuickBooks OAuth Simulation">
        <div className="space-y-4 text-sm text-gray-700">
          <div>Connecting to QuickBooks Online…</div>
          <Button
            onClick={() => {
              financeStore.writeQuickbooks({ ...state, connected: true });
              setConnectOpen(false);
              showToast({ type: "success", title: "Connected", message: "Connected to QuickBooks Online." });
            }}
          >
            Finish Connect
          </Button>
        </div>
      </Modal>
    </div>
  );
}
