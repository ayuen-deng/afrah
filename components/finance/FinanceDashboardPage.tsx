"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { financeStore, getFinanceDashboardStats } from "@/components/finance/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";
import { ArrowLeftRight, Receipt, Wallet, WalletCards } from "lucide-react";

export function FinanceDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [stats, setStats] = React.useState(() => getFinanceDashboardStats());
  const [payments, setPayments] = React.useState<any[]>([]);
  const [paymentModal, setPaymentModal] = React.useState<any | null>(null);

  React.useEffect(() => {
    financeStore.seed();
    const refresh = () => {
      setStats(getFinanceDashboardStats());
      setPayments(financeStore.readPayments());
    };
    refresh();
    window.addEventListener(financeStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(financeStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const budgets = [
    { label: "Operations", used: 96, tone: "amber" },
    { label: "Design", used: 72, tone: "green" },
    { label: "Sales", used: 61, tone: "green" },
    { label: "Finance", used: 48, tone: "green" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Dashboard"
        subtitle="Track revenue, tax exposure, receivables, budgets, and gateway activity."
        actions={<Button onClick={() => router.push("/invoices")}>Manage Invoices</Button>}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <button type="button" onClick={() => router.push("/invoices")} className="text-left">
          <StatCard icon={WalletCards} value={formatUGX(stats.revenueMonth)} label="Revenue This Month" iconColorClassName="bg-blue-100 text-primary" trend={{ value: "+81.6%", direction: "up" }} />
        </button>
        <button type="button" onClick={() => showToast({ type: "info", title: "VAT summary", message: "Estimated VAT summary opened." })} className="text-left">
          <StatCard icon={Receipt} value={formatUGX(stats.estVat)} label="Est. VAT" iconColorClassName="bg-amber-100 text-amber-700" trend={{ value: "+18.0%", direction: "up" }} />
        </button>
        <button type="button" onClick={() => router.push("/invoices")} className="text-left">
          <StatCard icon={Wallet} value={formatUGX(stats.pendingReceivables)} label="Pending Receivables" iconColorClassName="bg-red-100 text-red-700" trend={{ value: "+12.0%", direction: "up" }} />
        </button>
        <button type="button" onClick={() => router.push("/petty-cash")} className="text-left">
          <StatCard icon={ArrowLeftRight} value={formatUGX(stats.pettyCashBalance)} label="Petty Cash Balance" iconColorClassName="bg-emerald-100 text-emerald-700" trend={{ value: "+4.5%", direction: "up" }} />
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-[18px] font-semibold text-gray-800">Revenue vs Expenses</div>
            <Badge variant="info">Apr 2024</Badge>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financeStore.revenueChart}>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(value) => `${Math.round(value / 1000000)}M`} />
                <Tooltip formatter={(value, key) => [formatUGX(Number(value ?? 0)), key === "revenue" ? "Revenue" : "Expenses"]} />
                <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Department Budget</div>
          <div className="mt-5 space-y-5">
            {budgets.map((budget) => (
              <div key={budget.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{budget.label}</span>
                  <span className={`font-semibold ${budget.tone === "amber" ? "text-amber-700" : "text-emerald-700"}`}>{budget.used}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100">
                  <div className={`h-2 rounded-full ${budget.tone === "amber" ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${budget.used}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[18px] font-semibold text-gray-800">Live Gateway Ledger</div>
          <Button variant="secondary" onClick={() => router.push("/payments")}>Open Payments</Button>
        </div>
        <DataTable<any>
          data={payments}
          rowKey={(row) => row.id}
          onRowClick={(row) => setPaymentModal(row)}
          columns={[
            { key: "customer", header: "Customer", cell: (row) => row.customer },
            { key: "method", header: "Method", cell: (row) => row.method },
            { key: "reference", header: "Reference", cell: (row) => row.reference },
            { key: "amount", header: "Amount", cell: (row) => formatUGX(row.amount) },
            { key: "status", header: "Status", cell: (row) => <Badge variant={row.gateway_status === "failed" ? "error" : row.gateway_status === "pending" ? "warning" : "success"}>{row.gateway_status ?? row.status}</Badge> },
          ]}
          selectable={false}
        />
      </Card>

      {paymentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={() => setPaymentModal(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="text-lg font-semibold text-gray-900">Payment Detail</div>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div>Customer: {paymentModal.customer}</div>
              <div>Method: {paymentModal.method}</div>
              <div>Amount: {formatUGX(paymentModal.amount)}</div>
              <div>Reference: {paymentModal.reference}</div>
              <div>Booking Ref: {paymentModal.booking_ref}</div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button variant="secondary" onClick={() => setPaymentModal(null)}>Close</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
