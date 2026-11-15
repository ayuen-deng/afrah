"use client";

import * as React from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { superAdminStore, type AuditLogEntry } from "@/components/super-admin/store";

export function AuditLogsPage() {
  const [logs, setLogs] = React.useState<AuditLogEntry[]>(superAdminStore.readAuditLogs());
  const [filters, setFilters] = React.useState({ user: "", role: "all", action: "all", table: "all", dateRange: "all" });
  const [active, setActive] = React.useState<AuditLogEntry | null>(null);

  React.useEffect(() => {
    superAdminStore.seed();
    const refresh = () => setLogs(superAdminStore.readAuditLogs());
    refresh();
    window.addEventListener(superAdminStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(superAdminStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const filtered = React.useMemo(() => {
    return logs.filter((entry) => {
      const matchesUser = !filters.user || entry.user.toLowerCase().includes(filters.user.toLowerCase());
      const matchesRole = filters.role === "all" || entry.role === filters.role;
      const matchesAction = filters.action === "all" || entry.action === filters.action;
      const matchesTable = filters.table === "all" || entry.table === filters.table;
      const matchesRange = filters.dateRange === "all" || entry.time.startsWith(filters.dateRange);
      return matchesUser && matchesRole && matchesAction && matchesTable && matchesRange;
    });
  }, [filters, logs]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Audit Logs" subtitle="Track every create, update, and delete action with before and after context." />

      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-5">
          <input value={filters.user} onChange={(event) => setFilters((state) => ({ ...state, user: event.target.value }))} placeholder="User" className="rounded-xl border border-gray-200 px-4 py-3 text-sm" />
          <select value={filters.role} onChange={(event) => setFilters((state) => ({ ...state, role: event.target.value }))} className="rounded-xl border border-gray-200 px-4 py-3 text-sm">
            <option value="all">All roles</option>
            <option value="finance">finance</option>
            <option value="ceo">ceo</option>
            <option value="designer">designer</option>
          </select>
          <select value={filters.action} onChange={(event) => setFilters((state) => ({ ...state, action: event.target.value }))} className="rounded-xl border border-gray-200 px-4 py-3 text-sm">
            <option value="all">All actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
          <select value={filters.table} onChange={(event) => setFilters((state) => ({ ...state, table: event.target.value }))} className="rounded-xl border border-gray-200 px-4 py-3 text-sm">
            <option value="all">All tables</option>
            <option value="invoices">invoices</option>
            <option value="announcements">announcements</option>
            <option value="tasks">tasks</option>
            <option value="pricing_rules">pricing_rules</option>
            <option value="expenses">expenses</option>
          </select>
          <select value={filters.dateRange} onChange={(event) => setFilters((state) => ({ ...state, dateRange: event.target.value }))} className="rounded-xl border border-gray-200 px-4 py-3 text-sm">
            <option value="all">All dates</option>
            <option value="04/04/2024">01/04–04/04</option>
            <option value="03/04/2024">03/04 only</option>
            <option value="01/04/2024">01/04 only</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Table</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Changes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} onClick={() => setActive(entry)} className="cursor-pointer border-b border-slate-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{entry.time}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{entry.user}</td>
                  <td className="px-4 py-3">
                    <Badge variant={entry.action === "CREATE" ? "success" : entry.action === "DELETE" ? "error" : "info"}>{entry.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{entry.table}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{entry.changes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={Boolean(active)} title="Audit Log Detail" onClose={() => setActive(null)}>
        {active ? (
          <div className="space-y-4 text-sm text-gray-600">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>User: {active.user}</div>
              <div>Action: {active.action}</div>
              <div>Table: {active.table}</div>
              <div>Record ID: {active.id}</div>
              <div>Time: {active.time}</div>
              <div>IP: {active.ip}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="mb-2 font-medium text-red-700">Before</div>
                <pre className="whitespace-pre-wrap text-xs text-red-700">{JSON.stringify(active.before, null, 2)}</pre>
              </div>
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="mb-2 font-medium text-green-700">After</div>
                <pre className="whitespace-pre-wrap text-xs text-green-700">{JSON.stringify(active.after, null, 2)}</pre>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
