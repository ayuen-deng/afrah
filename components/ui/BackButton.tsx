"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/cn";

type BackButtonProps = {
  label?: string;
  className?: string;
};

export function BackButton({ label = "Back", className }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={cn(
        "inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700",
        className,
      )}
    >
      <ChevronLeft size={16} />
      <span>{label}</span>
    </button>
  );
}
