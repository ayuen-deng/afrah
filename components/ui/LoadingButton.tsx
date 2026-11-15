"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export type LoadingButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  autoLoadOnClick?: boolean;
  minLoadingMs?: number;
  loadingText?: string;
};

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export function LoadingButton({
  className,
  variant = "primary",
  loading = false,
  disabled,
  children,
  onClick,
  autoLoadOnClick = true,
  minLoadingMs = 300,
  loadingText = "Loading...",
  ...props
}: LoadingButtonProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const isLoading = loading || internalLoading;

  const handleClick = React.useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick || !autoLoadOnClick || isLoading || disabled) {
        onClick?.(event);
        return;
      }

      const start = Date.now();
      setInternalLoading(true);
      try {
        await Promise.resolve(onClick(event));
      } finally {
        const elapsed = Date.now() - start;
        if (elapsed < minLoadingMs) {
          await wait(minLoadingMs - elapsed);
        }
        setInternalLoading(false);
      }
    },
    [autoLoadOnClick, disabled, isLoading, minLoadingMs, onClick],
  );

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed",
        variant === "primary" && "bg-primary text-white hover:bg-blue-700",
        variant === "secondary" && "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "ghost" && "text-primary hover:bg-blue-50",
        isLoading && "opacity-80",
        className,
      )}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      <span className={cn("inline-flex items-center gap-2", isLoading && "opacity-0")}>{children}</span>
      {isLoading ? (
        <span className="absolute inset-0 inline-flex items-center justify-center gap-2">
          <span
            className={cn(
              "h-4 w-4 animate-spin rounded-full border-2 border-t-transparent",
              variant === "primary" || variant === "danger"
                ? "border-white"
                : "border-slate-400",
            )}
          />
          <span>{loadingText}</span>
        </span>
      ) : null}
    </button>
  );
}

