import * as React from "react";

import { SkeletonBlock } from "@/components/ui/skeletons/SkeletonBlock";
import { cn } from "@/lib/cn";

type TableSkeletonProps = {
  rows?: number;
  className?: string;
};

export function TableSkeleton({ rows = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white shadow-sm", className)}>
      <div className="grid grid-cols-[44px_1.6fr_1fr_1fr_120px_44px] gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <SkeletonBlock key={idx} className="h-3 w-full rounded-full" />
        ))}
      </div>

      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid min-h-16 grid-cols-[44px_1.6fr_1fr_1fr_120px_44px] items-center gap-4 px-6 py-4"
          >
            <SkeletonBlock className="h-4 w-4 rounded" />
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-9 w-9 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-28 rounded-full" />
                <SkeletonBlock className="h-3 w-36 rounded-full" />
                <SkeletonBlock className="h-3 w-24 rounded-full" />
              </div>
            </div>
            <SkeletonBlock className="h-3 w-20 rounded-full" />
            <SkeletonBlock className="h-3 w-24 rounded-full" />
            <SkeletonBlock className="h-7 w-20 rounded-full" />
            <SkeletonBlock className="h-6 w-6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
