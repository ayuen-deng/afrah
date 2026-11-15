"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { financeStore } from "@/components/finance/store";
import { ReportCard } from "@/components/finance/shared";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";

const reportTitles = ["Revenue", "Expense", "P&L", "VAT", "Receivables Aging", "Payroll Summary"];

export function ReportsPage() {
  const { showToast } = useToast();
  const [open, setOpen] = React.useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate operational finance reports with controls, charts, tables, and export actions."
        actions={<Button variant="secondary" onClick={() => showToast({ type: "success", title: "Batch export", message: "Report pack exported." })}>Export All</Button>}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {reportTitles.map((title) => (
          <ReportCard key={title} title={title} open={open === title} onToggle={() => setOpen((current) => current === title ? null : title)}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                <button type="button" className="rounded-lg border border-gray-200 px-3 py-2">Date Range</button>
                <button type="button" className="rounded-lg border border-gray-200 px-3 py-2">Group By Month</button>
                <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Exported", message: `${title} exported.` })}>Export</Button>
              </div>
              <div className="h-64 rounded-2xl border border-gray-200 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  {title === "Revenue" || title === "Expense" || title === "VAT" ? (
                    <LineChart data={financeStore.revenueChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}M`} />
                      <Tooltip formatter={(value) => formatUGX(Number(value ?? 0))} />
                      <Line dataKey={title === "Expense" ? "expenses" : "revenue"} stroke="#2563EB" strokeWidth={3} />
                    </LineChart>
                  ) : (
                    <BarChart data={financeStore.revenueChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}M`} />
                      <Tooltip formatter={(value) => formatUGX(Number(value ?? 0))} />
                      <Bar dataKey="revenue" fill="#2563EB" />
                      <Bar dataKey="expenses" fill="#EF4444" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
              <div className="rounded-2xl border border-gray-200">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">Month</th>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">Expenses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeStore.revenueChart.map((row) => (
                      <tr key={row.month} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-sm text-gray-700">{row.month}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatUGX(row.revenue)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatUGX(row.expenses)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ReportCard>
        ))}
      </div>
    </div>
  );
}
