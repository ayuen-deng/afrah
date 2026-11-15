"use client";

import * as React from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { superAdminStore, type IntegrationItem } from "@/components/super-admin/store";

export function IntegrationsPage() {
  const { showToast } = useToast();
  const [integrations, setIntegrations] = React.useState<IntegrationItem[]>(superAdminStore.readIntegrations());
  const [active, setActive] = React.useState<IntegrationItem | null>(null);
  const [pendingDisconnect, setPendingDisconnect] = React.useState<IntegrationItem | null>(null);

  React.useEffect(() => {
    superAdminStore.seed();
    const refresh = () => setIntegrations(superAdminStore.readIntegrations());
    refresh();
    window.addEventListener(superAdminStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(superAdminStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const writeIntegrations = (next: IntegrationItem[]) => {
    superAdminStore.writeIntegrations(next);
    setIntegrations(next);
    if (active) {
      setActive(next.find((item) => item.id === active.id) ?? null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Integrations" subtitle="Monitor connection health, run tests, and reconnect external services." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <button key={integration.id} type="button" onClick={() => setActive(integration)} className="text-left">
            <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900">{integration.name}</div>
                <Badge variant={integration.status === "Connected" ? "success" : "error"}>{integration.status}</Badge>
              </div>
              <div className="mt-2 text-sm text-gray-600">{integration.detail}</div>
              <div className="mt-4 text-xs uppercase tracking-wide text-gray-500">Last ping</div>
              <div className="mt-1 text-sm text-gray-700">{integration.lastPing}</div>
            </Card>
          </button>
        ))}
      </div>

      <Modal
        open={Boolean(active)}
        title={active?.name ?? "Integration"}
        onClose={() => setActive(null)}
        footer={
          active ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  showToast({ type: "success", title: "Connection verified", message: `${active.name} responded successfully.` });
                }}
              >
                Test Connection
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  writeIntegrations(integrations.map((item) => (item.id === active.id ? { ...item, lastPing: "04/04/2024 08:45" } : item)));
                  showToast({ type: "info", title: "Sync initiated", message: `${active.name} sync has started.` });
                }}
              >
                Sync Now
              </Button>
              <Button variant="danger" onClick={() => setPendingDisconnect(active)}>
                Disconnect
              </Button>
            </>
          ) : undefined
        }
      >
        {active ? (
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <Badge variant={active.status === "Connected" ? "success" : "error"}>{active.status}</Badge>
              <div>Last ping: {active.lastPing}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
              {active.stats.map((stat) => (
                <div key={stat}>{stat}</div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(pendingDisconnect)}
        title="Disconnect Integration?"
        onClose={() => setPendingDisconnect(null)}
        footer={
          pendingDisconnect ? (
            <>
              <Button variant="secondary" onClick={() => setPendingDisconnect(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const target = pendingDisconnect;
                  if (!target) return;
                  writeIntegrations(integrations.map((item) => (item.id === target.id ? { ...item, status: "Disconnected" } : item)));
                  showToast({ type: "error", title: "Integration disconnected", message: `${target.name} was disconnected.` });
                  setPendingDisconnect(null);
                }}
              >
                Disconnect
              </Button>
            </>
          ) : undefined
        }
      >
        {pendingDisconnect ? <div className="text-sm text-gray-600">Disconnect {pendingDisconnect.name}? This can interrupt live syncs.</div> : null}
      </Modal>
    </div>
  );
}
