"use client";

import * as React from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

import { cn } from "@/lib/cn";

type SparkPoint = {
  value: number;
};

type StatCardSparklineProps = {
  label: string;
  value: React.ReactNode;
  trendText: string;
  trendDirection?: "up" | "down" | "neutral";
  trendDotColorClassName?: string;
  lineColor?: string;
  points: SparkPoint[];
  className?: string;
  onClick?: () => void;
};

function TrendDot({ className }: { className?: string }) {
  return <span className={cn("inline-block h-2 w-2 rounded-full", className)} />;
}

export function StatCardSparkline({
  label,
  value,
  trendText,
  trendDirection = "neutral",
  trendDotColorClassName,
  lineColor = "#2563EB",
  points,
  className,
  onClick,
}: StatCardSparklineProps) {
  const trendColor =
    trendDirection === "up"
      ? "text-green-600"
      : trendDirection === "down"
        ? "text-red-600"
        : "text-gray-500";

  const dotColorClassName =
    trendDotColorClassName ??
    (trendDirection === "up"
      ? "bg-green-500"
      : trendDirection === "down"
        ? "bg-red-500"
        : "bg-gray-400");

  const content = (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] uppercase tracking-[0.05em] text-gray-400">{label}</p>
        <div className="h-[30px] w-[60px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <Tooltip
                cursor={false}
                contentStyle={{
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: "#0F172A",
                  color: "#FFFFFF",
                  fontSize: 11,
                  padding: "6px 8px",
                }}
                labelStyle={{ display: "none" }}
                formatter={(val) => [String(val ?? ""), ""]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-3 text-[32px] font-bold leading-none text-gray-900">{value}</div>
      <div className={cn("mt-3 inline-flex items-center gap-2 text-xs font-medium", trendColor)}>
        <TrendDot className={dotColorClassName} />
        <span>{trendText}</span>
      </div>
    </div>
  );

  if (!onClick) return content;

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {content}
    </button>
  );
}
