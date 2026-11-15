import * as React from "react";

import { SkeletonBlock } from "@/components/ui/skeletons/SkeletonBlock";
import { cn } from "@/lib/cn";

type CardSkeletonProps = {
  className?: string;
};

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-6 shadow-sm", className)}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <SkeletonBlock className="h-3 w-32 rounded-full" />
          <SkeletonBlock className="h-8 w-16 rounded-lg" />
        </div>
        <SkeletonBlock className="h-10 w-24 rounded-2xl" />
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-2.5 w-2.5 rounded-full" />
          <SkeletonBlock className="h-3 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}
