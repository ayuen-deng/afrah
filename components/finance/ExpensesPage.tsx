"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { financeStore, makeFinanceId } from "@/components/finance/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export function ExpensesPage() {
  const { showToast } = useToast();
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [detail, setDetail] = React.useState<any | null>(null);
  const [logOpen, setLogOpen] = React.useState(false);

  React.useEffect(() => {
    financeStore.seed();
    const refresh = () => setExpenses(financeStore.readExpenses());
    refresh();
    window.addEventListener(financeStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(financeStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const byCategory = Object.values(
    expenses.reduce((acc: Record<string, { name: string; value: number }>, expense) => {
      acc[expense.category] = acc[expense.category]
        ? { ...acc[expense.category], value: acc[expense.category].value + expense.amount }
        : { name: expense.category, value: expense.amount };
      return acc;
    }, {}),
  );

  const budgets = [
    { dept: "Operations", used: 96 },
    { dept: "Design", used: 74 },
    { dept: "Sales", used: 52 },
    { dept: "Finance", used: 35 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        subtitle="Categorize company spend, inspect receipts, and keep department budgets current."
        actions={
          <>
            <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Export complete", message: "Expense export generated." })}>Export</Button>
            <Button onClick={() => setLogOpen(true)}>Log Expense</Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr,1.1fr]">
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">By Category</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100}>
                  {byCategory.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatUGX(Number(value ?? 0))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Department Budget</div>
          <div className="mt-5 space-y-5">
            {budgets.map((budget) => (
              <div key={budget.dept}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{budget.dept}</span>
                  <span className={`font-semibold ${budget.used > 90 ? "text-amber-700" : "text-emerald-700"}`}>{budget.used}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100">
                  <div className={`h-2 rounded-full ${budget.used > 90 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${budget.used}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <DataTable<any>
        data={expenses}
        rowKey={(row) => row.id}
        onRowClick={(row) => setDetail(row)}
        columns={[
          { key: "date", header: "Date", cell: (row) => row.date },
          { key: "category", header: "Category", cell: (row) => <Badge variant="info">{row.category}</Badge> },
          { key: "dept", header: "Department", cell: (row) => row.dept },
          { key: "desc", header: "Description", cell: (row) => row.description },
          { key: "amount", header: "Amount", cell: (row) => formatUGX(row.amount) },
          { key: "receipt", header: "Receipt", cell: (row) => row.receipt ? "📎" : "⚠️" },
          { key: "sync", header: "Sync", cell: (row) => row.synced ? "✓" : "…" },
        ]}
      />

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Expense Detail">
        {detail ? (
          <div className="space-y-3 text-sm text-gray-700">
            <div>{detail.description}</div>
            <div>Department: {detail.dept}</div>
            <div>Amount: {formatUGX(detail.amount)}</div>
            <div>{detail.receipt ? "Receipt attached" : "No receipt attached ⚠️"}</div>
            <Button variant="danger" onClick={() => showToast({ type: "info", title: "Cancelled", message: "Delete expense cancelled." })}>Delete Expense</Button>
          </div>
        ) : null}
      </Modal>

      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Log Expense">
        <div className="space-y-4">
          <div className="text-sm text-gray-700">Category: Utilities | Department: Operations | Receipt attached</div>
          <Button
            onClick={() => {
              financeStore.writeExpenses([
                ...expenses,
                {
                  id: makeFinanceId("exp"),
                  date: "04/04/2024",
                  category: "Utilities",
                  dept: "Operations",
                  description: "Backup internet package",
                  amount: 180000,
                  receipt: true,
                  synced: false,
                  status: "logged",
                },
              ]);
              setLogOpen(false);
              showToast({ type: "success", title: "Logged", message: "Expense created and budget updated." });
            }}
          >
            Save Expense
          </Button>
        </div>
      </Modal>
    </div>
  );
}
