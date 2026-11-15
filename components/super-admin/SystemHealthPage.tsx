"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Database, FolderKanban, Gauge, Server, ShieldAlert, TimerReset, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { superAdminStore, type ErrorLogItem } from "@/components/super-admin/store";

export function SystemHealthPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [expanded, setExpanded] = React.useState<"database" | "storage" | null>(null);
  const [error, setError] = React.useState<ErrorLogItem | null>(null);
  const [failedOpen, setFailedOpen] = React.useState(false);
  const [health, setHealth] = React.useState(superAdminStore.readSystemHealth());
  const [errors, setErrors] = React.useState(superAdminStore.readErrors());

  React.useEffect(() => {
    superAdminStore.seed();
    const refresh = () => {
      setHealth(superAdminStore.readSystemHealth());
      setErrors(superAdminStore.readErrors());
    };
    refresh();
    window.addEventListener(superAdminStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(superAdminStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const metrics = [
    {
      title: "Database",
      value: `${health.database_used_gb}GB / ${health.database_total_gb}GB`,
      meta: "30% used",
      icon: Database,
      onClick: () => setExpanded((value) => (value === "database" ? null : "database")),
    },
    {
      title: "File Storage",
      value: `${health.storage_used_gb}GB / ${health.storage_total_gb}GB`,
      meta: "25% used",
      icon: FolderKanban,
      onClick: () => setExpanded((value) => (value === "storage" ? null : "storage")),
    },
    {
      title: "Active Sessions",
      value: String(health.active_sessions),
      meta: "Users online now",
      icon: Users,
      onClick: () => router.push("/users?status=active"),
    },
    {
      title: "API Requests",
      value: health.api_requests_24h.toLocaleString("en-US"),
      meta: "Last 24 hours",
      icon: Server,
      onClick: () => showToast({ type: "info", title: "API traffic", message: "Traffic remained healthy over the last 24 hours." }),
    },
    {
      title: "Failed Payments",
      value: String(health.failed_payments_24h),
      meta: "Attention required",
      icon: ShieldAlert,
      onClick: () => setFailedOpen(true),
    },
    {
      title: "Errors",
      value: String(health.errors_24h),
      meta: "Platform alerts",
      icon: AlertTriangle,
      onClick: () => setError(errors[0] ?? null),
    },
    {
      title: "Uptime",
      value: `${health.uptime_pct}%`,
      meta: "Stable",
      icon: TimerReset,
      onClick: () => showToast({ type: "success", title: "Uptime healthy", message: "Availability remains above the target threshold." }),
    },
    {
      title: "Avg Response",
      value: `${health.avg_response_ms}ms`,
      meta: "Median response speed",
      icon: Gauge,
      onClick: () => showToast({ type: "info", title: "Speed report", message: "Average response time is within the healthy band." }),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="System Health" subtitle="Monitor platform performance, capacity, and operational incidents." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <button key={metric.title} type="button" onClick={metric.onClick} className="text-left">
              <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-blue-50 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant={metric.title === "Failed Payments" ? "error" : "info"}>{metric.meta}</Badge>
                </div>
                <div className="mt-5 text-sm font-medium uppercase tracking-wide text-gray-500">{metric.title}</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{metric.value}</div>
              </Card>
            </button>
          );
        })}
      </div>

      {expanded === "database" ? (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-gray-900">Database table breakdown</div>
              <div className="text-sm text-gray-600">Capacity snapshot for the most active system tables.</div>
            </div>
            <Button variant="secondary" onClick={() => setExpanded(null)}>
              Hide
            </Button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Table</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Size</th>
                </tr>
              </thead>
              <tbody>
                {health.databaseBreakdown.map((row: { label: string; value: string }) => (
                  <tr key={row.label} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm text-gray-700">{row.label}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {expanded === "storage" ? (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-gray-900">Storage folder breakdown</div>
              <div className="text-sm text-gray-600">Current disk allocation by major document groups.</div>
            </div>
            <Button variant="secondary" onClick={() => setExpanded(null)}>
              Hide
            </Button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Folder</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Size</th>
                </tr>
              </thead>
              <tbody>
                {health.storageBreakdown.map((row: { label: string; value: string }) => (
                  <tr key={row.label} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm text-gray-700">{row.label}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">Error log</div>
            <div className="text-sm text-gray-600">Open any incident to review the affected user, page, and recurrence.</div>
          </div>
          <Badge variant="warning">{errors.length} recent issues</Badge>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Message</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Page</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Time</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((item) => (
                <tr key={item.id} onClick={() => setError(item)} className="cursor-pointer border-b border-slate-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.message}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.user}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.page}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={Boolean(error)} title="Error Detail" onClose={() => setError(null)}>
        {error ? (
          <div className="space-y-4 text-sm text-gray-600">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error.message}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>User: {error.user}</div>
              <div>Page: {error.page}</div>
              <div>Time: {error.time}</div>
              <div>Frequency: {error.frequency} times</div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={failedOpen}
        title="Failed Payments"
        onClose={() => setFailedOpen(false)}
        footer={<Button onClick={() => setFailedOpen(false)}>Close</Button>}
      >
        <div className="space-y-3 text-sm text-gray-600">
          <div>2 failed payment attempts were detected in the last 24 hours and require finance follow-up.</div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            MTN callback retries are delayed on two transactions. Finance and engineering have been notified.
          </div>
        </div>
      </Modal>
    </div>
  );
}
