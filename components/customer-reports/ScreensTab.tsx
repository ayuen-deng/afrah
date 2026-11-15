"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { LoadingButton } from "@/components/ui/LoadingButton";
import { MapboxMap } from "@/components/maps/MapboxMap";
import { mockScreens } from "@/lib/mockData";

type ScreensTabProps = {
  data: ReportData;
  onRequestDetail: (title: string, content: React.ReactNode) => void;
  onChartMenuAction: (title: string, action: "view_larger" | "export_chart" | "download_png" | "add_to_report", chart: React.ReactNode) => void;
};

export function ScreensTab({
  data,
  onRequestDetail,
  onChartMenuAction,
}: ScreensTabProps) {
  const bestScreen = data.screen_usage.reduce((best, row) => (row.impressions > best.impressions ? row : best), data.screen_usage[0]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCardSparkline label="SCREENS USED" value={data.screen_usage.length} trendText="Active this period" trendDirection="up" points={data.screen_usage.map((row) => ({ value: row.bookings }))} lineColor="#2563EB" />
        <StatCardSparkline label="MOST USED SCREEN" value={bestScreen.screen} trendText={`${bestScreen.total_hours} hrs booked`} trendDirection="neutral" points={data.screen_usage.map((row) => ({ value: row.total_hours }))} lineColor="#7C3AED" />
        <StatCardSparkline label="BEST ROI SCREEN" value={bestScreen.screen} trendText={`${bestScreen.impressions.toLocaleString("en-US")} est. impressions`} trendDirection="up" points={data.screen_usage.map((row) => ({ value: row.impressions || 1 }))} lineColor="#10B981" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Screen Performance Comparison"
          subtitle="Spend vs impressions (÷1000)"
          onMenuAction={(action) => onChartMenuAction("Screen Performance Comparison", action, <ScreenComparisonChart rows={data.screen_usage} onClickBar={() => undefined} />)}
        >
          <ScreenComparisonChart
            rows={data.screen_usage}
            onClickBar={(screen) => {
              const row = data.screen_usage.find((item) => item.screen === screen);
              if (!row) return;
              onRequestDetail(`${screen} details`, (
                <ScreenDetailPanel row={row} />
              ));
            }}
          />
          <p className="mt-3 text-sm text-gray-600">
            Best performing: <span className="font-semibold text-gray-900">{bestScreen.screen}</span>
            <br />
            {bestScreen.impressions.toLocaleString("en-US")} est. impressions
          </p>
        </ChartCard>

        <ChartCard
          title="Location Breakdown"
          subtitle="CBD vs suburban"
          onMenuAction={(action) => onChartMenuAction("Location Breakdown", action, <LocationBreakdown rows={data.location_breakdown} onSelect={() => undefined} />)}
        >
          <LocationBreakdown rows={data.location_breakdown} onSelect={(type) => onRequestDetail(`${type} locations`, <p className="text-sm text-gray-700">Filtered results for {type} loaded.</p>)} />
        </ChartCard>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Screen Usage Table</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Screen", "Location", "Bookings", "Total Hours", "Spend", "Est. Impressions", "Last Used", "Actions"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.screen_usage.map((row) => (
                <tr key={row.screen} className="border-b border-slate-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <img
                        src={mockScreens.find((screen) => screen.name.includes(row.screen))?.image ?? "https://picsum.photos/seed/scr-fallback/80/80"}
                        alt={row.screen}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                      <span>{row.screen}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.location}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.bookings}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.total_hours}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatUGX(row.spend)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.impressions.toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.last_used}</td>
                  <td className="px-4 py-3 text-sm">
                    <button type="button" onClick={() => onRequestDetail(`${row.screen} usage detail`, <ScreenDetailPanel row={row} />)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                      View Details
                    </button>
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

function ScreenComparisonChart({
  rows,
  onClickBar,
}: {
  rows: Array<{ screen: string; spend: number; impressions: number }>;
  onClickBar: (screen: string) => void;
}) {
  const chartRows = rows.map((row) => ({
    screen: row.screen.replace(" Screen", ""),
    spend: row.spend,
    impressionsScaled: Math.round(row.impressions / 1000),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartRows}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="screen" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <YAxis tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={12} />
          <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${value.toLocaleString("en-US")}`} />} />
          <Bar dataKey="spend" fill="#2563EB" radius={[8, 8, 0, 0]} onClick={(_, index) => onClickBar(rows[index]?.screen ?? "")} />
          <Bar dataKey="impressionsScaled" fill="#7C3AED" radius={[8, 8, 0, 0]} onClick={(_, index) => onClickBar(rows[index]?.screen ?? "")} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LocationBreakdown({
  rows,
  onSelect,
}: {
  rows: Array<{ type: string; spend: number; pct: number }>;
  onSelect: (type: string) => void;
}) {
  const chartRows = rows.map((row, index) => ({
    ...row,
    color: index === 0 ? "#2563EB" : index === 1 ? "#7C3AED" : "#10B981",
  }));
  return (
    <div className="space-y-3">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartRows} dataKey="spend" nameKey="type" innerRadius={56} outerRadius={80} onClick={(_, index) => onSelect(chartRows[index]?.type ?? "")}>
              {chartRows.map((row) => (
                <Cell key={row.type} fill={row.color} />
              ))}
            </Pie>
            <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${formatUGX(value)}`} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {chartRows.map((row) => (
        <button key={row.type} type="button" onClick={() => onSelect(row.type)} className="w-full rounded-lg border border-gray-100 px-3 py-2 text-left hover:bg-gray-50">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />{row.type}</span>
            <span>{row.pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full" style={{ width: `${row.pct}%`, backgroundColor: row.color }} />
          </div>
          <p className="mt-1 text-xs font-semibold text-gray-900">{formatUGX(row.spend)}</p>
        </button>
      ))}
    </div>
  );
}

function ScreenDetailPanel({
  row,
}: {
  row: { screen: string; bookings: number; total_hours: number; spend: number; impressions: number; location: string; last_used: string };
}) {
  const geo = mockScreens.find((screen) => screen.name.includes(row.screen));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="Bookings" value={row.bookings.toString()} />
        <MetricCard label="Hours" value={row.total_hours.toString()} />
        <MetricCard label="Spend" value={formatUGX(row.spend)} />
        <MetricCard label="Impressions" value={row.impressions.toLocaleString("en-US")} />
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {["Date", "Duration", "Amount", "Status", "Campaign"].map((header) => (
                <th key={header} className="px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-400">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100">
              <td className="px-3 py-2 text-sm text-gray-700">{row.last_used}</td>
              <td className="px-3 py-2 text-sm text-gray-700">{row.total_hours} hrs</td>
              <td className="px-3 py-2 text-sm text-gray-700">{formatUGX(row.spend)}</td>
              <td className="px-3 py-2 text-sm text-green-700">Completed</td>
              <td className="px-3 py-2 text-sm text-gray-700">Auto-linked campaign</td>
            </tr>
          </tbody>
        </table>
      </div>
      {geo ? (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <MapboxMap
            heightClassName="h-52"
            center={{ lat: geo.lat, lng: geo.lng }}
            zoom={15}
            markers={[
              {
                id: geo.id,
                lat: geo.lat,
                lng: geo.lng,
                color: geo.status === "offline" ? "#EF4444" : geo.status === "booked" ? "#F59E0B" : "#10B981",
                title: geo.name,
                subtitle: geo.location,
              },
            ]}
          />
        </div>
      ) : null}
      <LoadingButton onClick={() => undefined}>Book This Screen Again</LoadingButton>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}
