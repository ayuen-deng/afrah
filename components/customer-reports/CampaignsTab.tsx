"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ReportData } from "@/components/customer-reports/types";
import { ChartCard, DarkTooltip } from "@/components/customer-reports/shared";
import { StatCardSparkline } from "@/components/ui/StatCardSparkline";
import { formatUGX } from "@/lib/ugx";
import { cn } from "@/lib/cn";
import { CampaignCard } from "@/components/ui/CampaignCard";
import { mockBookings } from "@/lib/mockData";

type CampaignsTabProps = {
  data: ReportData;
  onRequestDetail: (title: string, content: React.ReactNode) => void;
  onChartMenuAction: (title: string, action: "view_larger" | "export_chart" | "download_png" | "add_to_report", chart: React.ReactNode) => void;
  onOpenExport: () => void;
  onNavigateToCampaign: (id: string) => void;
  onNavigateToFilteredCampaigns: (status: string) => void;
};

export function CampaignsTab({
  data,
  onRequestDetail,
  onChartMenuAction,
  onOpenExport,
  onNavigateToCampaign,
  onNavigateToFilteredCampaigns,
}: CampaignsTabProps) {
  const [filter, setFilter] = React.useState<"all" | "live" | "completed" | "scheduled">("all");

  const resolveCampaignId = React.useCallback((campaignName: string, screenName?: string) => {
    const lower = campaignName.toLowerCase();
    const byName = mockBookings.find((booking) =>
      `${booking.customer_name} ${booking.company} ${booking.ref}`.toLowerCase().includes(lower),
    );
    if (byName) return byName.id;
    const byScreen = mockBookings.find((booking) => screenName && booking.screen.toLowerCase().includes(screenName.toLowerCase()));
    return byScreen?.id ?? "bk-001";
  }, []);

  const totalPlays = data.plays_by_hour.reduce((sum, row) => sum + row.plays, 0);
  const avgDuration = `${Math.round(data.summary.total_airtime_hours / Math.max(data.summary.campaigns_run, 1))} hrs`;

  const historyRows = data.impressions_by_campaign.filter((row) => filter === "all" ? true : (row.status ?? "live") === filter);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCardSparkline label="TOTAL CAMPAIGNS" value={data.summary.campaigns_run} trendText="+1 this month" trendDirection="up" points={data.monthly_spend.map((row) => ({ value: row.campaigns }))} lineColor="#2563EB" />
        <StatCardSparkline label="AVG CAMPAIGN DURATION" value={avgDuration} trendText="Based on booked airtime" trendDirection="neutral" points={data.screen_usage.map((row) => ({ value: row.total_hours }))} lineColor="#7C3AED" />
        <StatCardSparkline label="APPROVAL RATE" value={`${data.summary.approval_rate}%`} trendText="Creative approvals" trendDirection={data.summary.approval_rate >= 70 ? "up" : "down"} points={data.creatives.map((row) => ({ value: row.quality_score }))} lineColor={data.summary.approval_rate >= 70 ? "#10B981" : "#F59E0B"} />
        <StatCardSparkline label="TOTAL PLAYS" value={totalPlays.toLocaleString("en-US")} trendText="+14.5% vs last period" trendDirection="up" points={data.plays_by_day.map((row) => ({ value: row.plays }))} lineColor="#0EA5E9" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard
          title="Campaigns Over Time"
          subtitle="Started vs completed"
          onMenuAction={(action) => onChartMenuAction("Campaigns Over Time", action, <CampaignsTrendChart data={data.monthly_spend} onPointClick={() => undefined} />)}
        >
          <CampaignsTrendChart
            data={data.monthly_spend}
            onPointClick={(month) => {
              const cards = mockBookings.filter((booking) => booking.start.includes(month) || month === "Apr");
              onRequestDetail(`${month} campaigns`, (
                <div className="grid gap-3 md:grid-cols-2">
                    {cards.length ? cards.map((booking) => (
                      <CampaignCard
                        key={booking.id}
                        title={booking.screen}
                        location={booking.screen}
                        startDate={booking.start}
                        endDate={booking.end}
                        status={booking.campaign_status}
                        amount={booking.amount}
                        duration={booking.duration}
                        reference={booking.ref}
                        image={booking.screen_image}
                        onClick={() => onNavigateToCampaign(booking.id)}
                      />
                  )) : <p className="text-sm text-gray-500">No campaigns in this period.</p>}
                </div>
              ));
            }}
          />
        </ChartCard>

        <ChartCard
          title="Campaign Status Breakdown"
          subtitle="Current campaign pipeline"
          onMenuAction={(action) => onChartMenuAction("Campaign Status Breakdown", action, <StatusBreakdown rows={data.campaigns_by_status} onClickStatus={() => undefined} />)}
        >
          <StatusBreakdown rows={data.campaigns_by_status} onClickStatus={onNavigateToFilteredCampaigns} />
        </ChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title="Plays Per Campaign"
          subtitle="Best performer insight"
          onMenuAction={(action) => onChartMenuAction("Plays Per Campaign", action, <PlaysPerCampaign rows={data.impressions_by_campaign} onClickBar={() => undefined} />)}
        >
          <PlaysPerCampaign
            rows={data.impressions_by_campaign}
            onClickBar={(campaign) => {
              const found = data.impressions_by_campaign.find((row) => row.campaign === campaign);
              onNavigateToCampaign(resolveCampaignId(campaign, found?.screen));
            }}
          />
          <p className="mt-3 text-sm text-gray-600">
            Best: <span className="font-semibold text-gray-900">Café Javas Promo</span> — 2,890 plays
          </p>
        </ChartCard>

        <ChartCard
          title="Plays by Day of Week"
          subtitle="Weekly distribution"
          onMenuAction={(action) => onChartMenuAction("Plays by Day of Week", action, <PlaysByDayChart rows={data.plays_by_day} onClickDay={() => undefined} />)}
        >
          <PlaysByDayChart rows={data.plays_by_day} onClickDay={(day) => onRequestDetail(`${day} detail`, <p className="text-sm text-gray-700">Campaigns running on {day} with total play and impression estimates.</p>)} />
        </ChartCard>

        <ChartCard
          title="Plays by Hour"
          subtitle="Peak hour analysis"
          onMenuAction={(action) => onChartMenuAction("Plays by Hour", action, <PlaysByHourArea rows={data.plays_by_hour} onClickPoint={() => undefined} />)}
        >
          <PlaysByHourArea rows={data.plays_by_hour} onClickPoint={(hour) => onRequestDetail(`${hour} hour detail`, <p className="text-sm text-gray-700">{hour} was selected. Detailed campaign/hour breakdown appears here.</p>)} />
        </ChartCard>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Campaign History Table</h3>
          <button type="button" onClick={onOpenExport} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Export Campaign Report</button>
        </div>
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {(["all", "live", "completed", "scheduled"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium",
                filter === status ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Campaign", "Screen", "Start", "End", "Duration", "Plays", "Est. Impressions", "Spend", "Status"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historyRows.map((row) => (
                <tr key={row.campaign} onClick={() => onNavigateToCampaign(resolveCampaignId(row.campaign, row.screen))} className="cursor-pointer border-b border-slate-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{row.campaign}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.screen}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.date.split("-")[0]}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.date.split("-")[1] ?? row.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.status === "scheduled" ? "14 days" : "3 hours"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.plays.toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{Math.round((row.impressions_low + row.impressions_high) / 2).toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatUGX(data.spend_by_screen.find((item) => row.screen.includes(item.screen.replace(" Screen", "")))?.spend ?? 0)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", row.status === "completed" ? "bg-gray-100 text-gray-700" : row.status === "scheduled" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700")}>
                      {row.status ?? "live"}
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

function CampaignsTrendChart({
  data,
  onPointClick,
}: {
  data: Array<{ month: string; campaigns: number }>;
  onPointClick: (month: string) => void;
}) {
  const completedData = data.map((row) => ({ ...row, completed: Math.max(0, row.campaigns - 1) }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={completedData}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <YAxis tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${value} campaigns`} />} />
          <Line type="monotone" dataKey="campaigns" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} onClick={(entry) => onPointClick(String((entry as { month?: string })?.month ?? ""))} />
          <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 2.5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatusBreakdown({
  rows,
  onClickStatus,
}: {
  rows: Array<{ status: string; count: number; color: string }>;
  onClickStatus: (status: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="count" nameKey="status" innerRadius={58} outerRadius={82} paddingAngle={3} onClick={(_, index) => onClickStatus(rows[index]?.status ?? "")}>
              {rows.map((row) => (
                <Cell key={row.status} fill={row.color} />
              ))}
            </Pie>
            <Tooltip content={<DarkTooltip formatter={(value, label) => `${label}: ${value}`} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {rows.map((row) => (
        <button key={row.status} type="button" onClick={() => onClickStatus(row.status)} className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-gray-50">
          <span className="flex items-center gap-2 text-sm text-gray-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
            {row.status}
          </span>
          <span className="text-sm font-semibold text-gray-900">{row.count}</span>
        </button>
      ))}
    </div>
  );
}

function PlaysPerCampaign({
  rows,
  onClickBar,
}: {
  rows: Array<{ campaign: string; plays: number; status?: string }>;
  onClickBar: (campaign: string) => void;
}) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical">
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <YAxis dataKey="campaign" type="category" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={11} width={92} />
          <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${value.toLocaleString("en-US")} plays`} />} />
          <Bar dataKey="plays" radius={[0, 8, 8, 0]} onClick={(_, index) => onClickBar(rows[index]?.campaign ?? "")}>
            {rows.map((row) => (
              <Cell key={row.campaign} fill={row.status === "scheduled" ? "#94A3B8" : row.status === "completed" ? "#10B981" : "#2563EB"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PlaysByDayChart({
  rows,
  onClickDay,
}: {
  rows: Array<{ day: string; plays: number }>;
  onClickDay: (day: string) => void;
}) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <YAxis tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${value.toLocaleString("en-US")} plays`} />} />
          <Bar dataKey="plays" radius={[8, 8, 0, 0]} onClick={(_, index) => onClickDay(rows[index]?.day ?? "")}>
            {rows.map((row) => (
              <Cell key={row.day} fill={row.day === "Sat" || row.day === "Sun" ? "#60A5FA" : "#2563EB"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PlaysByHourArea({
  rows,
  onClickPoint,
}: {
  rows: Array<{ hour: string; plays: number }>;
  onClickPoint: (hour: string) => void;
}) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="hour" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={10} interval={1} />
          <YAxis tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${value.toLocaleString("en-US")} plays`} />} />
          <Area dataKey="plays" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} strokeWidth={2.5} onClick={(entry) => onClickPoint(String((entry as { hour?: string })?.hour ?? ""))} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
