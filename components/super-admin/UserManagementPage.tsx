"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { superAdminStore, type AdminUser } from "@/components/super-admin/store";

function labelRole(role: string) {
  return role.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function UserManagementPage() {
  const params = useSearchParams();
  const { showToast } = useToast();
  const [users, setUsers] = React.useState<AdminUser[]>(superAdminStore.readUsers());
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState(params.get("status") ?? "all");
  const [active, setActive] = React.useState<AdminUser | null>(null);
  const [pendingAction, setPendingAction] = React.useState<null | { type: "suspend" | "reactivate" | "reset" | "logout"; user: AdminUser }>(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  React.useEffect(() => {
    superAdminStore.seed();
    const refresh = () => setUsers(superAdminStore.readUsers());
    refresh();
    window.addEventListener(superAdminStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(superAdminStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  React.useEffect(() => {
    setStatusFilter(params.get("status") ?? "all");
  }, [params]);

  const filtered = React.useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        search.length === 0 ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const mutateUsers = (updater: (current: AdminUser[]) => AdminUser[]) => {
    const next = updater(superAdminStore.readUsers());
    superAdminStore.writeUsers(next);
    setUsers(next);
    if (active) {
      setActive(next.find((item) => item.id === active.id) ?? null);
    }
  };

  const roles = Array.from(new Set(users.map((user) => user.role)));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="User Management" subtitle="Manage roles, account status, and sign-in controls across the platform." />

      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1fr,220px,220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users"
              className="w-full rounded-xl border border-gray-200 py-3 pl-9 pr-4 text-sm outline-none ring-0 transition focus:border-blue-500"
            />
          </label>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm">
            <option value="all">All roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {labelRole(role)}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} onClick={() => setActive(user)} className="cursor-pointer border-b border-slate-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                        {user.initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{labelRole(user.role)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.status === "active" ? "success" : "error"} dot>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{user.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={Boolean(active)} title={active?.name ?? "User"} onClose={() => setActive(null)}>
        {active ? (
          <div className="space-y-5">
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-900">Change Role</div>
              <select
                value={active.role}
                onChange={(event) => {
                  const nextRole = event.target.value;
                  mutateUsers((current) => current.map((user) => (user.id === active.id ? { ...user, role: nextRole } : user)));
                  showToast({ type: "success", title: "Role updated", message: `${active.name} is now assigned to ${labelRole(nextRole)}.` });
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
              >
                {["ceo", "finance", "designer", "customer", "super_admin", "technician", "internal_staff", "operations_manager", "head_of_design", "customer_service_rep", "sales_executive"].map((role) => (
                  <option key={role} value={role}>
                    {labelRole(role)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant={active.status === "active" ? "danger" : "secondary"} onClick={() => setPendingAction({ type: active.status === "active" ? "suspend" : "reactivate", user: active })}>
                {active.status === "active" ? "Suspend Account" : "Reactivate Account"}
              </Button>
              <Button variant="secondary" onClick={() => setPendingAction({ type: "reset", user: active })}>
                Reset Password
              </Button>
              <Button variant="secondary" onClick={() => setPendingAction({ type: "logout", user: active })}>
                Force Logout
              </Button>
              <Button variant="ghost" onClick={() => setHistoryOpen((value) => !value)}>
                {historyOpen ? "Hide Login History" : "Show Login History"}
              </Button>
            </div>

            {historyOpen ? (
              <Card className="space-y-3 bg-slate-50 p-4">
                {active.loginHistory.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-600">
                    <div className="font-medium text-gray-900">{entry.date}</div>
                    <div>{entry.device}</div>
                    <div>{entry.location}</div>
                  </div>
                ))}
              </Card>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(pendingAction)}
        title="Confirm Action"
        onClose={() => setPendingAction(null)}
        footer={
          pendingAction ? (
            <>
              <Button variant="secondary" onClick={() => setPendingAction(null)}>
                Cancel
              </Button>
              <Button
                variant={pendingAction.type === "suspend" ? "danger" : "primary"}
                onClick={() => {
                  const action = pendingAction;
                  if (!action) return;
                  if (action.type === "suspend" || action.type === "reactivate") {
                    mutateUsers((current) =>
                      current.map((user) =>
                        user.id === action.user.id ? { ...user, status: action.type === "suspend" ? "suspended" : "active" } : user,
                      ),
                    );
                    showToast({
                      type: "success",
                      title: action.type === "suspend" ? "Account suspended" : "Account reactivated",
                      message: `${action.user.name} account status has been updated.`,
                    });
                  }
                  if (action.type === "reset") {
                    showToast({ type: "success", title: "Password reset email sent", message: `Reset instructions sent to ${action.user.email}.` });
                  }
                  if (action.type === "logout") {
                    showToast({ type: "info", title: "All sessions terminated", message: `${action.user.name} has been forced to sign in again.` });
                  }
                  setPendingAction(null);
                }}
              >
                Confirm
              </Button>
            </>
          ) : undefined
        }
      >
        {pendingAction ? <div className="text-sm text-gray-600">Confirm {pendingAction.type} for {pendingAction.user.name}.</div> : null}
      </Modal>
    </div>
  );
}
