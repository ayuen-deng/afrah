"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";

import { financeStore, makeFinanceId } from "@/components/finance/store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";

export function PettyCashPage() {
  const { showToast } = useToast();
  const [pettyCash, setPettyCash] = React.useState<any>(null);
  const [detail, setDetail] = React.useState<any | null>(null);
  const [withdrawOpen, setWithdrawOpen] = React.useState(false);
  const [replenishOpen, setReplenishOpen] = React.useState(false);

  React.useEffect(() => {
    financeStore.seed();
    const refresh = () => setPettyCash(financeStore.readPettyCash());
    refresh();
    window.addEventListener(financeStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(financeStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!pettyCash) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Petty Cash"
        subtitle="Track cash withdrawals, replenishment requests, and the petty cash ledger."
        actions={
          <>
            <Button variant="secondary" onClick={() => setWithdrawOpen(true)}>Log Withdrawal</Button>
            <Button onClick={() => setReplenishOpen(true)}>Request Replenishment</Button>
          </>
        }
      />

      <Card className={`p-6 ${pettyCash.balance < 100000 ? "border-red-200 bg-red-50" : ""}`}>
        <div className="text-xs uppercase tracking-wide text-gray-500">Current Balance</div>
        <div className={`mt-3 text-4xl font-bold ${pettyCash.balance < 100000 ? "text-red-700" : "text-gray-900"}`}>{formatUGX(pettyCash.balance)}</div>
      </Card>

      <DataTable<any>
        data={pettyCash.transactions}
        rowKey={(row) => row.id}
        onRowClick={(row) => setDetail(row)}
        columns={[
          { key: "date", header: "Date", cell: (row) => row.date },
          { key: "desc", header: "Description", cell: (row) => row.desc },
          { key: "taken", header: "Taken By", cell: (row) => row.taken_by },
          { key: "amount", header: "Amount", cell: (row) => formatUGX(row.amount) },
          { key: "balance", header: "Balance After", cell: (row) => formatUGX(row.balance_after) },
        ]}
      />

      <Card className="p-6">
        <div className="text-[18px] font-semibold text-gray-800">Replenishment History</div>
        <div className="mt-4 space-y-3">
          {pettyCash.replenishments.map((item: any) => (
            <div key={item.id} className="rounded-2xl border border-gray-200 p-4 text-sm text-gray-700">
              {item.date} - {formatUGX(item.amount)} - {item.reason} - {item.status}
            </div>
          ))}
        </div>
      </Card>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Transaction Detail">
        {detail ? (
          <div className="space-y-3 text-sm text-gray-700">
            <div>Description: {detail.desc}</div>
            <div>Taken By: {detail.taken_by}</div>
            <div>Amount: {formatUGX(detail.amount)}</div>
            <div>Receipt: {detail.receipt ? "Attached" : "Missing"}</div>
          </div>
        ) : null}
      </Modal>

      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Log Withdrawal">
        <div className="space-y-4 text-sm text-gray-700">
          <div>Description: Fuel for CEO&apos;s vehicle — client visit</div>
          <div>Amount: {formatUGX(80000)}</div>
          <Button
            onClick={() => {
              const amount = 80000;
              financeStore.writePettyCash({
                ...pettyCash,
                balance: pettyCash.balance - amount,
                transactions: [
                  {
                    id: makeFinanceId("pc"),
                    date: "04/04/2024",
                    desc: "Fuel for CEO's vehicle — client visit",
                    taken_by: "Fatuma Namutebi",
                    amount,
                    balance_after: pettyCash.balance - amount,
                    receipt: true,
                    type: "withdrawal",
                    status: "completed",
                  },
                  ...pettyCash.transactions,
                ],
              });
              setWithdrawOpen(false);
              showToast({ type: "success", title: "Logged", message: "Withdrawal recorded." });
            }}
          >
            Submit
          </Button>
        </div>
      </Modal>

      <Modal open={replenishOpen} onClose={() => setReplenishOpen(false)} title="Request Replenishment">
        <div className="space-y-4 text-sm text-gray-700">
          <div>Amount: {formatUGX(500000)}</div>
          <div>Reason: Restocking monthly petty cash</div>
          <Button
            onClick={() => {
              financeStore.writePettyCash({
                ...pettyCash,
                replenishments: [
                  {
                    id: makeFinanceId("rep"),
                    date: "04/04/2024",
                    amount: 500000,
                    reason: "Restocking monthly petty cash",
                    status: "pending",
                  },
                  ...pettyCash.replenishments,
                ],
              });
              setReplenishOpen(false);
              showToast({ type: "success", title: "Sent", message: "Request sent to CEO for approval." });
            }}
          >
            Submit
          </Button>
        </div>
      </Modal>
    </div>
  );
}
