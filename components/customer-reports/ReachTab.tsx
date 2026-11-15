"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ReportData } from "@/components/customer-reports/types";
import { ChartCard, DarkTooltip, intensityColor } from "@/components/customer-reports/shared";
import { StatCardSparkline } from "@/components/ui/StatCardSparkline";
import { cn } from "@/lib/cn";

type ReachTabProps = {
  data: ReportData;
  onRequestDetail: (title: string, content: React.ReactNode) => void;
  onChartMenuAction: (title: string, action: "view_larger" | "export_chart" | "download_png" | "add_to_report", chart: React.ReactNode) => void;
};

export function ReachTab({
  data,
  onRequestDetail,
  onChartMenuAction,
}: ReachTabProps) {
  const peakHour = data.plays_by_hour.reduce((best, row) => (row.plays > best.plays ? row : best), data.plays_by_hour[0]);
  const bestLocation = data.location_breakdown.reduce((best, row) => (row.impressions > best.impressions ? row : best), data.location_breakdown[0]);

  const totalReach = data.cumulative_reach[data.cumulative_reach.length - 1]?.reach ?? 0;
  const avgReach = Math.round(totalReach / Math.max(data.summary.campaigns_run, 1));

  const heatDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const heatHours = ["6AM", "7AM", "8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM", "8PM", "9PM", "10PM", "11PM"];
  const heatLookup = new Map(data.heatmap_data.map((row) => [`${row.day}-${row.hour}`, row.intensity]));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCardSparkline label="TOTAL EST. REACH" value={totalReach.toLocaleString("en-US")} trendText="+8.2% from last period" trendDirection="up" points={data.cumulative_reach.map((row) => ({ value: row.reach }))} lineColor="#10B981" />
        <StatCardSparkline label="AVG REACH/CAMPAIGN" value={avgReach.toLocaleString("en-US")} trendText="Average by active campaign" trendDirection="neutral" points={data.reach_by_screen.map((row) => ({ value: row.reach }))} lineColor="#2563EB" />
        <StatCardSparkline label="PEAK HOUR" value={peakHour.hour} trendText={`${peakHour.plays} plays`} trendDirection="up" points={data.plays_by_hour.map((row) => ({ value: row.plays }))} lineColor="#7C3AED" />
        <StatCardSparkline label="BEST LOCATION" value={bestLocation.type} trendText={`${bestLocation.impressions.toLocaleString("en-US")} est. reach`} trendDirection="up" points={data.location_breakdown.map((row) => ({ value: row.impressions }))} lineColor="#0EA5E9" />
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        ℹ️ Reach estimates are based on verified foot traffic data from our screen locations. Actual reach may vary.
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Cumulative Reach Over Time"
          subtitle="Total audience growth"
          onMenuAction={(action) => onChartMenuAction("Cumulative Reach Over Time", action, <ReachArea rows={data.cumulative_reach} onClickPoint={() => undefined} />)}
        >
          <ReachArea rows={data.cumulative_reach} onClickPoint={(month) => onRequestDetail(`${month} reach detail`, <p className="text-sm text-gray-700">{month} reach growth details opened.</p>)} />
          <div className="mt-3 text-sm text-gray-600">
            <span className="text-xl font-bold text-gray-900">{totalReach.toLocaleString("en-US")}</span>
            <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">+8.2% from last period</span>
          </div>
        </ChartCard>

        <ChartCard
          title="Reach by Screen"
          subtitle="Estimated people reached"
          onMenuAction={(action) => onChartMenuAction("Reach by Screen", action, <ReachByScreen rows={data.reach_by_screen} onClickBar={() => undefined} />)}
        >
          <ReachByScreen rows={data.reach_by_screen} onClickBar={(screen) => onRequestDetail(`${screen} reach detail`, <p className="text-sm text-gray-700">Traffic and time breakdown for {screen}.</p>)} />
          <p className="mt-3 text-sm text-gray-600">
            Best reach: <span className="font-semibold text-gray-900">Garden City Screen</span> — 41,500 estimated people
          </p>
        </ChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title="Reach by Daypart"
          subtitle="Most valuable windows"
          onMenuAction={(action) => onChartMenuAction("Reach by Daypart", action, <DaypartProgress rows={data.reach_by_daypart} />)}
        >
          <DaypartProgress rows={data.reach_by_daypart} />
        </ChartCard>

        <ChartCard
          title="Ad Frequency Estimate"
          subtitle="Exposure per person"
          onMenuAction={(action) => onChartMenuAction("Ad Frequency Estimate", action, <FrequencyCard />)}
        >
          <FrequencyCard />
        </ChartCard>

        <ChartCard
          title="Best Performing Time"
          subtitle="Peak play window"
          onMenuAction={(action) => onChartMenuAction("Best Performing Time", action, <BestTimeCard rows={data.plays_by_hour} />)}
        >
          <BestTimeCard rows={data.plays_by_hour} />
        </ChartCard>
      </div>

      <ChartCard
        title="Your Reach by Day & Hour"
        subtitle="Estimated audience size per time slot"
        onMenuAction={(action) => onChartMenuAction("Your Reach by Day & Hour", action, <div className="text-sm text-gray-700">Heatmap expanded</div>)}
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
                    const impressions = Math.round(intensity * 34);
                    return (
                      <button
                        key={`${day}-${hour}`}
                        type="button"
                        className={cn(
                          "h-8 rounded-md border border-white",
                          intensityColor(intensity),
                          intensity >= 7 ? "text-white" : "text-gray-700",
                        )}
                        onClick={() => onRequestDetail(`${day} ${hour} reach`, <p className="text-sm text-gray-700">{day} {hour} — est. {impressions} people reached.</p>)}
                      >
                        <span className="text-[10px] font-semibold">{impressions ? impressions : ""}</span>
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">📍 Prime Time Fri-Sat = highest reach</div>
          <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">📈 Weekends 3-9PM = best engagement window</div>
          <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">💡 Book Fridays 6-9PM for max impact</div>
        </div>
      </ChartCard>
    </div>
  );
}

