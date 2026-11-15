import * as React from "react";

import { cn } from "@/lib/cn";

export type SkeletonLoaderProps = React.HTMLAttributes<HTMLDivElement> & {
  lines?: number;
};

export function SkeletonLoader({ className, lines = 3, ...props }: SkeletonLoaderProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={idx}
          className={cn("h-3 w-full animate-pulse rounded bg-gray-200", idx === 0 && "h-4 w-2/3")}
        />
      ))}
    </div>
  );
}

