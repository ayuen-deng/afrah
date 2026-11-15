"use client";

import * as React from "react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isWeekend,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type DayStatus = "booked" | "active" | "present" | "late" | "absent" | "leave";

export type BookingCalendarProps = {
  bookedDates: Date[];
  activeDates: Date[];
  onDateSelect?: (date: Date) => void;
  selectedDate: Date | null;
  statusByDate?: Record<string, DayStatus>;
  labelsByDate?: Record<string, string>;
  className?: string;
};

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function BookingCalendar({
  bookedDates,
  activeDates,
  onDateSelect,
  selectedDate,
  statusByDate,
  labelsByDate,
  className,
}: BookingCalendarProps) {
  const today = startOfToday();
  const [month, setMonth] = React.useState<Date>(selectedDate ?? today);

  React.useEffect(() => {
    if (selectedDate) {
      setMonth(selectedDate);
    }
  }, [selectedDate]);

  const bookedSet = React.useMemo(() => new Set(bookedDates.map(dayKey)), [bookedDates]);
  const activeSet = React.useMemo(() => new Set(activeDates.map(dayKey)), [activeDates]);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = React.useMemo(() => {
    const rows: Date[] = [];
    let cursor = gridStart;
    while (!isAfterDay(cursor, gridEnd)) {
      rows.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return rows;
  }, [gridEnd, gridStart]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[18px] font-semibold text-gray-900">{format(month, "MMMM yyyy")}</div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="h-8 w-8 rounded-lg p-0"
            onClick={() => setMonth((current) => addDays(startOfMonth(current), -1))}
            autoLoadOnClick={false}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-3 py-1 text-xs"
            onClick={() => setMonth(today)}
            autoLoadOnClick={false}
          >
            Today
          </Button>
          <Button
            variant="secondary"
            className="h-8 w-8 rounded-lg p-0"
            onClick={() => setMonth((current) => addDays(endOfMonth(current), 1))}
            autoLoadOnClick={false}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="px-1 text-center text-[11px] font-medium uppercase tracking-wide text-gray-400">
            {day}
          </div>
        ))}

        {days.map((day) => {
          const key = dayKey(day);
          const status = statusByDate?.[key] ?? (bookedSet.has(key) ? "booked" : activeSet.has(key) ? "active" : undefined);
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isToday = isSameDay(day, today);
          const isPast = isBefore(day, today);
          const outOfMonth = !isSameMonth(day, month);
          const canSelect = Boolean(onDateSelect) && !isPast && status !== "booked";

          return (
            <button
              key={key}
              type="button"
              onClick={() => (canSelect ? onDateSelect?.(day) : undefined)}
              disabled={!canSelect}
              className={cn(
                "group relative min-h-[68px] rounded-lg border px-2 py-1 text-left transition",
                outOfMonth && "opacity-30",
                selected && "border-transparent bg-blue-600 text-white",
                !selected && status === "booked" && "cursor-not-allowed border-red-200 bg-red-100 text-red-800",
                !selected && status === "active" && "border-green-200 bg-green-100 text-green-800",
                !selected && status === "present" && "border-green-200 bg-green-100 text-green-800",
                !selected && status === "late" && "border-amber-200 bg-amber-100 text-amber-800",
                !selected && status === "absent" && "border-red-200 bg-red-100 text-red-800",
                !selected && status === "leave" && "border-blue-200 bg-blue-100 text-blue-800",
                !selected && !status && isToday && "border-2 border-blue-600 bg-white text-blue-600",
                !selected && !status && !isToday && isPast && "cursor-not-allowed border-slate-100 bg-white text-gray-300",
                !selected && !status && !isToday && !isPast && isWeekend(day) && "border-slate-100 bg-slate-50 text-gray-400",
                !selected && !status && !isToday && !isPast && !isWeekend(day) && "border-slate-100 bg-white text-gray-700 hover:bg-blue-50",
              )}
            >
              <div className={cn("text-sm font-medium", selected && "text-white")}>{format(day, "d")}</div>
              {!selected && labelsByDate?.[key] ? (
                <div className="mt-1 truncate text-[11px] font-medium">{labelsByDate[key]}</div>
              ) : null}
              {!selected && !labelsByDate?.[key] && status === "booked" ? (
                <div className="mt-1 truncate text-[11px] font-medium">Booked</div>
              ) : null}
              {!selected && !labelsByDate?.[key] && status === "active" ? (
                <div className="mt-1 truncate text-[11px] font-medium">LIVE</div>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <LegendItem colorClass="bg-red-400" label="Booked" />
        <LegendItem colorClass="bg-green-400" label="Active Campaign" />
        <LegendItem colorClass="bg-blue-500" label="Selected" />
        <LegendItem colorClass="bg-white border border-slate-300" label="Available" />
      </div>
    </div>
  );
}

function LegendItem({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", colorClass)} />
      {label}
    </span>
  );
}

function isAfterDay(a: Date, b: Date) {
  return a.getTime() > b.getTime();
}

