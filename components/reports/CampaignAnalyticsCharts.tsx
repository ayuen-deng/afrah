"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/cn";

export type PlaysByHourPoint = { label: string; plays: number };
export type EstimatedImpressionPoint = { label: string; impressions: number };

function ChartTooltip({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  suffix: string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;

  return (
    <div className="rounded-full bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg">
      {label} {value.toLocaleString("en-US")} {suffix}
    </div>
  );
}

type CampaignChartCardProps = {
  title: string;
  data: Array<{ label: string; value: number }>;
  suffix: string;
  trendText: string;
  trendTone?: "blue" | "green" | "amber";
  chart: "bar" | "line";
  className?: string;
};

function CampaignChartCard({
  title,
  data,
  suffix,
  trendText,
  trendTone = "green",
  chart,
  className,
}: CampaignChartCardProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const trendColorClass =
    trendTone === "amber"
      ? "text-amber-600"
      : trendTone === "blue"
        ? "text-blue-600"
        : "text-green-600";

  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <button type="button" className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-50">
          ...
        </button>
      </div>

      <div className="mt-3 h-44">
        <ResponsiveContainer width="100%" height="100%">
          {chart === "bar" ? (
            <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip suffix={suffix} />} />
              <Bar dataKey="value" fill="#6366F1" radius={[8, 8, 4, 4]} barSize={18} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip suffix={suffix} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: "#2563EB" }}
                activeDot={{ r: 4, fill: "#111827", stroke: "#fff", strokeWidth: 1.5 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-2xl font-bold text-gray-900">{total.toLocaleString("en-US")}</div>
        <div className={cn("text-sm font-medium", trendColorClass)}>{trendText}</div>
      </div>
    </div>
  );
}

export function CampaignPlaysByHourChart({
  data,
  trendText = "+6.8% vs prior slot",
  className,
}: {
  data: PlaysByHourPoint[];
  trendText?: string;
  className?: string;
}) {
  return (
    <CampaignChartCard
      title="Plays by Hour"
      data={data.map((item) => ({ label: item.label, value: item.plays }))}
      suffix="plays"
      trendText={trendText}
      trendTone="green"
      chart="bar"
      className={className}
    />
  );
}

export function CampaignEstimatedImpressionsChart({
  data,
  trendText = "Range 8.4K-12K",
  className,
}: {
  data: EstimatedImpressionPoint[];
  trendText?: string;
  className?: string;
}) {
  return (
    <CampaignChartCard
      title="Estimated Impressions"
      data={data.map((item) => ({ label: item.label, value: item.impressions }))}
      suffix="impressions"
      trendText={trendText}
      trendTone="blue"
      chart="line"
      className={className}
    />
  );
}
