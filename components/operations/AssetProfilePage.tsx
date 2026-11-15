"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { makeId, operationsStore } from "@/components/operations/store";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";

const tabs = ["overview", "history", "maintenance"] as const;

export function AssetProfilePage({ assetId }: { assetId: string }) {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [asset, setAsset] = React.useState<any | null>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  const [tab, setTab] = React.useState<string>(searchParams.get("tab") ?? "overview");
  const [detail, setDetail] = React.useState<any | null>(null);
  const [issueOpen, setIssueOpen] = React.useState(false);

  React.useEffect(() => {
    operationsStore.seed();
    const refresh = () => {
      setAsset(operationsStore.readAssets().find((item) => item.id === assetId) ?? null);
      setHistory(operationsStore.readAssetHistory().filter((item) => item.asset_id === assetId));
    };
    refresh();
    window.addEventListener(operationsStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(operationsStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [assetId]);

  if (!asset) {
    return <Card className="p-6">Asset not found.</Card>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-3">
              <BackButton />
              <div className="flex items-center gap-4">
                <img src={asset.photo} alt={asset.name} className="h-24 w-24 rounded-2xl object-cover" />
                <div>
                  <div className="text-[24px] font-semibold text-gray-900">{asset.name}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="info">{asset.serial}</Badge>
                    <Badge variant={asset.status === "assigned" ? "info" : asset.status === "available" ? "success" : "warning"}>{asset.status}</Badge>
                    <Badge variant={asset.condition === "good" ? "success" : asset.condition === "fair" ? "warning" : "error"}>{asset.condition}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIssueOpen(true)}>Report Issue</Button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Value", formatUGX(asset.value)],
            ["Category", asset.category],
            ["Assigned To", asset.assigned_to ?? "Available"],
            ["Next Service", asset.next_service ?? "-"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-gray-200 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
              <div className="mt-2 text-lg font-semibold text-gray-900">{value}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === item ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </Card>

      {tab === "overview" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Overview</div>
            <div className="mt-4 grid gap-3 text-sm text-gray-700">
              <div>Purchased: {asset.purchased}</div>
              <div>Serial: {asset.serial}</div>
              <div>Assigned To: {asset.assigned_to ?? "Available"}</div>
              <div>Assigned ID: {asset.assigned_id ?? "-"}</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Service Readiness</div>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {asset.name === "Toyota Hiace Van"
                ? "Service due in 6 days. Keep amber reminder visible."
                : `Next service scheduled for ${asset.next_service ?? "not set"}.`}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "history" ? (
        <DataTable
          data={history}
          rowKey={(row) => row.id}
          selectable={false}
          onRowClick={(row) => setDetail(row)}
          columns={[
            { key: "employee", header: "Employee", cell: (row) => row.employee },
            { key: "date", header: "Date", cell: (row) => row.date },
            { key: "notes", header: "Notes", cell: (row) => row.notes },
            { key: "ack", header: "Acknowledged", cell: (row) => <Badge variant={row.acknowledged ? "success" : "warning"}>{row.acknowledged ? "Yes" : "Pending"}</Badge> },
          ]}
        />
      ) : null}

      {tab === "maintenance" ? (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-[18px] font-semibold text-gray-800">Maintenance Actions</div>
            <Button
              onClick={() => {
                operationsStore.writeAssetHistory([
                  ...operationsStore.readAssetHistory(),
                  {
                    id: makeId("hist-asset"),
                    asset_id: asset.id,
                    employee: asset.assigned_to ?? "Stores",
                    date: "04/04/2024",
                    notes: "Preventive service booked",
                    acknowledged: true,
                  },
                ]);
                operationsStore.writeAssets(
                  operationsStore.readAssets().map((item) =>
                    item.id === asset.id ? { ...item, next_service: "10/10/2024", condition: "good" } : item,
                  ),
                );
                showToast({ type: "success", title: "Updated", message: "Maintenance completed." });
              }}
            >
              Mark Serviced
            </Button>
          </div>
          <div className="mt-4 text-sm text-gray-700">
            Schedule, history, and reminders stay here for each asset.
          </div>
        </Card>
      ) : null}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="History Detail">
        {detail ? (
          <div className="space-y-2 text-sm text-gray-700">
            <div>Employee: {detail.employee}</div>
            <div>Date: {detail.date}</div>
            <div>Notes: {detail.notes}</div>
            <div>Status: {detail.acknowledged ? "Acknowledged" : "Pending acknowledgement"}</div>
          </div>
        ) : null}
      </Modal>

      <Modal open={issueOpen} onClose={() => setIssueOpen(false)} title="Report Asset Issue">
        <Button
          onClick={() => {
            operationsStore.writeAssets(
              operationsStore.readAssets().map((item) =>
                item.id === asset.id ? { ...item, status: "maintenance", condition: "fair" } : item,
              ),
            );
            setIssueOpen(false);
            showToast({ type: "success", title: "Reported", message: "Asset moved to maintenance." });
          }}
        >
          Submit Issue
        </Button>
      </Modal>
    </div>
  );
}
