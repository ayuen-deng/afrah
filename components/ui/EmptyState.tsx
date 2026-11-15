import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("flex flex-col items-center text-center", className)}>
      {Icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-primary">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <div className="mt-4 text-lg font-semibold text-gray-800">{title}</div>
      {description ? (
        <div className="mt-1 text-sm text-gray-600">{description}</div>
      ) : null}
      {action ? (
        <div className="mt-4">
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      ) : null}
    </Card>
  );
}

