"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

type Step = {
  key: string;
  label: string;
};

export function StatusPipeline({
  currentKey,
  steps,
}: {
  currentKey: string;
  steps: Step[];
}) {
  const idx = Math.max(0, steps.findIndex((s) => s.key === currentKey));

  return (
    <div className="grid gap-3 sm:grid-cols-5">
      {steps.map((s, i) => {
        const status = i < idx ? "complete" : i === idx ? "current" : "pending";
        return (
          <div
            key={s.key}
            className={cn(
              "rounded-xl border p-3 text-center",
              status === "complete" && "border-green-200 bg-green-50",
              status === "current" && "border-blue-200 bg-blue-50",
              status === "pending" && "border-gray-200 bg-white",
            )}
          >
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {s.label}
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-900">
              {status === "complete"
                ? "Done"
                : status === "current"
                  ? "Now"
                  : "Pending"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

