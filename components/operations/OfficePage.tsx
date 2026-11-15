"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ClipboardList, Droplets, Plus, Wrench } from "lucide-react";

import {
  makeId,
  operationsStore,
  type OfficeInventoryItem,
  type OfficeMaintenanceItem,
  type UtilityBill,
  type VendorItem,
} from "@/components/operations/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";

type OfficeTab = "inventory" | "maintenance" | "vendors" | "utilities";

const tabs: Array<{ id: OfficeTab; label: string }> = [
  { id: "inventory", label: "Inventory" },
  { id: "maintenance", label: "Maintenance" },
  { id: "vendors", label: "Vendors" },
  { id: "utilities", label: "Utilities" },
];

export function OfficePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<OfficeTab>(
    (searchParams.get("tab") as OfficeTab | null) ?? "inventory",
  );
  const [inventory, setInventory] = React.useState<OfficeInventoryItem[]>([]);
  const [maintenance, setMaintenance] = React.useState<OfficeMaintenanceItem[]>([]);
  const [vendors, setVendors] = React.useState<VendorItem[]>([]);
  const [utilities, setUtilities] = React.useState<UtilityBill[]>([]);
  const [detail, setDetail] = React.useState<any | null>(null);
  const [detailTitle, setDetailTitle] = React.useState("");
  const [inventoryOpen, setInventoryOpen] = React.useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = React.useState(false);
  const [vendorOpen, setVendorOpen] = React.useState(false);

  React.useEffect(() => {
    operationsStore.seed();
    const refresh = () => {
      setInventory(operationsStore.readOfficeInventory());
      setMaintenance(operationsStore.readOfficeMaintenance());
      setVendors(operationsStore.readVendors());
      setUtilities(operationsStore.readUtilities());
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
    const next = (searchParams.get("tab") as OfficeTab | null) ?? "inventory";
    setActiveTab(next);
  }, [searchParams]);

  function handleTab(tab: OfficeTab) {
    setActiveTab(tab);
    router.push(`/office?tab=${tab}`);
  }

  const utilityTotals = utilities.reduce(
    (totals, row) => ({
      electricity: totals.electricity + row.electricity,
      water: totals.water + row.water,
      internet: totals.internet + row.internet,
      rent: totals.rent + row.rent,
    }),
    { electricity: 0, water: 0, internet: 0, rent: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Office"
        subtitle="Track office inventory, maintenance, vendors, and monthly utilities."
        actions={
          <>
            <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Export complete", message: "Office report exported." })}>
              Export
            </Button>
            <Button
              onClick={() => {
                if (activeTab === "inventory") setInventoryOpen(true);
                if (activeTab === "maintenance") setMaintenanceOpen(true);
                if (activeTab === "vendors") setVendorOpen(true);
                if (activeTab === "utilities") {
                  showToast({ type: "info", title: "Synced", message: "Utility records refreshed." });
                }
              }}
            >
              <Plus className="h-4 w-4" />
              Add {tabs.find((tab) => tab.id === activeTab)?.label.slice(0, -1) ?? "Item"}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard icon={Building2} value={inventory.length} label="Inventory Items" iconColorClassName="bg-blue-100 text-primary" trend={{ value: "+6.0%", direction: "up" }} />
        <StatCard icon={Wrench} value={maintenance.filter((item) => item.status !== "Resolved").length} label="Open Maintenance" iconColorClassName="bg-amber-100 text-amber-700" trend={{ value: "-2.0%", direction: "down" }} />
        <StatCard icon={ClipboardList} value={vendors.length} label="Active Vendors" iconColorClassName="bg-emerald-100 text-emerald-700" trend={{ value: "+1.0%", direction: "up" }} />
        <StatCard icon={Droplets} value={formatUGX(utilityTotals.electricity + utilityTotals.water + utilityTotals.internet + utilityTotals.rent)} label="Utility Spend" iconColorClassName="bg-indigo-100 text-indigo-700" trend={{ value: "+3.5%", direction: "up" }} />
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
        <DataTable
          data={inventory}
          rowKey={(row) => row.id}
          onRowClick={(row) => {
            setDetailTitle(row.name);
            setDetail(row);
          }}
          columns={[
            { key: "item", header: "Item", cell: (row) => <div><div className="font-medium text-gray-900">{row.name}</div><div className="text-xs text-gray-500">{row.location}</div></div> },
            { key: "category", header: "Category", cell: (row) => row.category },
            { key: "condition", header: "Condition", cell: (row) => <Badge variant={row.condition === "good" ? "success" : row.condition === "fair" ? "warning" : "error"}>{row.condition}</Badge> },
            { key: "purchased", header: "Purchased", cell: (row) => row.purchased },
          ]}
          rowActions={(row) => [
            {
              label: "Schedule Maintenance",
              onClick: () => {
                operationsStore.writeOfficeMaintenance([
                  ...maintenance,
                  {
                    id: makeId("maint"),
                    issue: `${row.name} inspection`,
                    location: row.location,
                    priority: "Medium",
                    status: "Pending",
                    assigned_to: "TechSupport UG",
                  },
                ]);
                showToast({ type: "success", title: "Scheduled", message: `${row.name} added to maintenance.` });
              },
            },
          ]}
        />
      ) : null}

      {activeTab === "maintenance" ? (
        <DataTable
          data={maintenance}
          rowKey={(row) => row.id}
          onRowClick={(row) => {
            setDetailTitle(row.issue);
            setDetail(row);
          }}
          columns={[
            { key: "issue", header: "Issue", cell: (row) => <div><div className="font-medium text-gray-900">{row.issue}</div><div className="text-xs text-gray-500">{row.location}</div></div> },
            { key: "priority", header: "Priority", cell: (row) => <Badge variant={row.priority === "High" ? "error" : row.priority === "Medium" ? "warning" : "neutral"}>{row.priority}</Badge> },
            { key: "status", header: "Status", cell: (row) => <Badge variant={row.status === "Resolved" ? "success" : row.status === "In Progress" ? "info" : "warning"}>{row.status}</Badge> },
            { key: "assigned", header: "Assigned", cell: (row) => row.assigned_to ?? "-" },
          ]}
          rowActions={(row) => [
            {
              label: row.status === "Resolved" ? "Re-open" : "Mark Resolved",
              onClick: () => {
                operationsStore.writeOfficeMaintenance(
                  maintenance.map((item) =>
                    item.id === row.id
                      ? { ...item, status: item.status === "Resolved" ? "Pending" : "Resolved" }
                      : item,
                  ),
                );
                showToast({ type: "success", title: "Updated", message: "Maintenance status updated." });
              },
            },
          ]}
        />
      ) : null}

      {activeTab === "vendors" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vendors.map((vendor) => (
            <button
              key={vendor.id}
              type="button"
              onClick={() => {
                setDetailTitle(vendor.name);
                setDetail(vendor);
              }}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-left"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{vendor.name}</div>
                  <div className="mt-1 text-sm text-gray-600">{vendor.service}</div>
                </div>
                <Badge variant="info">{vendor.contact}</Badge>
              </div>
              <div className="mt-4 text-sm text-gray-700">{vendor.phone}</div>
              <div className="mt-4 text-xs uppercase tracking-wide text-gray-500">Recent Costs</div>
              <div className="mt-2 text-sm font-medium text-gray-900">{vendor.costs.map((cost) => formatUGX(cost)).join(" • ")}</div>
            </button>
          ))}
        </div>
      ) : null}

      {activeTab === "utilities" ? (
        <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
          <DataTable
            data={utilities}
            rowKey={(row) => row.id}
            onRowClick={(row) => {
              setDetailTitle(`${row.month} Utilities`);
              setDetail(row);
            }}
            columns={[
              { key: "month", header: "Month", cell: (row) => row.month },
              { key: "electricity", header: "Electricity", cell: (row) => formatUGX(row.electricity) },
              { key: "water", header: "Water", cell: (row) => formatUGX(row.water) },
              { key: "internet", header: "Internet", cell: (row) => formatUGX(row.internet) },
              { key: "rent", header: "Rent", cell: (row) => formatUGX(row.rent) },
            ]}
          />
          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Cost Snapshot</div>
            <div className="mt-5 space-y-4">
              {[
                ["Electricity", utilityTotals.electricity, "bg-red-500"],
                ["Water", utilityTotals.water, "bg-blue-500"],
                ["Internet", utilityTotals.internet, "bg-violet-500"],
                ["Rent", utilityTotals.rent, "bg-emerald-500"],
              ].map(([label, amount, color]) => {
                const total = utilityTotals.electricity + utilityTotals.water + utilityTotals.internet + utilityTotals.rent;
                const width = total ? (Number(amount) / total) * 100 : 0;
                return (
                  <div key={String(label)}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-semibold text-gray-900">{formatUGX(Number(amount))}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-gray-100">
                      <div className={`h-2 rounded-full ${color}`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : null}

      <Modal open={inventoryOpen} onClose={() => setInventoryOpen(false)} title="Add Inventory Item">
        <Button
          onClick={() => {
            operationsStore.writeOfficeInventory([
              ...inventory,
              {
                id: makeId("inv"),
                name: "Reception Sofa Set",
                category: "Furniture",
                location: "Reception",
                condition: "good",
                purchased: "04/04/2024",
              },
            ]);
            setInventoryOpen(false);
            showToast({ type: "success", title: "Saved", message: "Inventory item added." });
          }}
        >
          Save Item
        </Button>
      </Modal>

      <Modal open={maintenanceOpen} onClose={() => setMaintenanceOpen(false)} title="Log Maintenance Issue">
        <Button
          onClick={() => {
            operationsStore.writeOfficeMaintenance([
              ...maintenance,
              {
                id: makeId("maint"),
                issue: "Air conditioner service",
                location: "Boardroom",
                priority: "High",
                status: "Pending",
                assigned_to: "Kampala Electricals",
              },
            ]);
            setMaintenanceOpen(false);
            showToast({ type: "success", title: "Logged", message: "Maintenance issue created." });
          }}
        >
          Save Issue
        </Button>
      </Modal>

      <Modal open={vendorOpen} onClose={() => setVendorOpen(false)} title="Add Vendor">
        <Button
          onClick={() => {
            operationsStore.writeVendors([
              ...vendors,
              {
                id: makeId("vendor"),
                name: "Nile Cleaning Services",
                service: "Cleaning",
                contact: "Esther",
                phone: "0705000004",
                costs: [90000],
              },
            ]);
            setVendorOpen(false);
            showToast({ type: "success", title: "Added", message: "Vendor created." });
          }}
        >
          Save Vendor
        </Button>
      </Modal>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detailTitle}>
        {detail ? (
          <div className="space-y-3 text-sm text-gray-700">
            {Object.entries(detail).map(([key, value]) => (
              <div key={key} className="flex items-start justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0">
                <span className="font-medium capitalize text-gray-500">{key.replaceAll("_", " ")}</span>
                <span className="text-right text-gray-900">{Array.isArray(value) ? value.join(", ") : String(value)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
