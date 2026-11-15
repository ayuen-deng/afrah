import * as React from "react";

import { CardSkeleton } from "@/components/ui/skeletons/CardSkeleton";
import { ChartSkeleton } from "@/components/ui/skeletons/ChartSkeleton";
import { SkeletonBlock } from "@/components/ui/skeletons/SkeletonBlock";
import { TableSkeleton } from "@/components/ui/skeletons/TableSkeleton";
import { cn } from "@/lib/cn";

type PageSkeletonProps = {
  className?: string;
};

export function PageSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-6 p-6 md:p-8", className)}>
      <div className="space-y-3">
        <SkeletonBlock className="h-3 w-24 rounded-full" />
        <SkeletonBlock className="h-8 w-56 rounded-2xl" />
        <SkeletonBlock className="h-4 w-80 max-w-full rounded-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <CardSkeleton key={idx} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      <TableSkeleton />
    </div>
  );
}
