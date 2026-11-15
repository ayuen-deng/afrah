import * as React from "react";

import { cn } from "@/lib/cn";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, actions, backButton, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        {backButton ? <div className="mb-1">{backButton}</div> : null}
        <h1 className="text-[24px] font-semibold text-gray-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
