"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Expand, FileDown, ImageDown, Plus, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { LoadingButton } from "@/components/ui/LoadingButton";
import type { ChartMenuAction } from "@/components/customer-reports/types";

export function DarkTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string | number;
  formatter?: (value: number, label?: string | number) => string;
}) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-full bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg">
      {formatter ? formatter(value, label) : `${label} ${value.toLocaleString("en-US")}`}
    </div>
  );
}

export function NumberWithHover({
  value,
  hint,
  className,
}: {
  value: React.ReactNode;
  hint: string;
  className?: string;
}) {
  return (
    <div className={cn("group relative inline-flex cursor-default", className)}>
      {value}
      <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-72 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
        {hint}
      </div>
    </div>
  );
}

type ChartCardProps = {
  title: string;
  subtitle?: string;
  onMenuAction?: (action: ChartMenuAction) => void;
  children: React.ReactNode;
  className?: string;
  rightSlot?: React.ReactNode;
};

export function ChartCard({
  title,
  subtitle,
  onMenuAction,
  children,
  className,
  rightSlot,
}: ChartCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const runAction = (action: ChartMenuAction) => {
    setMenuOpen(false);
    onMenuAction?.(action);
  };

  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-4 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {rightSlot}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100"
            >
              ···
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-9 z-30 w-40 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => runAction("view_larger")}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Expand className="h-3.5 w-3.5" />
                  View Larger
                </button>
                <button
                  type="button"
                  onClick={() => runAction("export_chart")}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Export This Chart
                </button>
                <button
                  type="button"
                  onClick={() => runAction("download_png")}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                >
                  <ImageDown className="h-3.5 w-3.5" />
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={() => runAction("add_to_report")}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add to Report
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}

export function ChartFullscreenModal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          <button type="button" className="absolute inset-0" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative z-10 flex h-[80vh] w-[80vw] min-w-[320px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-3">
              <h4 className="text-base font-semibold text-gray-900">{title}</h4>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">{children}</div>
            <div className="sticky bottom-0 border-t border-gray-100 bg-white px-5 py-3 text-right">
              <LoadingButton variant="secondary" onClick={onClose}>
                Close
              </LoadingButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function intensityColor(intensity: number) {
  if (intensity <= 0) return "bg-slate-50";
  if (intensity <= 3) return "bg-blue-100";
  if (intensity <= 6) return "bg-blue-300";
  if (intensity <= 8) return "bg-blue-500";
  return "bg-blue-700";
}
