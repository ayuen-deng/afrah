import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";

export type StatCardProps = {
  icon: LucideIcon;
  iconColorClassName?: string;
  value: React.ReactNode;
  label: string;
  trend?: { value: string; direction: "up" | "down" };
};

export function StatCard({
  icon: Icon,
  iconColorClassName = "text-primary bg-blue-100",
  value,
  label,
  trend,
}: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            iconColorClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend ? (
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
              trend.direction === "up"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700",
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            <span>{trend.value} vs last month</span>
          </div>
        ) : null}
      </div>
      <div className="mt-4 text-[32px] font-bold leading-tight text-gray-900">
        {value}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
    </Card>
  );
}

