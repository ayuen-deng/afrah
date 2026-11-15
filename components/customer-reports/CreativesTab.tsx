"use client";

import * as React from "react";
import { Play, Upload } from "lucide-react";

import type { ReportData } from "@/components/customer-reports/types";
import { ChartCard } from "@/components/customer-reports/shared";
import { StatCardSparkline } from "@/components/ui/StatCardSparkline";
import { cn } from "@/lib/cn";
import { LoadingButton } from "@/components/ui/LoadingButton";

type CreativesTabProps = {
  data: ReportData;
  onRequestDetail: (title: string, content: React.ReactNode) => void;
  onChartMenuAction: (title: string, action: "view_larger" | "export_chart" | "download_png" | "add_to_report", chart: React.ReactNode) => void;
  onOpenExport: () => void;
};

export function CreativesTab({
  data,
  onRequestDetail,
  onChartMenuAction,
  onOpenExport,
}: CreativesTabProps) {
  const [filter, setFilter] = React.useState<"all" | "approved" | "pending" | "rejected">("all");

  const rows = data.creatives.filter((row) => filter === "all" ? true : row.status === filter);
  const totalPlays = data.creatives.reduce((sum, row) => sum + row.plays, 0);
  const avgQuality = Math.round(data.creatives.reduce((sum, row) => sum + row.quality_score, 0) / Math.max(data.creatives.length, 1));
  const approvalRate = Math.round((data.creatives.filter((row) => row.status === "approved").length / Math.max(data.creatives.length, 1)) * 100);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCardSparkline label="TOTAL CREATIVES" value={data.creatives.length} trendText="+1 this month" trendDirection="up" points={data.creatives.map((row) => ({ value: row.plays + 1 }))} lineColor="#2563EB" />
        <StatCardSparkline label="AVG QUALITY SCORE" value={`${avgQuality}/100`} trendText="Quality checks passed" trendDirection={avgQuality >= 80 ? "up" : "neutral"} points={data.creatives.map((row) => ({ value: row.quality_score }))} lineColor={avgQuality >= 80 ? "#10B981" : "#F59E0B"} />
        <StatCardSparkline label="APPROVAL RATE" value={`${approvalRate}%`} trendText="Creative moderation status" trendDirection={approvalRate >= 70 ? "up" : "down"} points={data.creatives.map((row) => ({ value: row.status === "approved" ? 100 : 40 }))} lineColor="#7C3AED" />
        <StatCardSparkline label="TOTAL PLAYS" value={totalPlays.toLocaleString("en-US")} trendText="+18.2% last period" trendDirection="up" points={data.creatives.map((row) => ({ value: row.plays || 1 }))} lineColor="#0EA5E9" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((creative) => (
          <button
            key={creative.id}
            type="button"
            onClick={() => onRequestDetail(`${creative.name}`, <CreativeDetail creative={creative} />)}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative h-40 bg-gray-100">
              <img src={creative.preview} alt={creative.name} className="h-full w-full object-cover" />
              {creative.type === "video" ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full bg-black/60 p-3 text-white">
                    <Play className="h-4 w-4" />
                  </span>
                </div>
              ) : null}
              <span className={cn("absolute left-3 top-3 rounded-full px-2 py-1 text-xs font-semibold", creative.quality_score > 80 ? "bg-green-100 text-green-700" : creative.quality_score > 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                {creative.quality_score}/100
              </span>
              <span className={cn("absolute right-3 top-3 rounded-full px-2 py-1 text-xs font-semibold", creative.status === "approved" ? "bg-green-100 text-green-700" : creative.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                {creative.status}
              </span>
            </div>
            <div className="space-y-2 p-4">
              <div className="truncate text-sm font-semibold text-gray-900">{creative.name}</div>
              <p className="text-xs text-gray-500">{creative.campaign}</p>
              <p className="text-xs text-gray-500">📍 {creative.screen}</p>
              <div className="rounded-lg bg-gray-50 p-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-blue-700">{creative.plays.toLocaleString("en-US")} plays</span>
                  <span className="text-gray-500">{creative.impressions.toLocaleString("en-US")} est. reach</span>
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                  <span>Quality Score</span>
                  <span>{creative.quality_score}/100</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className={cn("h-2 rounded-full", creative.quality_score > 80 ? "bg-green-500" : creative.quality_score > 60 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${creative.quality_score}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
              <span>Submitted: {creative.submitted}</span>
              {creative.revisions > 0 ? (
                <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">{creative.revisions} revision</span>
              ) : null}
            </div>
          </button>
        ))}
      </div>

      <ChartCard
        title="Creative Performance Summary Table"
        subtitle="Filter and export creative analytics"
        onMenuAction={(action) => onChartMenuAction("Creative Performance Summary Table", action, <div className="text-sm text-gray-700">Creative table view</div>)}
      >
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {(["all", "approved", "pending", "rejected"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cn("rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap", filter === item ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
              >
                {item}
              </button>
            ))}
          </div>
          <LoadingButton variant="secondary" onClick={onOpenExport}>
            <Upload className="h-4 w-4" />
            Export Creative Report
          </LoadingButton>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Creative", "Type", "Campaign", "Quality", "Plays", "Impressions", "Revisions", "Status"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="cursor-pointer border-b border-slate-100 hover:bg-gray-50" onClick={() => onRequestDetail(row.name, <CreativeDetail creative={row} />)}>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.campaign}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", row.quality_score > 80 ? "bg-green-100 text-green-700" : row.quality_score > 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                      {row.quality_score}/100
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.plays.toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.impressions.toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.revisions}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", row.status === "approved" ? "bg-green-100 text-green-700" : row.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function CreativeDetail({
  creative,
}: {
  creative: ReportData["creatives"][number];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <img src={creative.preview} alt={creative.name} className="h-52 w-full rounded-lg object-cover" />
        <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
          <p>Type: <span className="font-semibold">{creative.type}</span></p>
          <p>AI moderation: <span className="font-semibold text-green-700">{creative.ai_status}</span></p>
          <p>Screen: <span className="font-semibold">{creative.screen}</span></p>
        </div>
        <LoadingButton variant="secondary" onClick={() => undefined}>Download Creative</LoadingButton>
      </div>
      <div className="space-y-3">
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-sm font-semibold text-gray-900">Quality Report</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{creative.quality_score}</p>
          <p className="text-xs text-gray-500">Score out of 100</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
          <p>Total plays: <span className="font-semibold">{creative.plays.toLocaleString("en-US")}</span></p>
          <p>Est. impressions: <span className="font-semibold">{creative.impressions.toLocaleString("en-US")}</span></p>
          <p>Campaign: <span className="font-semibold">{creative.campaign}</span></p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">Revision History</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Original submission — {creative.submitted}</li>
            {creative.revisions > 0 ? <li>Revision 1 — client feedback addressed</li> : null}
            {creative.revisions > 1 ? <li>Revision 2 — final polish and export</li> : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
