import * as React from "react";

import { cn } from "@/lib/cn";

type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "live";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  dot?: boolean;
};

export function Badge({
  className,
  variant = "neutral",
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        variant === "success" && "bg-green-100 text-green-700",
        variant === "warning" && "bg-amber-100 text-amber-700",
        variant === "error" && "bg-red-100 text-red-700",
        variant === "info" && "bg-blue-100 text-blue-700",
        variant === "neutral" && "bg-gray-100 text-gray-600",
        variant === "live" && "bg-green-100 text-green-700",
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            variant === "success" && "bg-green-600",
            variant === "warning" && "bg-amber-600",
            variant === "error" && "bg-red-600",
            variant === "info" && "bg-blue-600",
            variant === "neutral" && "bg-gray-500",
            variant === "live" && "bg-green-600 animate-pulse",
          )}
        />
      ) : null}
      {children}
    </span>
  );
}

