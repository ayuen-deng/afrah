import * as React from "react";

import { SkeletonBlock } from "@/components/ui/skeletons/SkeletonBlock";
import { cn } from "@/lib/cn";

type ChartSkeletonProps = {
  className?: string;
};

export function ChartSkeleton({ className }: ChartSkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-6 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-32 rounded-full" />
          <SkeletonBlock className="h-8 w-20 rounded-2xl" />
        </div>
        <SkeletonBlock className="h-6 w-6 rounded-full" />
      </div>

      <div className="mt-6 flex h-52 items-end gap-3">
        {["h-20", "h-32", "h-24", "h-40", "h-28", "h-36", "h-24"].map((height, idx) => (
          <SkeletonBlock key={idx} className={cn("flex-1 rounded-t-2xl rounded-b-md", height)} />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <SkeletonBlock key={idx} className="h-3 w-10 rounded-full" />
        ))}
      </div>
    </div>
  );
}
