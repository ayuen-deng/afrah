"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { superAdminStore, type AdminFeatureFlag } from "@/components/super-admin/store";

type FormState = {
  name: string;
  description: string;
  roles: string[];
  enabled: boolean;
};

export function FeatureFlagsPage() {
  const { showToast } = useToast();
  const [flags, setFlags] = React.useState<AdminFeatureFlag[]>(superAdminStore.readFlags());
  const [active, setActive] = React.useState<AdminFeatureFlag | null>(null);
  const [pendingDisable, setPendingDisable] = React.useState<AdminFeatureFlag | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({ name: "", description: "", roles: ["ceo"], enabled: true });
  const [errors, setErrors] = React.useState<{ name?: string; description?: string }>({});

  React.useEffect(() => {
    superAdminStore.seed();
    const refresh = () => setFlags(superAdminStore.readFlags());
    refresh();
    window.addEventListener(superAdminStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(superAdminStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const writeFlags = (next: AdminFeatureFlag[]) => {
    superAdminStore.writeFlags(next);
    setFlags(next);
    if (active) {
      setActive(next.find((item) => item.id === active.id) ?? null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Feature Flags"
        subtitle="Enable or disable platform features in real time and manage rollout access."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Flag
          </Button>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Flag</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Roles</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Updated</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Toggle</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((flag) => (
                <tr key={flag.id} className="border-b border-slate-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setActive(flag)} className="text-left">
                      <div className="font-mono text-sm font-medium text-gray-900">{flag.name}</div>
                      <div className="text-sm text-gray-500">{flag.description}</div>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {flag.roles.map((role) => (
                        <Badge key={role} variant="info">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{flag.updated}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (flag.enabled) {
                          setPendingDisable(flag);
                          return;
                        }
                        writeFlags(flags.map((item) => (item.id === flag.id ? { ...item, enabled: true, updated: "04/04/2024" } : item)));
                        showToast({ type: "success", title: `Feature '${flag.name}' enabled`, message: "Availability updated immediately." });
                      }}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${flag.enabled ? "bg-green-500" : "bg-slate-300"}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${flag.enabled ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={Boolean(active)}
        title={active?.name ?? "Flag Detail"}
        onClose={() => setActive(null)}
        footer={
          active ? (
            <Button
              onClick={() => {
                writeFlags(flags.map((item) => (item.id === active.id ? { ...item, description: `${active.description} (edited)`, updated: "04/04/2024" } : item)));
                showToast({ type: "success", title: "Flag updated", message: "Flag details were saved." });
              }}
            >
              Edit Flag
            </Button>
          ) : undefined
        }
      >
        {active ? (
          <div className="space-y-4 text-sm text-gray-600">
            <div className="font-mono text-gray-900">{active.name}</div>
            <div>{active.description}</div>
            <div className="flex flex-wrap gap-2">
              {active.roles.map((role) => (
                <Badge key={role} variant="info">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(pendingDisable)}
        title="Disable Feature?"
        onClose={() => setPendingDisable(null)}
        footer={
          pendingDisable ? (
            <>
              <Button variant="secondary" onClick={() => setPendingDisable(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const target = pendingDisable;
                  if (!target) return;
                  writeFlags(flags.map((item) => (item.id === target.id ? { ...item, enabled: false, updated: "04/04/2024" } : item)));
                  showToast({ type: "error", title: `Feature '${target.name}' disabled`, message: "Users will no longer see this capability." });
                  setPendingDisable(null);
                }}
              >
                Disable
              </Button>
            </>
          ) : undefined
        }
      >
        {pendingDisable ? <div className="text-sm text-gray-600">Disable &apos;{pendingDisable.name}&apos;? Users will see this feature disabled.</div> : null}
      </Modal>

      <Modal
        open={addOpen}
        title="Add Flag"
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const nextErrors: { name?: string; description?: string } = {};
                if (!form.name.trim()) nextErrors.name = "Flag name is required.";
                if (form.name.includes(" ")) nextErrors.name = "Use underscores instead of spaces.";
                if (!form.description.trim()) nextErrors.description = "Description is required.";
                setErrors(nextErrors);
                if (Object.keys(nextErrors).length) return;
                const nextFlag: AdminFeatureFlag = {
                  id: `ff-${Date.now()}`,
                  name: form.name.trim(),
                  description: form.description.trim(),
                  enabled: form.enabled,
                  roles: form.roles,
                  updated: "04/04/2024",
                };
                writeFlags([nextFlag, ...flags]);
                setAddOpen(false);
                setForm({ name: "", description: "", roles: ["ceo"], enabled: true });
                showToast({ type: "success", title: "Feature flag created", message: `${nextFlag.name} is now available in the table.` });
              }}
            >
              Create Flag
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <input
              value={form.name}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
              placeholder="map_analytics"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
            />
            {errors.name ? <div className="mt-1 text-xs text-red-500">{errors.name}</div> : null}
          </div>
          <div>
            <textarea
              value={form.description}
              onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
              placeholder="Advanced map analytics for CEO"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
              rows={3}
            />
            {errors.description ? <div className="mt-1 text-xs text-red-500">{errors.description}</div> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {["ceo", "finance", "customer", "all"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm((state) => ({ ...state, roles: state.roles.includes(role) ? state.roles.filter((item) => item !== role) : [...state.roles, role] }))}
                className={`rounded-full px-3 py-2 text-sm ${form.roles.includes(role) ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
