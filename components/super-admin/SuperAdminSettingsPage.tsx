"use client";

import * as React from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { superAdminStore, type SuperAdminSettings } from "@/components/super-admin/store";

export function SuperAdminSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = React.useState<SuperAdminSettings>(superAdminStore.readSettings());
  const [pendingMaintenance, setPendingMaintenance] = React.useState(false);
  const [pendingGateway, setPendingGateway] = React.useState<keyof SuperAdminSettings["gateways"] | null>(null);

  React.useEffect(() => {
    superAdminStore.seed();
    const refresh = () => setSettings(superAdminStore.readSettings());
    refresh();
    window.addEventListener(superAdminStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(superAdminStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const writeSettings = (next: SuperAdminSettings, toastTitle = "Settings saved") => {
    superAdminStore.writeSettings(next);
    setSettings(next);
    showToast({ type: "success", title: toastTitle, message: "Platform settings updated." });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Settings" subtitle="Control app identity, upload limits, payment gateways, VAT, and maintenance mode." />

      <Card className="space-y-4">
        <div className="text-lg font-semibold text-gray-900">App Settings</div>
        <input value={settings.appName} onChange={(event) => setSettings((state) => ({ ...state, appName: event.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm" />
        <Button onClick={() => writeSettings(settings)}>Save App Name</Button>
      </Card>

      <Card className="space-y-4">
        <div className="text-lg font-semibold text-gray-900">File Upload Settings</div>
        <div className="grid gap-4 md:grid-cols-2">
          <input type="number" value={settings.maxImageMb} onChange={(event) => setSettings((state) => ({ ...state, maxImageMb: Number(event.target.value) }))} className="rounded-xl border border-gray-200 px-4 py-3 text-sm" />
          <input type="number" value={settings.maxVideoMb} onChange={(event) => setSettings((state) => ({ ...state, maxVideoMb: Number(event.target.value) }))} className="rounded-xl border border-gray-200 px-4 py-3 text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          {["JPG", "PNG", "MP4", "MOV"].map((format) => (
            <button
              key={format}
              type="button"
              onClick={() =>
                setSettings((state) => ({
                  ...state,
                  acceptedFormats: state.acceptedFormats.includes(format)
                    ? state.acceptedFormats.filter((item) => item !== format)
                    : [...state.acceptedFormats, format],
                }))
              }
              className={`rounded-full px-3 py-2 text-sm ${settings.acceptedFormats.includes(format) ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
            >
              {format}
            </button>
          ))}
        </div>
        <Button onClick={() => writeSettings(settings, "Upload settings saved")}>Save Upload Settings</Button>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">Payment Settings</div>
          <Badge variant="info">VAT {settings.vatRate}%</Badge>
        </div>
        <div className="space-y-3">
          {([
            ["mtn", "MTN MoMo"],
            ["airtel", "Airtel Money"],
            ["card", "Card Payments"],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
              <span className="text-sm text-gray-700">{label}</span>
              <button
                type="button"
                onClick={() => {
                  if (settings.gateways[key]) {
                    setPendingGateway(key);
                    return;
                  }
                  writeSettings({ ...settings, gateways: { ...settings.gateways, [key]: true } }, `${label} enabled`);
                }}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${settings.gateways[key] ? "bg-green-500" : "bg-slate-300"}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${settings.gateways[key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="text-lg font-semibold text-gray-900">Maintenance Mode</div>
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-sm text-amber-800">When enabled, all users are locked out immediately.</div>
          <Button variant="danger" onClick={() => setPendingMaintenance(true)}>
            {settings.maintenanceMode ? "Disable" : "Enable"} Maintenance
          </Button>
        </div>
      </Card>

      <Modal
        open={Boolean(pendingGateway)}
        title="Disable Gateway?"
        onClose={() => setPendingGateway(null)}
        footer={
          pendingGateway ? (
            <>
              <Button variant="secondary" onClick={() => setPendingGateway(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const key = pendingGateway;
                  if (!key) return;
                  writeSettings({ ...settings, gateways: { ...settings.gateways, [key]: false } }, `${key} disabled`);
                  setPendingGateway(null);
                }}
              >
                Disable
              </Button>
            </>
          ) : undefined
        }
      >
        <div className="text-sm text-gray-600">Disable {pendingGateway === "airtel" ? "Airtel Money" : pendingGateway}? Payments through this channel will stop immediately.</div>
      </Modal>

      <Modal
        open={pendingMaintenance}
        title="Enable Maintenance Mode?"
        onClose={() => setPendingMaintenance(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingMaintenance(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                writeSettings({ ...settings, maintenanceMode: !settings.maintenanceMode }, settings.maintenanceMode ? "Maintenance mode disabled" : "Maintenance mode enabled");
                setPendingMaintenance(false);
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="text-sm text-gray-600">Enable maintenance mode? All users will be locked out immediately.</div>
      </Modal>
    </div>
  );
}
