"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Search } from "lucide-react";

import type { ReportData } from "@/components/customer-reports/types";
import { ChartCard, DarkTooltip } from "@/components/customer-reports/shared";
import { StatCardSparkline } from "@/components/ui/StatCardSparkline";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { formatUGX } from "@/lib/ugx";
import { cn } from "@/lib/cn";

type SpendingTabProps = {
  data: ReportData;
  onRequestDetail: (title: string, content: React.ReactNode) => void;
  onOpenExport: () => void;
  onChartMenuAction: (title: string, action: "view_larger" | "export_chart" | "download_png" | "add_to_report", chart: React.ReactNode) => void;
};

export function SpendingTab({
  data,
  onRequestDetail,
  onOpenExport,
  onChartMenuAction,
}: SpendingTabProps) {
  const [search, setSearch] = React.useState("");
  const [mode, setMode] = React.useState<"monthly" | "quarterly" | "yearly">("monthly");

  const transactions = React.useMemo(
    () =>
      data.impressions_by_campaign
        .filter((row) =>
          `${row.campaign} ${row.screen}`.toLowerCase().includes(search.toLowerCase()),
        )
        .map((row) => {
          const amount = data.spend_by_screen.find((screen) => row.screen.includes(screen.screen.replace(" Screen", "")))?.spend ?? 0;
          const vat = Math.round(amount * 0.18);
          return {
            date: row.date,
            campaign: row.campaign,
            screen: row.screen,
            duration: row.status === "scheduled" ? "14 days" : "3 hours",
            amount: amount - vat,
            vat,
            total: amount,
            method: amount > 500000 ? "Bank Transfer" : "MTN MoMo",
            status: row.status === "scheduled" ? "unpaid" : "paid",
          };
        }),
    [data.impressions_by_campaign, data.spend_by_screen, search],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCardSparkline
          label="TOTAL SPEND"
          value={formatUGX(data.summary.total_spend)}
          trendText={`+${data.summary.total_spend_trend}% vs last period`}
          trendDirection="up"
          points={data.monthly_spend.map((row) => ({ value: row.spend || 1 }))}
          lineColor="#2563EB"
        />
        <StatCardSparkline
          label="AVG CAMPAIGN VALUE"
          value={formatUGX(data.summary.avg_campaign_value)}
          trendText="Based on completed campaigns"
          trendDirection="neutral"
          points={data.spend_by_screen.map((row) => ({ value: row.spend || 1 }))}
          lineColor="#7C3AED"
        />
        <StatCardSparkline
          label="OUTSTANDING BALANCE"
          value={formatUGX(data.summary.outstanding_balance)}
          trendText={data.summary.outstanding_balance > 0 ? "Pay Now" : "No pending balance"}
          trendDirection={data.summary.outstanding_balance > 0 ? "down" : "up"}
          points={data.invoices_summary.map((row) => ({ value: row.unpaid || 0 }))}
          lineColor="#F59E0B"
          className={cn(data.summary.outstanding_balance > 0 && "bg-amber-50")}
          onClick={() => onRequestDetail("Outstanding invoices", <p className="text-sm text-gray-700">Open invoices tab to clear outstanding balance.</p>)}
        />
        <StatCardSparkline
          label="VAT PAID"
          value={formatUGX(data.vat_paid_total)}
          trendText="18% applied to all invoices"
          trendDirection="neutral"
          points={data.monthly_spend.map((row) => ({ value: Math.round(row.spend * 0.18) }))}
          lineColor="#10B981"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <ChartCard
          title="Spend Over Time"
          subtitle="Area trend by period"
          rightSlot={
            <div className="rounded-full bg-gray-100 p-1">
              {(["monthly", "quarterly", "yearly"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={cn(
                    "rounded-full px-2 py-1 text-[11px] font-medium",
                    mode === item ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-200",
                  )}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
          }
          onMenuAction={(action) =>
            onChartMenuAction("Spend Over Time", action, <div className="h-[70vh]"><SpendAreaChart rows={data.monthly_spend} /></div>)
          }
        >
          <SpendAreaChart rows={data.monthly_spend} />
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatUGX(data.summary.total_spend)}</p>
              <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                +{data.summary.total_spend_trend}% from last period
              </span>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Spend by Screen"
          subtitle="Vertical comparison"
          onMenuAction={(action) =>
            onChartMenuAction("Spend by Screen", action, <div className="h-[70vh]"><SpendScreenBars rows={data.spend_by_screen} onClickBar={() => undefined} /></div>)
          }
        >
          <SpendScreenBars
            rows={data.spend_by_screen}
            onClickBar={(screen) => {
              const row = data.screen_usage.find((item) => item.screen.includes(screen));
              onRequestDetail(`${screen} spend detail`, (
                <div className="space-y-2 text-sm text-gray-700">
                  <p>Total spend: <span className="font-semibold">{formatUGX(row?.spend ?? 0)}</span></p>
                  <p>Total hours: <span className="font-semibold">{row?.total_hours ?? 0}</span></p>
                  <LoadingButton onClick={() => undefined}>Book Again</LoadingButton>
                </div>
              ));
            }}
          />
          <div className="mt-4 text-sm text-gray-600">
            Best screen: <span className="font-semibold text-gray-900">Entebbe Road</span>
            <br />
            {formatUGX(data.spend_by_screen.reduce((max, row) => (row.spend > max.spend ? row : max)).spend)} — 92% of total spend
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title="Spend by Time Slot"
          subtitle="Nucleus progress style"
          onMenuAction={(action) => onChartMenuAction("Spend by Time Slot", action, <TimeSlotProgress rows={data.spend_by_time_slot} onClickRow={() => undefined} />)}
        >
          <TimeSlotProgress rows={data.spend_by_time_slot} onClickRow={(slot) => onRequestDetail(`${slot} campaigns`, <p className="text-sm text-gray-700">Filtering campaigns by selected slot.</p>)} />
        </ChartCard>

        <ChartCard
          title="Payment Methods"
          subtitle="Method split and trend"
          onMenuAction={(action) => onChartMenuAction("Payment Methods", action, <MethodStack rows={data.payment_methods} />)}
        >
          <MethodStack rows={data.payment_methods} />
        </ChartCard>

        <ChartCard
          title="Monthly Invoice Summary"
          subtitle="Paid vs outstanding"
          onMenuAction={(action) => onChartMenuAction("Monthly Invoice Summary", action, <InvoiceSummary rows={data.invoices_summary} onClickRow={() => undefined} />)}
        >
          <InvoiceSummary rows={data.invoices_summary} onClickRow={(month) => onRequestDetail(`${month} invoice list`, <p className="text-sm text-gray-700">Invoices for {month} loaded in detail view.</p>)} />
        </ChartCard>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-900">All Transactions</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search campaign or screen..."
                className="h-9 rounded-lg border border-gray-200 pl-7 pr-3 text-sm outline-none focus:border-blue-300"
              />
            </div>
            <LoadingButton variant="secondary" onClick={onOpenExport}>
              Export Transactions
            </LoadingButton>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Date", "Campaign", "Screen", "Duration", "Amount", "VAT", "Total", "Method", "Status"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((row, index) => (
                <tr key={`${row.campaign}-${index}`} className="border-b border-slate-100 last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{row.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.campaign}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.screen}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.duration}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatUGX(row.amount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatUGX(row.vat)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatUGX(row.total)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.method}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", row.status === "paid" ? "bg-green-100 text-green-700" : row.status === "overdue" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SpendAreaChart({ rows }: { rows: Array<{ month: string; spend: number }> }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <YAxis tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} tickFormatter={(value) => `${Math.round(value / 1_000_000)}M`} />
          <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${formatUGX(value)}`} />} />
          <Area type="monotone" dataKey="spend" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function SpendScreenBars({
  rows,
  onClickBar,
}: {
  rows: Array<{ screen: string; spend: number; color: string }>;
  onClickBar: (screen: string) => void;
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="screen" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <YAxis tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} tickFormatter={(value) => `${Math.round(value / 1_000_000)}M`} />
          <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${formatUGX(value)}`} />} />
          <Bar dataKey="spend" radius={[8, 8, 0, 0]} onClick={(_, index) => onClickBar(rows[index]?.screen ?? "")}>
            {rows.map((row) => (
              <Cell key={row.screen} fill={row.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TimeSlotProgress({
  rows,
  onClickRow,
}: {
  rows: Array<{ slot: string; spend: number; pct: number }>;
  onClickRow: (slot: string) => void;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <button key={row.slot} type="button" onClick={() => onClickRow(row.slot)} className="w-full rounded-lg border border-gray-100 p-2 text-left hover:bg-gray-50">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
            <span>{row.slot}</span>
            <span>{row.pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${row.pct}%`, opacity: 1 - index * 0.1 }} />
          </div>
          <div className="mt-1 text-xs font-semibold text-gray-900">{formatUGX(row.spend)}</div>
        </button>
      ))}
    </div>
  );
}

function MethodStack({ rows }: { rows: Array<{ method: string; pct: number }> }) {
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.method} className="rounded-lg border border-gray-100 p-3">
          <p className="text-xs text-gray-500">{row.method}</p>
          <p className="text-2xl font-bold text-gray-900">{row.pct}%</p>
          <p className="text-xs text-gray-500">{index === 0 ? "+0 this month" : "+1 this month"}</p>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 7 }).map((_, bar) => (
              <span
                key={`${row.method}-${bar}`}
                className={cn("h-8 w-2 rounded-full", index === 0 ? "bg-amber-400" : "bg-purple-500")}
                style={{ opacity: 0.3 + ((bar + 1) / 10) }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function InvoiceSummary({
  rows,
  onClickRow,
}: {
  rows: Array<{ month: string; invoices: number; paid: number; unpaid: number }>;
  onClickRow: (month: string) => void;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <button key={row.month} type="button" onClick={() => onClickRow(row.month)} className="flex w-full items-center justify-between rounded-lg border border-gray-100 p-2 text-left hover:bg-gray-50">
          <span className="text-sm font-medium text-gray-700">{row.month}</span>
          <span className="text-xs text-gray-500">
            <span className="text-green-600">● {row.paid} paid</span> • <span className="text-amber-600">● {row.unpaid} unpaid</span>
          </span>
        </button>
      ))}
      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
        <p className="font-semibold text-gray-900">3 total invoices</p>
        <p>2 paid | 1 outstanding</p>
      </div>
    </div>
  );
}
