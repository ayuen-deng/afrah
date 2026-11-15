"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function CampaignAnalyticsChart({
  data,
}: {
  data: Array<{ label: string; plays: number; impressions: number }>;
}) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="label" stroke="#64748B" fontSize={12} />
          <YAxis stroke="#64748B" fontSize={12} />
          <Tooltip />
          <Line type="monotone" dataKey="plays" stroke="#2563EB" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="impressions" stroke="#10B981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

