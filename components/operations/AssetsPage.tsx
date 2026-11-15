"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CarFront, Plus, ShieldCheck, Wrench } from "lucide-react";

import { makeId, operationsStore, type AssetAssignmentHistory, type RegistryAsset } from "@/components/operations/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";

type AssetsTab = "registry" | "assignments" | "maintenance";

const tabs: Array<{ id: AssetsTab; label: string }> = [
  { id: "registry", label: "Registry" },
  { id: "assignments", label: "Assignments" },
  { id: "maintenance", label: "Maintenance" },
];

export function AssetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<AssetsTab>(
    (searchParams.get("tab") as AssetsTab | null) ?? "registry",
  );
  const [assets, setAssets] = React.useState<RegistryAsset[]>([]);
  const [history, setHistory] = React.useState<AssetAssignmentHistory[]>([]);
  const [detail, setDetail] = React.useState<any | null>(null);
  const [assetOpen, setAssetOpen] = React.useState(false);

  React.useEffect(() => {
    operationsStore.seed();
    const refresh = () => {
      setAssets(operationsStore.readAssets());
      setHistory(operationsStore.readAssetHistory());
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
    const next = (searchParams.get("tab") as AssetsTab | null) ?? "registry";
    setActiveTab(next);
  }, [searchParams]);

  function handleTab(tab: AssetsTab) {
    setActiveTab(tab);
    router.push(`/assets?tab=${tab}`);
  }

  const serviceDue = assets.filter((asset) => asset.next_service === "10/04/2024");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Registry"
        subtitle="Manage company assets, assignments, and maintenance history."
        actions={
          <>
            <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Export complete", message: "Asset register exported." })}>
              Export
            </Button>
            <Button onClick={() => setAssetOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard icon={ShieldCheck} value={assets.length} label="Registered Assets" iconColorClassName="bg-blue-100 text-primary" trend={{ value: "+8.0%", direction: "up" }} />
        <StatCard icon={CarFront} value={assets.filter((asset) => asset.status === "assigned").length} label="Assigned Assets" iconColorClassName="bg-emerald-100 text-emerald-700" trend={{ value: "+1.5%", direction: "up" }} />
        <StatCard icon={Wrench} value={serviceDue.length} label="Service Due" iconColorClassName="bg-amber-100 text-amber-700" trend={{ value: "+0.5%", direction: "up" }} />
        <StatCard icon={ShieldCheck} value={history.filter((item) => item.acknowledged === false).length} label="Unacknowledged" iconColorClassName="bg-orange-100 text-orange-700" trend={{ value: "-1.0%", direction: "down" }} />
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

      {activeTab === "registry" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <Link key={asset.id} href={`/assets/${asset.id}`} className="rounded-2xl border border-gray-200 bg-white p-5">
              <img src={asset.photo} alt={asset.name} className="h-44 w-full rounded-2xl object-cover" />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{asset.name}</div>
                  <div className="mt-1 text-sm text-gray-600">{asset.serial}</div>
                </div>
                <Badge variant={asset.status === "assigned" ? "info" : asset.status === "maintenance" ? "warning" : "success"}>{asset.status}</Badge>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-gray-700">
                <div>Category: {asset.category}</div>
                <div>Assigned To: {asset.assigned_to ?? "Available"}</div>
                <div>Value: {formatUGX(asset.value)}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      {activeTab === "assignments" ? (
        <DataTable
          data={history}
          rowKey={(row) => row.id}
          onRowClick={(row) => setDetail(row)}
          columns={[
            { key: "asset", header: "Asset", cell: (row) => assets.find((asset) => asset.id === row.asset_id)?.name ?? row.asset_id },
            { key: "employee", header: "Employee", cell: (row) => row.employee },
            { key: "date", header: "Assigned Date", cell: (row) => row.date },
            { key: "notes", header: "Notes", cell: (row) => row.notes },
            { key: "acknowledged", header: "Acknowledged", cell: (row) => <Badge variant={row.acknowledged ? "success" : "warning"}>{row.acknowledged ? "Yes" : "Pending"}</Badge> },
          ]}
          rowActions={(row) => [
            {
              label: row.acknowledged ? "Mark Unacknowledged" : "Acknowledge",
              onClick: () => {
                operationsStore.writeAssetHistory(
                  history.map((item) =>
                    item.id === row.id ? { ...item, acknowledged: !item.acknowledged } : item,
                  ),
                );
                showToast({ type: "success", title: "Updated", message: "Assignment acknowledgement updated." });
              },
            },
          ]}
        />
      ) : null}

      {activeTab === "maintenance" ? (
        <DataTable
          data={assets.filter((asset) => asset.next_service)}
          rowKey={(row) => row.id}
          onRowClick={(row) => router.push(`/assets/${row.id}`)}
          columns={[
            { key: "asset", header: "Asset", cell: (row) => <div><div className="font-medium text-gray-900">{row.name}</div><div className="text-xs text-gray-500">{row.serial}</div></div> },
            { key: "condition", header: "Condition", cell: (row) => <Badge variant={row.condition === "good" ? "success" : row.condition === "fair" ? "warning" : "error"}>{row.condition}</Badge> },
            { key: "assigned", header: "Assigned", cell: (row) => row.assigned_to ?? "-" },
            { key: "service", header: "Next Service", cell: (row) => row.next_service ?? "-" },
          ]}
          rowActions={(row) => [
            {
              label: "Mark Serviced",
              onClick: () => {
                operationsStore.writeAssets(
                  assets.map((asset) =>
                    asset.id === row.id ? { ...asset, next_service: "10/10/2024", condition: "good" } : asset,
                  ),
                );
                showToast({ type: "success", title: "Updated", message: `${row.name} marked as serviced.` });
              },
            },
          ]}
        />
      ) : null}

      <Modal open={assetOpen} onClose={() => setAssetOpen(false)} title="Add Asset">
        <Button
          onClick={() => {
            operationsStore.writeAssets([
              ...assets,
              {
                id: makeId("asset"),
                name: "HP LaserJet Pro",
                category: "Printers",
                serial: "HP-LJ-2300",
                photo: "https://picsum.photos/seed/printer1/400/300",
                purchased: "04/04/2024",
                value: 780000,
                condition: "good",
                assigned_to: null,
                status: "available",
                next_service: "04/10/2024",
              },
            ]);
            setAssetOpen(false);
            showToast({ type: "success", title: "Saved", message: "Asset added to registry." });
          }}
        >
          Save Asset
        </Button>
      </Modal>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Assignment Detail">
        {detail ? (
          <div className="space-y-3 text-sm text-gray-700">
            <div>Asset: {assets.find((asset) => asset.id === detail.asset_id)?.name ?? detail.asset_id}</div>
            <div>Employee: {detail.employee}</div>
            <div>Date: {detail.date}</div>
            <div>Notes: {detail.notes}</div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
