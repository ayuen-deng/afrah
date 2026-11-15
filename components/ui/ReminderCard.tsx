"use client";

import * as React from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Urgency = "high" | "medium" | "low" | "none";
type DueTone = "overdue" | "soon" | "upcoming";

export type ReminderCardProps = {
  name: string;
  company?: string;
  note?: string;
  dueText?: string;
  dueTone?: DueTone;
  urgency?: Urgency;
  initials?: string;
  avatarClassName?: string;
  purposeBadge?: string;
  showUrgencyBorder?: boolean;
  doneLabel?: string;
  onDone?: () => void;
  onSnooze?: () => void;
  onSecondary?: () => void;
  secondaryLabel?: string;
  className?: string;
};

function urgencyBorderClass(urgency: Urgency) {
  if (urgency === "high") return "border-l-red-500";
  if (urgency === "medium") return "border-l-amber-400";
  if (urgency === "low") return "border-l-gray-300";
  return "border-l-gray-200";
}

function dueToneClass(tone: DueTone) {
  if (tone === "overdue") return "text-red-600";
  if (tone === "soon") return "text-amber-600";
  return "text-gray-500";
}

function urgencyBadgeVariant(urgency: Urgency) {
  if (urgency === "high") return "error" as const;
  if (urgency === "medium") return "warning" as const;
  if (urgency === "low") return "neutral" as const;
  return "info" as const;
}

function readableUrgency(urgency: Urgency) {
  if (urgency === "none") return "Info";
  return urgency.charAt(0).toUpperCase() + urgency.slice(1);
}

export function ReminderCard({
  name,
  company,
  note,
  dueText,
  dueTone = "upcoming",
  urgency = "none",
  initials,
  avatarClassName = "bg-blue-500",
  purposeBadge,
  showUrgencyBorder = true,
  doneLabel = "Done ✓",
  onDone,
  onSnooze,
  onSecondary,
  secondaryLabel = "Snooze ▾",
  className,
}: ReminderCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4",
        showUrgencyBorder && cn("border-l-4", urgencyBorderClass(urgency)),
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white", avatarClassName)}>
          {initials ?? name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-900">{name}</div>
          {company ? <div className="mt-0.5 text-xs text-gray-500">{company}</div> : null}
          {note ? <div className="mt-1 truncate text-[13px] italic text-gray-600">{note}</div> : null}
          {dueText ? <div className={cn("mt-1 text-xs font-medium", dueToneClass(dueTone))}>{dueText}</div> : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          {purposeBadge ? <Badge variant="neutral">{purposeBadge}</Badge> : <Badge variant={urgencyBadgeVariant(urgency)}>{readableUrgency(urgency)}</Badge>}
          <div className="flex items-center gap-1.5">
            {onSecondary ? (
              <Button variant="ghost" className="h-7 px-2 text-xs text-gray-600 hover:bg-gray-100" onClick={onSecondary}>
                {secondaryLabel}
              </Button>
            ) : null}
            {onDone ? (
              <Button variant="ghost" className="h-7 px-2 text-xs text-green-700 hover:bg-green-50" onClick={onDone}>
                {doneLabel}
              </Button>
            ) : null}
            {onSnooze && !onSecondary ? (
              <Button variant="ghost" className="h-7 px-2 text-xs text-gray-600 hover:bg-gray-100" onClick={onSnooze}>
                Snooze ▾
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

