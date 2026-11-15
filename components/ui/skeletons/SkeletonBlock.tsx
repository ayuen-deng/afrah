import * as React from "react";

import { cn } from "@/lib/cn";

type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-200/80", className)} />;
}
