"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Gauge, MonitorSmartphone, Plus, Wrench } from "lucide-react";

import { makeId, operationsStore, type ScreenFault, type ScreenMaintenanceItem } from "@/components/operations/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";

type ScreensTab = "inventory" | "health" | "faults" | "maintenance";

const tabs: Array<{ id: ScreensTab; label: string }> = [
  { id: "inventory", label: "Inventory" },
  { id: "health", label: "Health" },
  { id: "faults", label: "Faults" },
  { id: "maintenance", label: "Maintenance" },
];

export function ScreensPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<ScreensTab>(
    (searchParams.get("tab") as ScreensTab | null) ?? "inventory",
  );
  const [screens, setScreens] = React.useState<any[]>([]);
  const [faults, setFaults] = React.useState<ScreenFault[]>([]);
  const [maintenance, setMaintenance] = React.useState<ScreenMaintenanceItem[]>([]);
  const [detail, setDetail] = React.useState<any | null>(null);
  const [faultOpen, setFaultOpen] = React.useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = React.useState(false);

  React.useEffect(() => {
    operationsStore.seed();
    const refresh = () => {
      setScreens(operationsStore.readScreenAssets());
      setFaults(operationsStore.readScreenFaults());
      setMaintenance(operationsStore.readScreenMaintenance());
    };
    refresh();
    window.addEventListener(operationsStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(operationsStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  React.useEffect(() => {
    const next = (searchParams.get("tab") as ScreensTab | null) ?? "inventory";
    setActiveTab(next);
  }, [searchParams]);

  function handleTab(tab: ScreensTab) {
    setActiveTab(tab);
    router.push(`/screens?tab=${tab}`);
  }

  const offlineCount = screens.filter((screen) => screen.status === "offline").length;
  const liveCount = screens.filter((screen) => screen.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Screen Assets"
        subtitle="Monitor billboard inventory, health, faults, and preventive maintenance."
        actions={
          <>
            <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Export complete", message: "Screen report exported." })}>Export</Button>
            <Button onClick={() => {
              if (activeTab === "faults") setFaultOpen(true);
              if (activeTab === "maintenance") setMaintenanceOpen(true);
              if (activeTab === "inventory" || activeTab === "health") showToast({ type: "info", title: "Synced", message: "Screen telemetry refreshed." });
            }}>
              <Plus className="h-4 w-4" />
              Add {activeTab === "faults" ? "Fault" : activeTab === "maintenance" ? "Maintenance" : "Update"}
            </Button>
          </>
        }
      />

      {screens.some((screen) => screen.name === "Garden City Screen" && screen.status === "offline") ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="font-semibold">ALERT: Garden City Screen is OFFLINE</div>
          <div className="mt-1">Last heartbeat: 47 min ago. Immediate technician follow-up required.</div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard icon={MonitorSmartphone} value={screens.length} label="Installed Screens" iconColorClassName="bg-blue-100 text-primary" trend={{ value: "+0.0%", direction: "up" }} />
        <StatCard icon={Gauge} value={liveCount} label="Live Screens" iconColorClassName="bg-emerald-100 text-emerald-700" trend={{ value: "+2.0%", direction: "up" }} />
        <StatCard icon={AlertTriangle} value={offlineCount} label="Offline Screens" iconColorClassName="bg-red-100 text-red-700" trend={{ value: "-1.0%", direction: "down" }} />
        <StatCard icon={Wrench} value={maintenance.length} label="Maintenance Items" iconColorClassName="bg-amber-100 text-amber-700" trend={{ value: "+1.0%", direction: "up" }} />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === tab.id ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {activeTab === "inventory" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {screens.map((screen) => (
            <button
              key={screen.id}
              type="button"
              onClick={() => setDetail(screen)}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{screen.name}</div>
                  <div className="mt-1 text-sm text-gray-600">{screen.location}</div>
                </div>
                <Badge variant={screen.status === "active" ? "success" : screen.status === "offline" ? "error" : "warning"}>{screen.status}</Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-gray-700">
                <div>Installed: {screen.installed}</div>
                <div>Warranty: {screen.warranty}</div>
                <div>Uptime: {screen.uptime}%</div>
                <div>Install Cost: {formatUGX(screen.install_cost)}</div>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {activeTab === "health" ? (
        <DataTable
          data={screens}
          rowKey={(row) => row.id}
          onRowClick={(row) => setDetail(row)}
          columns={[
            { key: "screen", header: "Screen", cell: (row) => <div><div className="font-medium text-gray-900">{row.name}</div><div className="text-xs text-gray-500">{row.location}</div></div> },
            { key: "status", header: "Status", cell: (row) => <Badge variant={row.status === "active" ? "success" : row.status === "offline" ? "error" : "warning"}>{row.status}</Badge> },
            { key: "uptime", header: "Uptime", cell: (row) => `${row.uptime}%` },
            { key: "heartbeat", header: "Last Heartbeat", cell: (row) => row.last_heartbeat },
            { key: "maintenance", header: "Maintenance Total", cell: (row) => formatUGX(row.maintenance_total) },
          ]}
          rowActions={(row) => [
            {
              label: row.status === "offline" ? "Restore Online" : "Mark Maintenance",
              onClick: () => {
                operationsStore.writeScreenAssets(
                  screens.map((screen) =>
                    screen.id === row.id
                      ? { ...screen, status: screen.status === "offline" ? "active" : "maintenance" }
                      : screen,
                  ),
                );
                showToast({ type: "success", title: "Updated", message: `${row.name} status updated.` });
              },
            },
          ]}
        />
      ) : null}

      {activeTab === "faults" ? (
        <DataTable
          data={faults}
          rowKey={(row) => row.id}
          onRowClick={(row) => setDetail(row)}
          columns={[
            { key: "screen", header: "Screen", cell: (row) => row.screen },
            { key: "issue", header: "Issue", cell: (row) => row.issue },
            { key: "priority", header: "Priority", cell: (row) => <Badge variant={row.priority === "URGENT" ? "error" : row.priority === "Medium" ? "warning" : "neutral"}>{row.priority}</Badge> },
            { key: "assigned", header: "Assigned To", cell: (row) => row.assigned_to ?? "Unassigned" },
          ]}
          rowActions={(row) => [
            {
              label: "Assign Technician",
              onClick: () => {
                operationsStore.writeScreenFaults(
                  faults.map((fault) =>
                    fault.id === row.id
                      ? {
                          ...fault,
                          assigned_to: "Patrick Oryema",
                          updates: [...fault.updates, { time: "04/04/2024 14:10", text: "Assigned to field technician." }],
                        }
                      : fault,
                  ),
                );
                showToast({ type: "success", title: "Assigned", message: "Fault assigned to technician." });
              },
            },
          ]}
        />
      ) : null}

      {activeTab === "maintenance" ? (
        <DataTable
          data={maintenance}
          rowKey={(row) => row.id}
          onRowClick={(row) => setDetail(row)}
          columns={[
            { key: "screen", header: "Screen", cell: (row) => row.screen },
            { key: "work", header: "Work", cell: (row) => row.work },
            { key: "date", header: "Date", cell: (row) => row.date },
            { key: "cost", header: "Cost", cell: (row) => formatUGX(row.cost) },
            { key: "next", header: "Next", cell: (row) => row.next },
          ]}
          rowActions={(row) => [
            {
              label: "Duplicate Schedule",
              onClick: () => {
                operationsStore.writeScreenMaintenance([
                  ...maintenance,
                  { ...row, id: makeId("scr-maint"), date: "20/04/2024" },
                ]);
                showToast({ type: "success", title: "Created", message: "Maintenance schedule duplicated." });
              },
            },
          ]}
        />
      ) : null}

      <Modal open={faultOpen} onClose={() => setFaultOpen(false)} title="Report Screen Fault">
        <Button
          onClick={() => {
            operationsStore.writeScreenFaults([
              ...faults,
              {
                id: makeId("fault"),
                screen_id: "scr-001",
                screen: "Kampala Road Screen",
                priority: "Medium",
                issue: "Brightness calibration drift",
                photo: "https://picsum.photos/seed/fault2/640/400",
                updates: [],
              },
            ]);
            setFaultOpen(false);
            showToast({ type: "success", title: "Logged", message: "Screen fault created." });
          }}
        >
          Save Fault
        </Button>
      </Modal>

      <Modal open={maintenanceOpen} onClose={() => setMaintenanceOpen(false)} title="Schedule Maintenance">
        <Button
          onClick={() => {
            operationsStore.writeScreenMaintenance([
              ...maintenance,
              {
                id: makeId("scr-maint"),
                screen_id: "scr-002",
                screen: "Garden City Screen",
                date: "12/04/2024",
                work: "Controller replacement",
                cost: 480000,
                done_by: "TechSupport UG",
                next: "12/10/2024",
              },
            ]);
            setMaintenanceOpen(false);
            showToast({ type: "success", title: "Scheduled", message: "Maintenance visit added." });
          }}
        >
          Save Maintenance
        </Button>
      </Modal>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.name ?? detail?.screen ?? "Detail"}>
        {detail ? (
          <div className="space-y-3 text-sm text-gray-700">
            {detail.photo ? <img src={detail.photo} alt={detail.name ?? detail.screen} className="h-48 w-full rounded-2xl object-cover" /> : null}
            {Object.entries(detail).map(([key, value]) => (
              <div key={key} className="flex items-start justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0">
                <span className="font-medium capitalize text-gray-500">{key.replaceAll("_", " ")}</span>
                <span className="text-right text-gray-900">{Array.isArray(value) ? `${value.length} updates` : String(value)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
