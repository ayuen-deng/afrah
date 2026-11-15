"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

import { cn } from "@/lib/cn";

type Item = {
  check: string;
  status: "good" | "warning" | "bad";
  note: string;
};

export function QualityReport({
  score,
  items,
}: {
  score: number;
  items: Item[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Quality Report
        </div>
        <div
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            score >= 80 && "bg-green-100 text-green-700",
            score >= 60 && score < 80 && "bg-amber-100 text-amber-700",
            score < 60 && "bg-red-100 text-red-700",
          )}
        >
          Score: {score}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {items.map((it) => (
          <div
            key={it.check}
            className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
          >
            <div className="flex items-start gap-2">
              {it.status === "good" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
              ) : it.status === "warning" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 text-red-600" />
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {it.check}
                </div>
                <div className="text-xs text-gray-600">{it.note}</div>
              </div>
            </div>
            <div
              className={cn(
                "rounded-full px-2 py-1 text-xs font-medium",
                it.status === "good" && "bg-green-100 text-green-700",
                it.status === "warning" && "bg-amber-100 text-amber-700",
                it.status === "bad" && "bg-red-100 text-red-700",
              )}
            >
              {it.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

