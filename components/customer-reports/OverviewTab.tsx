"use client";

import * as React from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronRight } from "lucide-react";

import type { ReportData } from "@/components/customer-reports/types";
import { ChartCard, DarkTooltip, intensityColor, NumberWithHover } from "@/components/customer-reports/shared";
import { StatCardSparkline } from "@/components/ui/StatCardSparkline";
import { formatUGX } from "@/lib/ugx";
import { cn } from "@/lib/cn";

type OverviewTabProps = {
  data: ReportData;
  onRequestDetail: (title: string, content: React.ReactNode) => void;
  onChartMenuAction: (title: string, action: "view_larger" | "export_chart" | "download_png" | "add_to_report", chart: React.ReactNode) => void;
  onNavigateToStatus: (status: string) => void;
};

export function OverviewTab({
  data,
  onRequestDetail,
  onChartMenuAction,
  onNavigateToStatus,
}: OverviewTabProps) {
  const monthlyRef = React.useRef<HTMLDivElement | null>(null);
  const statusRef = React.useRef<HTMLDivElement | null>(null);
  const heatmapRef = React.useRef<HTMLDivElement | null>(null);

  const impressionsRows = data.impressions_by_campaign.map((row) => ({
    name: row.campaign,
    value: Math.round((row.impressions_low + row.impressions_high) / 2),
    status: row.status ?? "live",
  }));
  const paymentRows = data.payment_methods.map((item) => ({
    name: item.method,
    value: item.amount,
    color: item.method === "MTN MoMo" ? "#F59E0B" : "#7C3AED",
  }));
  const heatDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const heatHours = ["6AM", "7AM", "8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM", "8PM", "9PM", "10PM", "11PM"];
  const heatLookup = new Map(data.heatmap_data.map((row) => [`${row.day}-${row.hour}`, row.intensity]));

  const peakSlot = data.plays_by_hour.reduce((best, current) => (current.plays > best.plays ? current : best), data.plays_by_hour[0]);

  const statCards = [
    {
      label: "TOTAL SPEND",
      value: formatUGX(data.summary.total_spend),
      trendText: `+${data.summary.total_spend_trend}% vs last period`,
      trendDirection: "up" as const,
      lineColor: "#2563EB",
      points: data.monthly_spend.map((row) => ({ value: row.spend || 1 })),
      target: monthlyRef,
      hoverHint: `${formatUGX(data.summary.total_spend)} = Kampala + Garden City + Entebbe Road`,
    },
    {
      label: "EST. IMPRESSIONS",
      value: data.summary.total_impressions.toLocaleString("en-US"),
      trendText: `+${data.summary.total_impressions_trend}% vs last period`,
      trendDirection: "up" as const,
      lineColor: "#7C3AED",
      points: data.cumulative_reach.map((row) => ({ value: row.reach || 1 })),
      target: heatmapRef,
      hoverHint: `${data.summary.total_impressions.toLocaleString("en-US")} = all campaign estimates combined`,
    },
    {
      label: "CAMPAIGNS RUN",
      value: data.summary.campaigns_run.toLocaleString("en-US"),
      trendText: `+${data.summary.campaigns_trend} this month`,
      trendDirection: "up" as const,
      lineColor: "#10B981",
      points: data.monthly_spend.map((row) => ({ value: row.campaigns || 0 })),
      target: statusRef,
      hoverHint: `${data.summary.campaigns_run} total campaigns = live + scheduled + completed`,
    },
    {
      label: "TOTAL AIRTIME",
      value: `${data.summary.total_airtime_hours} hrs`,
      trendText: `+${data.summary.airtime_trend}% vs last period`,
      trendDirection: "up" as const,
      lineColor: "#F59E0B",
      points: data.screen_usage.map((row) => ({ value: row.total_hours || 0 })),
      target: heatmapRef,
      hoverHint: `${data.summary.total_airtime_hours} hours from all booked screens`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <StatCardSparkline
            key={item.label}
            label={item.label}
            value={<NumberWithHover value={item.value} hint={item.hoverHint} />}
            trendText={item.trendText}
            trendDirection={item.trendDirection}
            lineColor={item.lineColor}
            points={item.points}
            onClick={() => item.target.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div ref={monthlyRef}>
          <ChartCard
            title="Monthly Spend Trend"
            subtitle="Spend and campaign count by month"
            onMenuAction={(action) =>
              onChartMenuAction(
                "Monthly Spend Trend",
                action,
                <MonthlySpendChart data={data.monthly_spend} onBarClick={(month) => {
                  const rows = data.impressions_by_campaign.filter((item) => item.date.includes(month) || month === "Apr");
                  onRequestDetail("Campaigns in selected month", (
                    <div className="space-y-3">
                      {rows.length ? rows.map((row) => (
                        <div key={row.campaign} className="rounded-lg border border-gray-200 p-3">
                          <div className="font-medium text-gray-900">{row.campaign}</div>
                          <div className="text-sm text-gray-500">{row.screen} • {row.date}</div>
                        </div>
                      )) : <p className="text-sm text-gray-500">No campaigns in this month.</p>}
                    </div>
                  ));
                }} />,
              )
            }
          >
            <MonthlySpendChart
              data={data.monthly_spend}
              onBarClick={(month) => {
                const rows = data.impressions_by_campaign.filter((item) => item.date.includes(month) || month === "Apr");
                onRequestDetail("Campaigns in selected month", (
                  <div className="space-y-3">
                    {rows.length ? rows.map((row) => (
                      <div key={row.campaign} className="rounded-lg border border-gray-200 p-3">
                        <div className="font-medium text-gray-900">{row.campaign}</div>
                        <div className="text-sm text-gray-500">{row.screen} • {row.date}</div>
                      </div>
                    )) : <p className="text-sm text-gray-500">No campaigns in this month.</p>}
                  </div>
                ));
              }}
            />
            <div className="mt-4 flex items-end justify-between">
              <p className="text-xl font-bold text-gray-900">{formatUGX(data.summary.total_spend)} total</p>
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                +{data.summary.total_spend_trend}%
              </span>
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title="Spend by Screen"
          subtitle="Distribution across all used screens"
          onMenuAction={(action) =>
            onChartMenuAction("Spend by Screen", action, <SpendByScreenChart data={data.spend_by_screen} onSegmentClick={() => undefined} />)
          }
        >
          <SpendByScreenChart
            data={data.spend_by_screen}
            onSegmentClick={(name) => {
              const entry = data.spend_by_screen.find((row) => row.screen === name);
              onRequestDetail(`${name} usage detail`, (
                <div className="space-y-2 text-sm text-gray-700">
                  <p>Spend: <span className="font-semibold">{formatUGX(entry?.spend ?? 0)}</span></p>
                  <p>Campaigns: <span className="font-semibold">{entry?.campaigns ?? 0}</span></p>
                </div>
              ));
            }}
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div ref={statusRef}>
          <ChartCard
            title="Campaign Status"
            subtitle="Live vs scheduled vs completed"
            onMenuAction={(action) => onChartMenuAction("Campaign Status", action, <StatusDonutChart rows={data.campaigns_by_status} onClickStatus={onNavigateToStatus} />)}
          >
            <StatusDonutChart rows={data.campaigns_by_status} onClickStatus={onNavigateToStatus} />
          </ChartCard>
        </div>

        <ChartCard
          title="Impressions by Campaign"
          subtitle="Estimated average impressions"
          onMenuAction={(action) => onChartMenuAction("Impressions by Campaign", action, <ImpressionsBar rows={impressionsRows} onSelect={() => undefined} />)}
        >
          <ImpressionsBar
            rows={impressionsRows}
            onSelect={(name) => {
              const row = data.impressions_by_campaign.find((item) => item.campaign === name);
              if (!row) return;
              onRequestDetail(`${name} performance`, (
                <div className="space-y-2 text-sm text-gray-700">
                  <p>Screen: <span className="font-semibold">{row.screen}</span></p>
                  <p>Plays: <span className="font-semibold">{row.plays.toLocaleString("en-US")}</span></p>
                  <p>Est. impressions: <span className="font-semibold">{row.impressions_low.toLocaleString("en-US")} - {row.impressions_high.toLocaleString("en-US")}</span></p>
                </div>
              ));
            }}
          />
          <p className="mt-4 text-xl font-bold text-gray-900">
            {data.cumulative_reach[data.cumulative_reach.length - 1]?.reach.toLocaleString("en-US")} total estimated reach
          </p>
        </ChartCard>

        <ChartCard
          title="Payment Methods"
          subtitle="How invoices were paid"
          onMenuAction={(action) => onChartMenuAction("Payment Methods", action, <PaymentDonut rows={paymentRows} onSelect={() => undefined} />)}
        >
          <PaymentDonut
            rows={paymentRows}
            onSelect={(method) => {
              onRequestDetail(`${method} payments`, (
                <div className="space-y-2 text-sm text-gray-700">
                  {data.payment_methods.filter((row) => row.method === method).map((row) => (
                    <p key={row.method}>
                      <span className="font-semibold">{row.method}</span> — {formatUGX(row.amount)} ({row.pct}%)
                    </p>
                  ))}
                </div>
              ));
            }}
          />
        </ChartCard>
      </div>

      <div ref={heatmapRef}>
        <ChartCard
          title="Ad Performance Heatmap"
          subtitle="Plays by day and hour"
          onMenuAction={(action) => onChartMenuAction("Ad Performance Heatmap", action, <div className="text-sm text-gray-700">Heatmap larger view</div>)}
        >
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-1">
                <div />
                {heatDays.map((day) => (
                  <div key={day} className="py-1 text-center text-xs font-semibold uppercase text-gray-400">{day}</div>
                ))}

                {heatHours.map((hour) => (
                  <React.Fragment key={hour}>
                    <div className="py-2 pr-2 text-right text-xs text-gray-500">{hour}</div>
                    {heatDays.map((day) => {
                      const intensity = heatLookup.get(`${day}-${hour}`) ?? 0;
                      const found = data.plays_by_hour.find((row) => row.hour === hour);
                      const plays = Math.round((found?.plays ?? 0) * (intensity / 10 || 0));
                      return (
                        <button
                          key={`${day}-${hour}`}
                          type="button"
                          onClick={() => onRequestDetail(`${day} ${hour} performance`, (
                            <div className="space-y-2 text-sm text-gray-700">
                              <p>Estimated plays: <span className="font-semibold">{plays.toLocaleString("en-US")}</span></p>
                              <p>Campaigns likely active: Birthday Ad, Café Javas Promo</p>
                            </div>
                          ))}
                          className={cn(
                            "h-8 rounded-md border border-white transition hover:scale-[1.03]",
                            intensityColor(intensity),
                            intensity >= 7 ? "text-white" : "text-gray-700",
                          )}
                          title={`${day} ${hour} — ${plays.toLocaleString("en-US")} plays`}
                        >
                          <span className="text-[10px] font-semibold">{plays ? plays : ""}</span>
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Peak: Friday 8PM</div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{peakSlot.plays.toLocaleString("en-US")} plays</div>
            <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">91 total Fridays</div>
            <button
              type="button"
              onClick={() => onRequestDetail("Plays by hour details", (
                <div className="space-y-2 text-sm text-gray-700">
                  {data.plays_by_hour.map((row) => (
                    <div key={row.hour} className="flex justify-between rounded-md border border-gray-200 px-3 py-2">
                      <span>{row.hour}</span>
                      <span className="font-semibold">{row.plays.toLocaleString("en-US")} plays</span>
                    </div>
                  ))}
                </div>
              ))}
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View Slot Details
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function MonthlySpendChart({
  data,
  onBarClick,
}: {
  data: Array<{ month: string; spend: number; campaigns: number }>;
  onBarClick: (month: string) => void;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <YAxis yAxisId="left" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} tickFormatter={(value) => `${Math.round(value / 1_000_000)}M`} />
          <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${formatUGX(value)}`} />} />
          <Bar yAxisId="left" dataKey="spend" fill="#2563EB" radius={[8, 8, 0, 0]} onClick={(_, index) => onBarClick(data[index]?.month ?? "")} />
          <Line yAxisId="right" type="monotone" dataKey="campaigns" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function SpendByScreenChart({
  data,
  onSegmentClick,
}: {
  data: Array<{ screen: string; spend: number; campaigns: number; color: string }>;
  onSegmentClick: (name: string) => void;
}) {
  const total = data.reduce((sum, row) => sum + row.spend, 0);

  return (
    <>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="spend"
              nameKey="screen"
              innerRadius={56}
              outerRadius={80}
              paddingAngle={3}
              onClick={(_, index) => onSegmentClick(data[index]?.screen ?? "")}
            >
              {data.map((entry) => (
                <Cell key={entry.screen} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${formatUGX(value)}`} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {data.map((row) => (
          <button key={row.screen} type="button" onClick={() => onSegmentClick(row.screen)} className="flex w-full items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-gray-50">
            <span className="flex items-center gap-2 text-gray-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
              {row.screen}
            </span>
            <span className="font-semibold text-gray-900">{Math.round((row.spend / total) * 100)}%</span>
          </button>
        ))}
      </div>
    </>
  );
}

function StatusDonutChart({
  rows,
  onClickStatus,
}: {
  rows: Array<{ status: string; count: number; color: string }>;
  onClickStatus: (status: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="count" nameKey="status" innerRadius={52} outerRadius={76} paddingAngle={3} onClick={(_, index) => onClickStatus(rows[index]?.status ?? "")}>
              {rows.map((row) => (
                <Cell key={row.status} fill={row.color} />
              ))}
            </Pie>
            <Tooltip content={<DarkTooltip formatter={(value, label) => `${label}: ${value}`} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <button key={row.status} type="button" onClick={() => onClickStatus(row.status)} className="flex w-full items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-gray-50">
            <span className="flex items-center gap-2 text-gray-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
              {row.status}
            </span>
            <span className="font-semibold text-gray-900">{row.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ImpressionsBar({
  rows,
  onSelect,
}: {
  rows: Array<{ name: string; value: number; status: string }>;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart layout="vertical" data={rows}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={11} width={90} />
          <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${value.toLocaleString("en-US")} est.`} />} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} onClick={(entry) => onSelect(String(entry.name))}>
            {rows.map((row) => (
              <Cell key={row.name} fill={row.status === "scheduled" ? "#2563EB" : "#10B981"} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function PaymentDonut({
  rows,
  onSelect,
}: {
  rows: Array<{ name: string; value: number; color: string }>;
  onSelect: (method: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius={54} outerRadius={78} onClick={(item) => onSelect(String(item.name))}>
              {rows.map((row) => (
                <Cell key={row.name} fill={row.color} />
              ))}
            </Pie>
            <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${formatUGX(value)}`} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {rows.map((row) => (
        <button key={row.name} type="button" onClick={() => onSelect(row.name)} className="flex w-full items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-gray-50">
          <span className="flex items-center gap-2 text-gray-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
            {row.name}
          </span>
          <span className="font-semibold text-gray-900">{formatUGX(row.value)}</span>
        </button>
      ))}
    </div>
  );
}
