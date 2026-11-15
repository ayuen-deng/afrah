import * as React from "react";

import { cn } from "@/lib/cn";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 shadow-card",
        className,
      )}
      {...props}
    />
  );
}

