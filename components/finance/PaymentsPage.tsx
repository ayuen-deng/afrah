"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";

import { financeStore } from "@/components/finance/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";
import { ArrowLeftRight, Landmark, Smartphone } from "lucide-react";

export function PaymentsPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = React.useState<any[]>([]);
  const [detail, setDetail] = React.useState<any | null>(null);
  const [reconciliation, setReconciliation] = React.useState(false);

  React.useEffect(() => {
    financeStore.seed();
    const refresh = () => setPayments(financeStore.readPayments());
    refresh();
    window.addEventListener(financeStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(financeStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const momoTotal = payments.filter((item) => item.method.includes("MoMo") || item.method.includes("Airtel")).reduce((sum, item) => sum + item.amount, 0);
  const bankTotal = payments.filter((item) => item.method.includes("Bank")).reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        subtitle="Review gateway settlements, reconcile invoice receipts, and inspect payment history."
        actions={<Button variant="secondary" onClick={() => setReconciliation((current) => !current)}>{reconciliation ? "Table View" : "Reconciliation View"}</Button>}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <StatCard icon={Smartphone} value={formatUGX(momoTotal)} label="Mobile Money" iconColorClassName="bg-amber-100 text-amber-700" trend={{ value: "+3.0%", direction: "up" }} />
        <StatCard icon={Landmark} value={formatUGX(bankTotal)} label="Bank Transfer" iconColorClassName="bg-blue-100 text-primary" trend={{ value: "+8.0%", direction: "up" }} />
        <StatCard icon={ArrowLeftRight} value={payments.filter((item) => item.matched).length} label="Reconciled" iconColorClassName="bg-emerald-100 text-emerald-700" trend={{ value: "+1.0%", direction: "up" }} />
      </div>

      {!reconciliation ? (
        <DataTable<any>
          data={payments}
          rowKey={(row) => row.id}
          onRowClick={(row) => setDetail(row)}
          columns={[
            { key: "date", header: "Date", cell: (row) => row.date },
            { key: "customer", header: "Customer", cell: (row) => row.customer },
            { key: "method", header: "Method", cell: (row) => row.method },
            { key: "amount", header: "Amount", cell: (row) => formatUGX(row.amount) },
            { key: "reference", header: "Reference", cell: (row) => row.reference },
            { key: "status", header: "Status", cell: (row) => <Badge variant={row.matched ? "success" : "warning"}>{row.matched ? "reconciled" : "pending"}</Badge> },
          ]}
          selectable={false}
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Unmatched Payments</div>
            <div className="mt-4 space-y-3">
              {payments.filter((payment) => !payment.matched).map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{payment.customer}</div>
                      <div className="text-sm text-gray-500">{payment.reference}</div>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span>{formatUGX(payment.amount)}</span>
                    <Button
                      onClick={() => {
                        financeStore.writePayments(payments.map((item) => item.id === payment.id ? { ...item, matched: true, gateway_status: "completed" } : item));
                        showToast({ type: "success", title: "Matched", message: "Payment matched to invoice." });
                      }}
                    >
                      Match
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Reconciled</div>
            <div className="mt-4 space-y-3">
              {payments.filter((payment) => payment.matched).map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                  {payment.customer} - {payment.reference} - {formatUGX(payment.amount)}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Payment Detail">
        {detail ? (
          <div className="space-y-3 text-sm text-gray-700">
            <div>Customer: {detail.customer}</div>
            <div>Booking Ref: {detail.booking_ref}</div>
            <div>Method: {detail.method}</div>
            <div>Amount: {formatUGX(detail.amount)}</div>
            <div>Reference: {detail.reference}</div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
