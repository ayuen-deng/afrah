"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

import { mockCustomers } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/Toast";

type Customer = (typeof mockCustomers)[number] & {
  vip?: boolean;
};

function readCustomers(): Customer[] {
  try {
    const raw = window.localStorage.getItem("afrah_cs_customers");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Customer[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCustomers(next: Customer[]) {
  window.localStorage.setItem("afrah_cs_customers", JSON.stringify(next));
  window.dispatchEvent(new Event("afrah_cs_customers_updated"));
}

export default function CustomerServiceCustomersPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [customers, setCustomers] = React.useState<Customer[]>([]);

  React.useEffect(() => {
    const stored = readCustomers();
    if (stored.length) {
      setCustomers(stored);
      return;
    }
    const seeded = (mockCustomers as Customer[]).map((c) => ({
      ...c,
      vip: c.status === "vip",
    }));
    writeCustomers(seeded);
    setCustomers(seeded);
  }, []);

  React.useEffect(() => {
    const onUpdate = () => setCustomers(readCustomers());
    window.addEventListener("afrah_cs_customers_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_cs_customers_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[24px] font-semibold text-gray-900">Customers</div>
        <div className="mt-1 text-sm text-gray-600">
          Click a row to open the customer profile.
        </div>
      </div>

      <DataTable
        data={customers}
        rowKey={(c) => c.id}
        onRowClick={(c) => router.push(`/customers/${c.id}`)}
        columns={[
          {
            key: "customer",
            header: "Customer",
            cell: (c) => (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.photo} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-gray-900">{c.name}</div>
                    {c.vip ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        <Star className="h-3.5 w-3.5" />
                        VIP
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-gray-500">{c.email}</div>
                </div>
              </div>
            ),
          },
          {
            key: "company",
            header: "Company",
            cell: (c) => <span className="text-sm text-gray-700">{c.company}</span>,
          },
          {
            key: "phone",
            header: "Phone",
            cell: (c) => <span className="font-mono text-sm text-gray-700">{c.phone}</span>,
            className: "whitespace-nowrap",
          },
          {
            key: "campaigns",
            header: "Campaigns",
            cell: (c) => <span className="text-sm text-gray-700">{c.total_campaigns}</span>,
            className: "whitespace-nowrap",
          },
          {
            key: "spent",
            header: "Spent",
            cell: (c) => <span className="font-medium">{formatUGX(c.total_spent)}</span>,
            className: "whitespace-nowrap",
          },
          {
            key: "last",
            header: "Last Campaign",
            cell: (c) => <span className="font-mono text-sm">{c.last_campaign}</span>,
            className: "whitespace-nowrap",
          },
          {
            key: "status",
            header: "Status",
            cell: (c) => (
              <Badge variant={c.vip ? "success" : "info"} dot>
                {c.vip ? "VIP" : "ACTIVE"}
              </Badge>
            ),
            className: "whitespace-nowrap",
          },
        ]}
        rowActions={(c) => [
          {
            label: "View",
            onClick: () => router.push(`/customers/${c.id}`),
          },
          {
            label: c.vip ? "Remove VIP" : "Make VIP",
            onClick: () => {
              const next = customers.map((x) => (x.id === c.id ? { ...x, vip: !x.vip } : x));
              setCustomers(next);
              writeCustomers(next);
              showToast({
                type: "success",
                title: "Updated",
                message: `${c.name} is now ${c.vip ? "not VIP" : "VIP"}.`,
              });
            },
          },
        ]}
      />

      <Card className="p-6">
        <div className="text-sm text-gray-700">
          VIP toggle is available in both the table menu and inside the customer profile.
        </div>
      </Card>
    </div>
  );
}