function ReachArea({
  rows,
  onClickPoint,
}: {
  rows: Array<{ month: string; reach: number }>;
  onClickPoint: (month: string) => void;
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <YAxis tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${value.toLocaleString("en-US")} reach`} />} />
          <Area type="monotone" dataKey="reach" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2.5} onClick={(entry) => onClickPoint(String((entry as { month?: string })?.month ?? ""))} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ReachByScreen({
  rows,
  onClickBar,
}: {
  rows: Array<{ screen: string; reach: number; note?: string }>;
  onClickBar: (screen: string) => void;
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical">
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <YAxis type="category" dataKey="screen" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={11} width={110} />
          <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${value.toLocaleString("en-US")} reach`} />} />
          <Bar dataKey="reach" radius={[0, 8, 8, 0]} onClick={(_, index) => onClickBar(rows[index]?.screen ?? "")}>
            {rows.map((row, index) => (
              <Cell key={row.screen} fill={index === 0 ? "#2563EB" : index === 1 ? "#7C3AED" : "#10B981"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DaypartProgress({
  rows,
}: {
  rows: Array<{ daypart: string; reach: number; pct: number }>;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.daypart} className="rounded-lg border border-gray-100 p-2">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
            <span>{row.daypart}</span>
            <span>{row.pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${row.pct}%` }} />
          </div>
          <div className="mt-1 text-xs text-gray-700">{row.reach.toLocaleString("en-US")} reach</div>
        </div>
      ))}
      <p className="text-sm font-semibold text-gray-900">Best daypart: Prime Time</p>
      <p className="text-xs text-gray-500">Most valuable for brand visibility</p>
    </div>
  );
}

function FrequencyCard() {
  return (
    <div className="space-y-3">
      <p className="text-4xl font-bold text-blue-600">3.2×</p>
      <p className="text-xs text-gray-500">avg frequency</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={[{ name: "freq", value: 3.2 }]}
            startAngle={90}
            endAngle={-270}
            innerRadius="68%"
            outerRadius="96%"
          >
            <RadialBar background dataKey="value" fill="#10B981" cornerRadius={20} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-600">3.2 of 7 optimal</p>
      <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
        📈 Increasing your campaign duration boosts frequency and brand recall.
      </div>
    </div>
  );
}

function BestTimeCard({
  rows,
}: {
  rows: Array<{ hour: string; plays: number }>;
}) {
  const peak = rows.reduce((best, row) => (row.plays > best.plays ? row : best), rows[0]);
  return (
    <div className="space-y-3">
      <p className="text-3xl font-bold text-gray-900">{peak.hour}</p>
      <p className="text-xs text-gray-500">Peak performance hour</p>
      <div className="flex items-end gap-1">
        {rows.slice(0, 7).map((row) => (
          <span key={row.hour} className="w-3 rounded-full bg-blue-500" style={{ height: `${Math.max(12, row.plays / 2)}px`, opacity: 0.5 + row.plays / 200 }} />
        ))}
      </div>
      <p className="text-xs text-gray-600">{peak.plays} plays at peak • Fridays</p>
    </div>
  );
}
