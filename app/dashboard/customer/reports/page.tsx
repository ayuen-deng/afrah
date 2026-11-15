"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2,
  Download,
  FileDown,
  Info,
  MoreHorizontal,
  Play,
  TrendingDown,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";

import {
  mockBookings,
  mockInvoices,
  mockReportData,
  mockScreens,
} from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";
import { cn } from "@/lib/cn";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { useToast } from "@/components/ui/Toast";
import { ExportPreviewModal } from "@/components/reports";
import { ChartSkeleton } from "@/components/ui/skeletons";
import { CampaignCard } from "@/components/ui/CampaignCard";

type ReportPeriod = "this_month" | "last_3_months" | "this_year" | "all_time";
type ReportTab =
  | "overview"
  | "spending"
  | "campaigns"
  | "screens"
  | "reach"
  | "creatives";
type MenuAction = "view_larger" | "export_chart" | "download_png" | "add_to_report";
type ReportData = typeof mockReportData;
type StatusFilter = "all" | "paid" | "unpaid" | "overdue";
type CampaignFilter = "all" | "live" | "scheduled" | "completed";
type CreativeFilter = "all" | "approved" | "pending" | "rejected";

const COLORS = {
  blue: "#2563EB",
  purple: "#7C3AED",
  green: "#059669",
  teal: "#0D9488",
  amber: "#D97706",
  pink: "#DB2777",
  orange: "#EA580C",
  gray: "#6B7280",
};

const chartMenuItems: Array<{ key: MenuAction; label: string }> = [
  { key: "view_larger", label: "View Larger" },
  { key: "export_chart", label: "Export This Chart" },
  { key: "download_png", label: "Download PNG" },
  { key: "add_to_report", label: "Add to Report" },
];

const periodOptions: Array<{ key: ReportPeriod; label: string }> = [
  { key: "this_month", label: "This Month" },
  { key: "last_3_months", label: "Last 3 Months" },
  { key: "this_year", label: "This Year" },
  { key: "all_time", label: "All Time" },
];

const tabOptions: Array<{ key: ReportTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "spending", label: "Spending" },
  { key: "campaigns", label: "Campaigns" },
  { key: "screens", label: "Screens" },
  { key: "reach", label: "Reach & Audience" },
  { key: "creatives", label: "Creatives" },
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = [
  "6AM",
  "7AM",
  "8AM",
  "9AM",
  "10AM",
  "11AM",
  "12PM",
  "1PM",
  "2PM",
  "3PM",
  "4PM",
  "5PM",
  "6PM",
  "7PM",
  "8PM",
  "9PM",
  "10PM",
  "11PM",
];

function formatYAxis(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${v}`;
}

function clamp(v: number, min = 0, max = 10) {
  return Math.max(min, Math.min(max, v));
}

function getPeriodMultiplier(period: ReportPeriod) {
  if (period === "this_month") return 1;
  if (period === "last_3_months") return 1.18;
  if (period === "this_year") return 1.34;
  return 1.52;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function scaleValue(v: number, multiplier: number) {
  return Math.max(0, Math.round(v * multiplier));
}

function buildPeriodData(period: ReportPeriod): ReportData {
  const clone = deepClone(mockReportData);
  const multiplier = getPeriodMultiplier(period);
  const playsMultiplier = Math.max(0.7, multiplier * 0.92);

  clone.summary.total_spend = scaleValue(clone.summary.total_spend, multiplier);
  clone.summary.total_impressions = scaleValue(clone.summary.total_impressions, multiplier);
  clone.summary.total_airtime_hours = scaleValue(clone.summary.total_airtime_hours, multiplier);
  clone.summary.avg_campaign_value = scaleValue(clone.summary.avg_campaign_value, multiplier);
  clone.summary.outstanding_balance = scaleValue(
    clone.summary.outstanding_balance,
    Math.max(0.72, multiplier * 0.68),
  );
  clone.summary.total_spend_trend = Number((clone.summary.total_spend_trend + (multiplier - 1) * 10).toFixed(1));
  clone.summary.total_impressions_trend = Number(
    (clone.summary.total_impressions_trend + (multiplier - 1) * 8.4).toFixed(1),
  );
  clone.summary.airtime_trend = Number((clone.summary.airtime_trend + (multiplier - 1) * 12.1).toFixed(1));

  clone.monthly_spend = clone.monthly_spend.map((item) => ({
    ...item,
    spend: scaleValue(item.spend, multiplier),
    campaigns: Math.max(0, Math.round(item.campaigns * Math.max(1, multiplier * 0.92))),
  }));

  clone.spend_by_screen = clone.spend_by_screen.map((item) => ({
    ...item,
    spend: scaleValue(item.spend, multiplier),
  }));

  const totalSpend = clone.spend_by_screen.reduce((sum, row) => sum + row.spend, 0) || 1;
  clone.spend_by_screen = clone.spend_by_screen.map((item) => ({
    ...item,
    pct: Math.round((item.spend / totalSpend) * 100),
  })) as ReportData["spend_by_screen"];

  clone.spend_by_time_slot = clone.spend_by_time_slot.map((item) => ({
    ...item,
    spend: scaleValue(item.spend, multiplier),
  }));
  const slotTotal = clone.spend_by_time_slot.reduce((sum, row) => sum + row.spend, 0);
  clone.spend_by_time_slot = clone.spend_by_time_slot.map((item) => ({
    ...item,
    pct: slotTotal ? Math.round((item.spend / slotTotal) * 100) : 0,
  }));

  clone.payment_methods = clone.payment_methods.map((item) => ({
    ...item,
    amount: scaleValue(item.amount, multiplier),
  }));
  const methodTotal = clone.payment_methods.reduce((sum, row) => sum + row.amount, 0) || 1;
  clone.payment_methods = clone.payment_methods.map((item) => ({
    ...item,
    pct: Math.round((item.amount / methodTotal) * 100),
  }));

  clone.vat_paid_total = scaleValue(clone.vat_paid_total, multiplier);

  clone.impressions_by_campaign = clone.impressions_by_campaign.map((item) => ({
    ...item,
    plays: scaleValue(item.plays, playsMultiplier),
    impressions_low: scaleValue(item.impressions_low, multiplier),
    impressions_high: scaleValue(item.impressions_high, multiplier),
  }));

  clone.plays_by_hour = clone.plays_by_hour.map((item) => ({
    ...item,
    plays: scaleValue(item.plays, playsMultiplier),
  }));
  clone.plays_by_day = clone.plays_by_day.map((item) => ({
    ...item,
    plays: scaleValue(item.plays, playsMultiplier),
  }));

  clone.screen_usage = clone.screen_usage.map((item) => ({
    ...item,
    spend: scaleValue(item.spend, multiplier),
    impressions: scaleValue(item.impressions, multiplier),
    total_hours: scaleValue(item.total_hours, Math.max(1, multiplier * 0.95)),
  }));

  clone.location_breakdown = clone.location_breakdown.map((item) => ({
    ...item,
    spend: scaleValue(item.spend, multiplier),
    impressions: scaleValue(item.impressions, multiplier),
  }));

  clone.cumulative_reach = clone.cumulative_reach.map((item) => ({
    ...item,
    reach: scaleValue(item.reach, multiplier),
  }));

  clone.reach_by_screen = clone.reach_by_screen.map((item) => ({
    ...item,
    reach: scaleValue(item.reach, multiplier),
  }));

  clone.reach_by_daypart = clone.reach_by_daypart.map((item) => ({
    ...item,
    reach: scaleValue(item.reach, multiplier),
  }));

  clone.creatives = clone.creatives.map((item) => ({
    ...item,
    plays: scaleValue(item.plays, playsMultiplier),
    impressions: scaleValue(item.impressions, multiplier),
  }));

  clone.heatmap_data = clone.heatmap_data.map((item) => ({
    ...item,
    intensity: clamp(Math.round(item.intensity * Math.max(0.9, multiplier * 0.9))),
  }));

  return clone;
}

function useCountUp(target: number, key: string, duration = 600) {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    let frame = 0;
    let start = 0;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [target, key, duration]);

  return value;
}

function DarkTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string; name?: string }>;
  label?: string | number;
  formatter?: (value: number | string, label?: string | number, payload?: Array<{ value?: number | string; name?: string }>) => string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="whitespace-nowrap rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
      {formatter ? formatter(value, label, payload) : `${label} — ${value}`}
    </div>
  );
}

function EmptyState({ actionLabel = "Book a Campaign" }: { actionLabel?: string }) {
  return (
    <div className="flex h-[190px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <BarChart2 className="h-5 w-5" />
      </div>
      <p className="text-sm text-gray-500">No data for this period</p>
      <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700">
        {actionLabel} →
      </button>
    </div>
  );
}

function ChartCardMenu({
  onSelect,
}: {
  onSelect: (action: MenuAction) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          >
            {chartMenuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onSelect(item.key);
                  setOpen(false);
                }}
                className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  right,
  footerValue,
  footerTrend,
  positive = true,
  className,
  onMenuAction,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  footerValue?: React.ReactNode;
  footerTrend?: React.ReactNode;
  positive?: boolean;
  className?: string;
  onMenuAction: (action: MenuAction) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-gray-500">{title}</p>
          {subtitle ? <p className="mt-0.5 text-[11px] text-gray-400">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {right}
          <ChartCardMenu onSelect={onMenuAction} />
        </div>
      </div>
      <div className="mt-4">{children}</div>
      {footerValue || footerTrend ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {footerValue ? <div className="text-2xl font-bold text-gray-900">{footerValue}</div> : null}
          {footerTrend ? (
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
              )}
            >
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{footerTrend}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TabChartSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <ChartSkeleton className="xl:col-span-1" />
      <ChartSkeleton className="xl:col-span-2" />
      <ChartSkeleton className="xl:col-span-3" />
      <ChartSkeleton className="xl:col-span-1" />
      <ChartSkeleton className="xl:col-span-1" />
      <ChartSkeleton className="xl:col-span-1" />
    </div>
  );
}

function StatCardSparkline({
  label,
  value,
  trend,
  positive = true,
  color,
  points,
  countKey,
  suffix,
  currency,
  subtitle,
  onClick,
  alert,
}: {
  label: string;
  value: number;
  trend: string;
  positive?: boolean;
  color: string;
  points: number[];
  countKey: string;
  suffix?: string;
  currency?: boolean;
  subtitle?: string;
  onClick?: () => void;
  alert?: boolean;
}) {
  const animated = useCountUp(value, countKey);
  const max = Math.max(...points);
  const chartData = points.map((pt, index) => ({ idx: index, val: pt, fill: pt === max ? color : `${color}CC` }));

  const valueDisplay = currency
    ? formatUGX(animated)
    : `${animated.toLocaleString()}${suffix ?? ""}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition-shadow duration-200 hover:shadow-md",
        alert && "border-amber-200 bg-amber-50/40",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray-400">{label}</p>
      <p className={cn("mt-2 text-[28px] font-bold leading-none text-gray-900", alert && "text-amber-700")}>{valueDisplay}</p>
      {subtitle ? <p className="mt-1 text-[11px] text-gray-400">{subtitle}</p> : null}
      <div className="mt-3 h-12 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`${label}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="val"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${label}-fill)`}
              dot={false}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div
        className={cn(
          "mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
          positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
        )}
      >
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span>{trend}</span>
      </div>
    </button>
  );
}

function ProgressBarRow({
  label,
  amount,
  pct,
  color,
  onClick,
}: {
  label: string;
  amount: string;
  pct: number;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-gray-50"
    >
      <div className="w-[92px] shrink-0 text-xs font-medium text-gray-600">{label}</div>
      <div className="h-2 flex-1 rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-[120px] text-right text-xs text-gray-500">{amount}</div>
      <div className="w-10 text-right text-xs font-medium text-blue-600">{pct}%</div>
    </button>
  );
}

type HeatmapPoint = { day: string; hour: string; intensity: number; value: number };

function HeatmapGrid({
  title,
  subtitle,
  points,
  scheme = "blue",
  onCellClick,
  insights,
  onMenuAction,
}: {
  title: string;
  subtitle: string;
  points: HeatmapPoint[];
  scheme?: "blue" | "green";
  onCellClick: (point: HeatmapPoint) => void;
  insights: Array<{ text: string; tone: "blue" | "green" | "amber" }>;
  onMenuAction: (action: MenuAction) => void;
}) {
  const map = React.useMemo(() => {
    const value = new Map<string, HeatmapPoint>();
    points.forEach((item) => value.set(`${item.day}-${item.hour}`, item));
    return value;
  }, [points]);

  const colorsBlue = [
    "bg-gray-50",
    "bg-blue-50",
    "bg-blue-50",
    "bg-blue-100",
    "bg-blue-100",
    "bg-blue-300",
    "bg-blue-300",
    "bg-blue-500",
    "bg-blue-500",
    "bg-blue-700",
    "bg-blue-700",
  ];
  const colorsGreen = [
    "bg-gray-50",
    "bg-green-50",
    "bg-green-50",
    "bg-green-100",
    "bg-green-100",
    "bg-green-300",
    "bg-green-300",
    "bg-green-500",
    "bg-green-500",
    "bg-green-700",
    "bg-green-700",
  ];
  const palette = scheme === "green" ? colorsGreen : colorsBlue;

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      className="xl:col-span-3"
      onMenuAction={onMenuAction}
    >
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="mb-2 grid grid-cols-[56px_repeat(7,minmax(0,1fr))] gap-1.5">
            <div />
            {days.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-400">
                {day}
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] gap-1.5">
                <div className="pr-2 text-right text-xs text-gray-400">{hour}</div>
                {days.map((day) => {
                  const row = map.get(`${day}-${hour}`) ?? { day, hour, intensity: 0, value: 0 };
                  const shade = palette[clamp(row.intensity, 0, 10)];
                  return (
                    <button
                      key={`${day}-${hour}`}
                      type="button"
                      onClick={() => onCellClick(row)}
                      className={cn(
                        "group relative h-7 rounded-md transition-transform duration-150 hover:scale-105",
                        shade,
                        row.intensity >= 8 ? "text-white" : "text-gray-700",
                      )}
                    >
                      <span className="text-[10px] font-medium">{row.value ? Math.round(row.value / 10) : ""}</span>
                      <span className="pointer-events-none absolute left-1/2 top-0 z-10 hidden -translate-x-1/2 -translate-y-[120%] whitespace-nowrap rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
                        {day} {hour} — {row.value.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {insights.map((insight) => (
          <div
            key={insight.text}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-medium",
              insight.tone === "blue" && "bg-blue-50 text-blue-700",
              insight.tone === "green" && "bg-green-50 text-green-700",
              insight.tone === "amber" && "bg-amber-50 text-amber-700",
            )}
          >
            {insight.text}
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function DetailModal({
  open,
  title,
  onClose,
  children,
  footer,
  size = "max-w-2xl",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: string;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            aria-label="Close"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "relative z-10 flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl",
              size,
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-gray-100 bg-white px-5 py-4">
              {footer ?? (
                <LoadingButton variant="secondary" onClick={onClose}>
                  Close
                </LoadingButton>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

type DetailState = {
  open: boolean;
  title: string;
  body: React.ReactNode;
  size?: string;
};

export default function CustomerReportsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<ReportTab>("overview");
  const [period, setPeriod] = React.useState<ReportPeriod>("this_month");
  const [reportData, setReportData] = React.useState<ReportData>(() => buildPeriodData("this_month"));
  const [periodLoading, setPeriodLoading] = React.useState(false);
  const [tabLoading, setTabLoading] = React.useState(false);
  const [renderKey, setRenderKey] = React.useState(0);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<DetailState>({
    open: false,
    title: "",
    body: null,
  });
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [campaignFilter, setCampaignFilter] = React.useState<CampaignFilter>("all");
  const [creativeFilter, setCreativeFilter] = React.useState<CreativeFilter>("all");
  const [reachMode, setReachMode] = React.useState<"cumulative" | "per_campaign">("cumulative");
  const [campaignView, setCampaignView] = React.useState<"monthly" | "weekly">("monthly");
  const [spendView, setSpendView] = React.useState<"monthly" | "quarterly" | "yearly">("monthly");

  const loading = periodLoading || tabLoading;

  React.useEffect(() => {
    setPeriodLoading(true);
    const timer = window.setTimeout(() => {
      setReportData(buildPeriodData(period));
      setRenderKey((prev) => prev + 1);
      setPeriodLoading(false);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [period]);

  const handleTabChange = (tab: ReportTab) => {
    if (tab === activeTab) return;
    setTabLoading(true);
    setActiveTab(tab);
    window.setTimeout(() => {
      setRenderKey((prev) => prev + 1);
      setTabLoading(false);
    }, 150);
  };

  const openModal = (title: string, body: React.ReactNode, size?: string) => {
    setDetail({ open: true, title, body, size });
  };

  const closeModal = () => setDetail((prev) => ({ ...prev, open: false }));

  const handleMenuAction = (title: string, action: MenuAction, expandBody?: React.ReactNode) => {
    if (action === "view_larger" && expandBody) {
      openModal(`${title} — Expanded View`, expandBody, "max-w-[80vw]");
      return;
    }
    showToast({
      type: "success",
      title: "Chart action",
      message:
        action === "export_chart"
          ? `${title} exported to preview`
          : action === "download_png"
            ? `${title} PNG download queued`
            : action === "add_to_report"
              ? `${title} added to report`
              : `${title} action completed`,
    });
  };

  const summaryCards = [
    {
      label: "TOTAL SPEND",
      value: reportData.summary.total_spend,
      trend: `+${reportData.summary.total_spend_trend}% from last period`,
      color: COLORS.blue,
      points: [12, 18, 14, 22, 25, 28],
      currency: true,
      onClick: () => handleTabChange("spending"),
    },
    {
      label: "EST. IMPRESSIONS",
      value: reportData.summary.total_impressions,
      trend: `+${reportData.summary.total_impressions_trend}% from last period`,
      color: COLORS.purple,
      points: [40, 58, 52, 61, 71, 79],
      onClick: () => handleTabChange("reach"),
    },
    {
      label: "CAMPAIGNS RUN",
      value: reportData.summary.campaigns_run,
      trend: `+${reportData.summary.campaigns_trend} this month`,
      color: COLORS.green,
      points: [1, 1, 2, 2, 3, 3],
      onClick: () => handleTabChange("campaigns"),
    },
    {
      label: "TOTAL AIRTIME",
      value: reportData.summary.total_airtime_hours,
      trend: `+${reportData.summary.airtime_trend}% from last period`,
      color: COLORS.amber,
      points: [42, 64, 71, 102, 144, 227],
      suffix: " hrs",
      onClick: () => {},
    },
  ];

  const monthlySpendRows = reportData.monthly_spend.map((row) => ({
    ...row,
    previous: Math.round(row.spend * 0.72),
  }));

  const impressionCampaignRows = reportData.impressions_by_campaign.map((item) => ({
    campaign: item.campaign,
    plays: item.plays,
    impressions: item.impressions_high,
    color:
      item.status === "completed"
        ? COLORS.purple
        : item.status === "live"
          ? COLORS.blue
          : "#94A3B8",
  }));

  const campaignStatusRows = reportData.campaigns_by_status.filter((item) => item.count >= 0);
  const spendByScreenRows = reportData.spend_by_screen.map((item) => ({
    ...item,
    pct: Math.round((item.spend / (reportData.summary.total_spend || 1)) * 100),
  }));

  const paymentRows = reportData.payment_methods.map((item, index) => ({
    ...item,
    color: index === 0 ? COLORS.amber : COLORS.purple,
  }));

  const heatmapPointRows: HeatmapPoint[] = React.useMemo(() => {
    const map = new Map<string, number>();
    reportData.heatmap_data.forEach((item) => map.set(`${item.day}-${item.hour}`, item.intensity));

    return days.flatMap((day, dayIndex) =>
      hours.map((hour) => {
        const intensity = map.get(`${day}-${hour}`) ?? ((dayIndex + hour.length) % 3);
        const hourPlays = reportData.plays_by_hour.find((entry) => entry.hour === hour)?.plays ?? 0;
        const dayPlays = reportData.plays_by_day.find((entry) => entry.day === day)?.plays ?? 0;
        const value = Math.round(hourPlays * ((dayPlays || 1) / 620));
        return { day, hour, intensity: clamp(intensity), value };
      }),
    );
  }, [reportData]);

  const reachHeatmapRows: HeatmapPoint[] = React.useMemo(
    () =>
      heatmapPointRows.map((item) => ({
        ...item,
        value: Math.round(item.value * 4.1),
        intensity: clamp(item.intensity + (item.value > 28 ? 2 : 0)),
      })),
    [heatmapPointRows],
  );

  const transactions = React.useMemo(
    () =>
      mockInvoices.map((invoice) => {
        const booking = mockBookings.find((item) => item.ref === invoice.booking_ref);
        const status = String(invoice.status).toLowerCase() as StatusFilter;
        return {
          id: invoice.id,
          date: invoice.due_date,
          campaign: booking?.ref ?? invoice.booking_ref,
          screen: invoice.screen,
          duration: booking?.duration ?? "—",
          amount: invoice.total,
          method: invoice.method ?? "Pending",
          status,
        };
      }),
    [],
  );

  const filteredTransactions = transactions.filter((row) =>
    statusFilter === "all" ? true : row.status === statusFilter,
  );

  const campaignHistory = reportData.impressions_by_campaign.map((item) => {
    const booking = mockBookings.find((entry) => entry.screen.includes(item.screen.split(" ")[0]));
    return {
      id: item.campaign,
      campaign: item.campaign,
      screen: item.screen,
      start: item.date.includes("-") ? item.date.split("-")[0] : item.date,
      end: item.date.includes("-") ? item.date.split("-")[1] : item.date,
      duration: booking?.duration ?? "7 days",
      plays: item.plays,
      impressions: item.impressions_high,
      spend:
        reportData.spend_by_screen.find((screen) =>
          item.screen.toLowerCase().includes(screen.screen.toLowerCase().split(" ")[0]),
        )?.spend ?? 0,
      status: (item.status ?? "scheduled").toLowerCase() as CampaignFilter,
    };
  });

  const filteredCampaignHistory = campaignHistory.filter((item) =>
    campaignFilter === "all" ? true : item.status === campaignFilter,
  );

  const creativeCards = reportData.creatives.map((item) => ({
    ...item,
    status: String(item.status).toLowerCase(),
  }));

  const filteredCreatives = creativeCards.filter((item) =>
    creativeFilter === "all" ? true : item.status === creativeFilter,
  );

  const totalPlays = reportData.plays_by_day.reduce((sum, row) => sum + row.plays, 0);
  const avgCampaignDuration = Math.round(
    mockBookings.reduce((sum, row) => sum + (parseInt(row.duration, 10) || 0), 0) /
      Math.max(mockBookings.length, 1),
  );
  const peakHourRow = reportData.plays_by_hour.reduce((best, row) => (row.plays > best.plays ? row : best), reportData.plays_by_hour[0]);
  const totalReach = reportData.cumulative_reach[reportData.cumulative_reach.length - 1]?.reach ?? 0;
  const avgReachPerCampaign = Math.round(
    totalReach / Math.max(reportData.impressions_by_campaign.length, 1),
  );
  const bestScreenReach = reportData.reach_by_screen.reduce((best, row) => (row.reach > best.reach ? row : best), reportData.reach_by_screen[0]);

  const statsCalcText = React.useMemo(
    () =>
      `${reportData.summary.total_impressions.toLocaleString()} = ${reportData.reach_by_screen
        .map((row) => `${row.reach.toLocaleString()} (${row.screen})`)
        .join(" + ")}`,
    [reportData],
  );

  const renderOverviewTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <StatCardSparkline
            key={item.label}
            label={item.label}
            value={item.value}
            trend={item.trend}
            positive={!item.trend.startsWith("-")}
            color={item.color}
            points={item.points}
            countKey={`${renderKey}-${item.label}`}
            suffix={item.suffix}
            currency={item.currency}
            onClick={item.onClick}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="Monthly Spend Trend"
          className="xl:col-span-2"
          right={
            <div className="inline-flex rounded-full bg-gray-100 p-1">
              <button className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700">Monthly</button>
              <button className="rounded-full px-2.5 py-1 text-[11px] text-gray-500">Yearly</button>
            </div>
          }
          footerValue={formatUGX(reportData.summary.total_spend)}
          footerTrend={`+${reportData.summary.total_spend_trend}% from last period`}
          onMenuAction={(action) =>
            handleMenuAction(
              "Monthly Spend Trend",
              action,
              <div className="h-[72vh]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlySpendRows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatYAxis}
                    />
                    <YAxis yAxisId="right" orientation="right" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <Tooltip content={<DarkTooltip formatter={(value, label, payload) => `${label} — ${formatUGX(Number(value))} | ${payload?.[1]?.value ?? 0} campaign`} />} />
                    <Bar
                      dataKey="spend"
                      yAxisId="left"
                      fill={COLORS.blue}
                      radius={[6, 6, 0, 0]}
                      onClick={(value) => {
                        const month = String((value as { month?: string })?.month ?? "Month");
                        openModal(
                          `${month} — Campaign List`,
                          <div className="space-y-3">
                            {mockBookings.map((booking) => (
                              <CampaignCard
                                key={booking.ref}
                                image={booking.screen_image}
                                title={booking.screen}
                                location={booking.screen}
                                startDate={booking.start.split(" ")[0]}
                                endDate={booking.end.split(" ")[0]}
                                status={booking.campaign_status}
                                amount={booking.amount}
                                duration={booking.duration}
                                reference={booking.ref}
                                href={`/dashboard/customer/campaigns/${booking.id}`}
                              />
                            ))}
                          </div>,
                        );
                      }}
                    />
                    <Line dataKey="campaigns" yAxisId="right" stroke={COLORS.green} strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>,
            )
          }
        >
          {monthlySpendRows.length ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlySpendRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatYAxis}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={
                      <DarkTooltip
                        formatter={(value, label, payload) =>
                          `${label} — ${formatUGX(Number(value))} | ${payload?.[1]?.value ?? 0} campaign`
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="spend"
                    yAxisId="left"
                    fill={COLORS.blue}
                    radius={[6, 6, 0, 0]}
                    isAnimationActive
                    animationDuration={500}
                    animationEasing="ease-out"
                    onClick={(item) => {
                      const month = String((item as { month?: string })?.month ?? "Month");
                      const rows = mockBookings.filter((booking) =>
                        booking.start.toLowerCase().includes(month.toLowerCase()),
                      );
                      openModal(
                        `${month} — Campaign List`,
                        <div className="space-y-3">
                          {(rows.length ? rows : mockBookings).map((booking) => (
                            <CampaignCard
                              key={booking.ref}
                              image={booking.screen_image}
                              title={booking.screen}
                              location={booking.screen}
                              startDate={booking.start.split(" ")[0]}
                              endDate={booking.end.split(" ")[0]}
                              status={booking.campaign_status}
                              amount={booking.amount}
                              duration={booking.duration}
                              reference={booking.ref}
                              href={`/dashboard/customer/campaigns/${booking.id}`}
                            />
                          ))}
                        </div>,
                      );
                    }}
                  />
                  <Line
                    dataKey="campaigns"
                    yAxisId="right"
                    stroke={COLORS.green}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive
                    animationDuration={600}
                    animationEasing="ease-out"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard
          title="Spend by Screen"
          className="xl:col-span-1"
          footerValue="3 screens"
          footerTrend="Distribution by location"
          onMenuAction={(action) =>
            handleMenuAction(
              "Spend by Screen",
              action,
              <div className="h-[72vh]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendByScreenRows}
                      dataKey="spend"
                      nameKey="screen"
                      innerRadius={130}
                      outerRadius={190}
                      paddingAngle={3}
                    >
                      {spendByScreenRows.map((item, index) => (
                        <Cell
                          key={item.screen}
                          fill={[COLORS.blue, COLORS.purple, COLORS.green][index % 3]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={
                        <DarkTooltip
                          formatter={(value, label) => `${label} — ${formatUGX(Number(value))}`}
                        />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>,
            )
          }
        >
          {spendByScreenRows.length ? (
            <div className="space-y-3">
              <div className="relative h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendByScreenRows}
                      dataKey="spend"
                      nameKey="screen"
                      innerRadius={58}
                      outerRadius={85}
                      paddingAngle={3}
                      onClick={(row) => {
                        const screen = (row as { name?: string })?.name ?? "Screen";
                        const details = reportData.screen_usage.find((item) =>
                          item.screen.toLowerCase().includes(screen.toLowerCase().split(" ")[0]),
                        );
                        openModal(
                          `${screen} — Spend Detail`,
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-xl border border-slate-200 p-3">
                                <p className="text-xs text-gray-400">Total Spend</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {formatUGX(details?.spend ?? 0)}
                                </p>
                              </div>
                              <div className="rounded-xl border border-slate-200 p-3">
                                <p className="text-xs text-gray-400">Bookings</p>
                                <p className="text-lg font-semibold text-gray-900">{details?.bookings ?? 0}</p>
                              </div>
                            </div>
                            <LoadingButton onClick={() => router.push("/dashboard/customer/screens")}>
                              Book This Screen Again
                            </LoadingButton>
                          </div>,
                        );
                      }}
                      isAnimationActive
                      animationDuration={400}
                      animationEasing="ease-out"
                    >
                      {spendByScreenRows.map((item, index) => (
                        <Cell key={item.screen} fill={[COLORS.blue, COLORS.purple, COLORS.green][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={
                        <DarkTooltip
                          formatter={(value, label) => `${label} — ${formatUGX(Number(value))}`}
                        />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-semibold text-gray-900">3</p>
                  <p className="text-[11px] text-gray-400">screens</p>
                </div>
              </div>
              <div className="space-y-2">
                {spendByScreenRows.map((item, index) => (
                  <button
                    key={item.screen}
                    type="button"
                    onClick={() =>
                      openModal(
                        `${item.screen} — Spend Detail`,
                        <div className="space-y-3 text-sm text-gray-600">
                          <div className="rounded-xl border border-slate-200 p-3">
                            <p>
                              {item.screen} received {item.pct}% of spend with {formatUGX(item.spend)} total.
                            </p>
                          </div>
                        </div>,
                      )
                    }
                    className="flex w-full items-center justify-between text-left text-xs"
                  >
                    <span className="flex items-center gap-2 text-gray-600">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: [COLORS.blue, COLORS.purple, COLORS.green][index % 3],
                        }}
                      />
                      {item.screen}
                    </span>
                    <span className="font-medium text-gray-700">
                      {formatUGX(item.spend)} · {item.pct}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="Campaign Status"
          footerValue={`${reportData.summary.campaigns_run}`}
          footerTrend="Total campaigns"
          onMenuAction={(action) => handleMenuAction("Campaign Status", action)}
        >
          {campaignStatusRows.length ? (
            <div className="space-y-3">
              <div className="relative h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={campaignStatusRows}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={54}
                      outerRadius={84}
                      paddingAngle={2}
                      onClick={(segment) => {
                        const status = String((segment as { name?: string })?.name ?? "all").toLowerCase();
                        handleTabChange("campaigns");
                        setCampaignFilter(status as CampaignFilter);
                      }}
                    >
                      {campaignStatusRows.map((item) => (
                        <Cell key={item.status} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${value}`} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-semibold text-gray-900">{reportData.summary.campaigns_run}</p>
                  <p className="text-[11px] text-gray-400">campaigns</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {campaignStatusRows.map((row) => (
                  <div key={row.status} className="flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                      {row.status}
                    </span>
                    <span>{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard
          title="Plays by Campaign"
          footerValue="Best: Café Javas Promo"
          footerTrend="2,890 total plays"
          onMenuAction={(action) => handleMenuAction("Plays by Campaign", action)}
        >
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={impressionCampaignRows} layout="vertical" margin={{ left: 6, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="campaign"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  width={106}
                />
                <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${Number(value).toLocaleString()} plays`} />} />
                <Bar
                  dataKey="plays"
                  radius={[0, 6, 6, 0]}
                  onClick={(row) => {
                    const name = String((row as { campaign?: string })?.campaign ?? "Campaign");
                    const campaign = mockBookings.find((entry) =>
                      entry.screen.toLowerCase().includes(name.toLowerCase().split(" ")[0]),
                    );
                    if (campaign) {
                      router.push(`/dashboard/customer/campaigns/${campaign.id}`);
                    }
                  }}
                >
                  {impressionCampaignRows.map((entry) => (
                    <Cell key={entry.campaign} fill={entry.color} />
                  ))}
                  <LabelList position="right" dataKey="plays" style={{ fontSize: 11, fill: "#6B7280" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Payment Methods"
          footerValue="2 methods"
          footerTrend="Split by paid invoices"
          onMenuAction={(action) => handleMenuAction("Payment Methods", action)}
        >
          <div className="space-y-3">
            <div className="relative h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentRows}
                    dataKey="amount"
                    nameKey="method"
                    innerRadius={52}
                    outerRadius={84}
                    onClick={(row) => {
                      const method = String((row as { name?: string })?.name ?? "");
                      router.push(`/dashboard/customer/invoices?method=${encodeURIComponent(method)}`);
                    }}
                  >
                    {paymentRows.map((entry) => (
                      <Cell key={entry.method} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <DarkTooltip formatter={(value, label) => `${label} — ${formatUGX(Number(value))}`} />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg font-semibold text-gray-900">2</p>
                <p className="text-[11px] text-gray-400">methods</p>
              </div>
            </div>
            {paymentRows.map((row) => (
              <div key={row.method} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                  {row.method}
                </span>
                <span className="font-medium text-gray-700">
                  {formatUGX(row.amount)} · {row.pct}%
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <HeatmapGrid
        title="Ad Performance Heatmap"
        subtitle="Plays by day and hour (all campaigns)"
        points={heatmapPointRows}
        scheme="blue"
        onMenuAction={(action) => handleMenuAction("Ad Performance Heatmap", action)}
        onCellClick={(point) =>
          openModal(
            `${point.day} ${point.hour} — Performance`,
            <div className="space-y-4 text-sm text-gray-600">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="font-medium text-gray-900">{point.value.toLocaleString()} plays at this slot</p>
                <p className="mt-1 text-xs text-gray-500">Estimated reach: {(point.value * 4).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                {reportData.impressions_by_campaign.map((campaign) => (
                  <div key={campaign.campaign} className="rounded-lg border border-slate-100 p-3">
                    <p className="font-medium text-gray-900">{campaign.campaign}</p>
                    <p className="text-xs text-gray-500">{campaign.screen}</p>
                  </div>
                ))}
              </div>
            </div>,
          )
        }
        insights={[
          { text: "📍 Peak: Friday 8PM — 85 plays", tone: "blue" },
          { text: "📈 Best day: Saturday (710 plays avg)", tone: "green" },
          { text: "💡 Book Fri-Sat 6-9PM for max reach", tone: "amber" },
        ]}
      />
    </div>
  );

  const renderSpendingTab = () => {
    const spendStats = [
      {
        label: "TOTAL SPEND",
        value: reportData.summary.total_spend,
        trend: "+23.4% vs last period",
        color: COLORS.blue,
        points: [11, 15, 12, 22, 30, 38],
        currency: true,
      },
      {
        label: "AVG CAMPAIGN VALUE",
        value: reportData.summary.avg_campaign_value,
        trend: "+10.2% this period",
        color: COLORS.purple,
        points: [10, 12, 15, 19, 21, 24],
        currency: true,
      },
      {
        label: "OUTSTANDING BALANCE",
        value: reportData.summary.outstanding_balance,
        trend: "Pending collection",
        color: COLORS.amber,
        points: [32, 29, 27, 24, 22, 20],
        currency: true,
        alert: reportData.summary.outstanding_balance > 0,
      },
      {
        label: "VAT PAID",
        value: reportData.vat_paid_total,
        trend: "+8.1% this period",
        color: COLORS.green,
        points: [9, 12, 16, 19, 21, 24],
        currency: true,
      },
    ];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {spendStats.map((item) => (
            <div key={item.label} className="space-y-1">
              <StatCardSparkline
                label={item.label}
                value={item.value}
                trend={item.trend}
                positive={!item.trend.toLowerCase().includes("pending")}
                color={item.color}
                points={item.points}
                countKey={`${renderKey}-spending-${item.label}`}
                currency={item.currency}
                alert={item.alert}
              />
              {item.label === "OUTSTANDING BALANCE" ? (
                <button
                  type="button"
                  className="pl-2 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                  onClick={() => router.push("/dashboard/customer/invoices")}
                >
                  Pay Now →
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            title="Spend Over Time"
            className="xl:col-span-2"
            right={
              <div className="inline-flex rounded-full bg-gray-100 p-1">
                {(["monthly", "quarterly", "yearly"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSpendView(mode)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] capitalize",
                      spendView === mode ? "bg-white font-medium text-gray-700" : "text-gray-500",
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            }
            footerValue={formatUGX(reportData.summary.total_spend)}
            footerTrend="+23.4% vs last period"
            onMenuAction={(action) => handleMenuAction("Spend Over Time", action)}
          >
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlySpendRows}>
                  <defs>
                    <linearGradient id="spend-over-time" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                  <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${formatUGX(Number(value))}`} />} />
                  <Area dataKey="spend" fill="url(#spend-over-time)" stroke={COLORS.blue} strokeWidth={2} />
                  <Line dataKey="previous" stroke="#94A3B8" strokeDasharray="4 4" dot={false} strokeWidth={1.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-0.5 w-4 bg-blue-600" /> This period
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-0.5 w-4 border-b border-dashed border-gray-400" /> Last period
              </span>
            </div>
          </ChartCard>

          <ChartCard
            title="Spend by Screen"
            className="xl:col-span-1"
            footerValue={`Best: ${spendByScreenRows[0]?.screen ?? "—"}`}
            footerTrend={`${formatUGX(spendByScreenRows[0]?.spend ?? 0)} top allocation`}
            onMenuAction={(action) => handleMenuAction("Spend by Screen", action)}
          >
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendByScreenRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="screen" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                  <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${formatUGX(Number(value))}`} />} />
                  <Bar
                    dataKey="spend"
                    radius={[6, 6, 0, 0]}
                    onClick={(item) => {
                      const screen = String((item as { screen?: string })?.screen ?? "Screen");
                      const detailRow = reportData.screen_usage.find((row) => row.screen.includes(screen.split(" ")[0]));
                      openModal(
                        `${screen} — Screen Spend Detail`,
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-slate-200 p-3">
                              <p className="text-xs text-gray-400">Total Hours</p>
                              <p className="text-lg font-semibold text-gray-900">{detailRow?.total_hours ?? 0} hrs</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-3">
                              <p className="text-xs text-gray-400">Total Spend</p>
                              <p className="text-lg font-semibold text-gray-900">{formatUGX(detailRow?.spend ?? 0)}</p>
                            </div>
                          </div>
                          <LoadingButton onClick={() => router.push("/dashboard/customer/screens")}>
                            Book Again
                          </LoadingButton>
                        </div>,
                      );
                    }}
                  >
                    {spendByScreenRows.map((entry, index) => (
                      <Cell key={entry.screen} fill={[COLORS.blue, COLORS.purple, COLORS.green][index % 3]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            title="Spend by Time Slot"
            onMenuAction={(action) => handleMenuAction("Spend by Time Slot", action)}
            footerValue={formatUGX(reportData.summary.total_spend)}
            footerTrend="Allocation by daypart"
          >
            <div className="space-y-1.5">
              {reportData.spend_by_time_slot
                .slice()
                .sort((a, b) => b.pct - a.pct)
                .map((slot, index) => (
                  <ProgressBarRow
                    key={slot.slot}
                    label={slot.slot}
                    amount={formatUGX(slot.spend)}
                    pct={slot.pct}
                    color={index === 0 ? COLORS.blue : index === 1 ? COLORS.teal : "#93C5FD"}
                    onClick={() =>
                      openModal(
                        `${slot.slot} — Filtered Campaigns`,
                        <div className="space-y-3">
                          {mockBookings.map((booking) => (
                            <div key={booking.ref} className="rounded-xl border border-slate-200 p-3 text-sm">
                              <p className="font-medium text-gray-900">{booking.ref}</p>
                              <p className="text-xs text-gray-500">{booking.screen}</p>
                            </div>
                          ))}
                        </div>,
                      )
                    }
                  />
                ))}
            </div>
          </ChartCard>

          <ChartCard
            title="Payment Methods"
            subtitle="Conversion style split"
            onMenuAction={(action) => handleMenuAction("Payment Methods", action)}
          >
            <div className="space-y-4">
              {paymentRows.map((method) => (
                <button
                  key={method.method}
                  type="button"
                  onClick={() =>
                    openModal(
                      `${method.method} — Filtered Invoices`,
                      <div className="space-y-2">
                        {mockInvoices
                          .filter((invoice) => (invoice.method ?? "").toLowerCase() === method.method.toLowerCase())
                          .map((invoice) => (
                            <div key={invoice.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                              <p className="font-medium text-gray-900">{invoice.number}</p>
                              <p className="text-xs text-gray-500">{formatUGX(invoice.total)}</p>
                            </div>
                          ))}
                      </div>,
                    )
                  }
                  className="w-full rounded-xl border border-slate-100 p-3 text-left transition hover:bg-gray-50"
                >
                  <p className="text-xs text-gray-500">{method.method}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{method.pct}%</p>
                  <p className="text-[11px] text-gray-400">1 payment this period</p>
                  <div className="mt-2 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[3, 5, 4, 6, 5, 7, 5].map((count, index) => ({
                          day: index + 1,
                          count: method.method === "MTN MoMo" ? count : Math.max(1, Math.round(count * 1.5)),
                        }))}
                      >
                        <Bar dataKey="count" fill={method.color} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </button>
              ))}
            </div>
          </ChartCard>

          <ChartCard
            title="Invoice Summary"
            subtitle="Monthly invoices"
            onMenuAction={(action) => handleMenuAction("Invoice Summary", action)}
            footerValue={`${reportData.invoices_summary.reduce((sum, row) => sum + row.invoices, 0)} total invoices`}
            footerTrend={`${reportData.invoices_summary.reduce((sum, row) => sum + row.paid, 0)} paid · ${reportData.invoices_summary.reduce((sum, row) => sum + row.unpaid, 0)} outstanding`}
          >
            <div className="space-y-2.5">
              {reportData.invoices_summary.map((row) => (
                <button
                  key={row.month}
                  type="button"
                  onClick={() =>
                    openModal(
                      `${row.month} — Invoice Detail`,
                      <div className="space-y-2">
                        {mockInvoices.map((invoice) => (
                          <div key={invoice.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                            <p className="font-medium text-gray-900">{invoice.number}</p>
                            <p className="text-xs text-gray-500">
                              {invoice.status.toUpperCase()} · {formatUGX(invoice.total)}
                            </p>
                          </div>
                        ))}
                      </div>,
                    )
                  }
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-600">{row.month}</span>
                  <span className="flex items-center gap-2 text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-600" />
                      {row.paid} paid
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      {row.unpaid} unpaid
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title="All Transactions"
          subtitle="Date · Campaign · Screen · Duration · Amount · Method · Status"
          className="xl:col-span-3"
          right={
            <LoadingButton
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              onClick={() => setExportOpen(true)}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </LoadingButton>
          }
          onMenuAction={(action) => handleMenuAction("All Transactions", action)}
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {(["all", "paid", "unpaid", "overdue"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium capitalize",
                  statusFilter === filter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Date", "Campaign", "Screen", "Duration", "Amount", "Method", "Status"].map((heading) => (
                    <th key={heading} className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() =>
                      openModal(
                        `${row.campaign} — Transaction`,
                        <div className="space-y-3 text-sm text-gray-600">
                          <p>Screen: {row.screen}</p>
                          <p>Amount: {formatUGX(row.amount)}</p>
                          <p>Method: {row.method}</p>
                        </div>,
                      )
                    }
                    className="cursor-pointer border-b border-slate-100 text-sm hover:bg-gray-50"
                  >
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2">{row.campaign}</td>
                    <td className="px-3 py-2">{row.screen}</td>
                    <td className="px-3 py-2">{row.duration}</td>
                    <td className="px-3 py-2 font-medium">{formatUGX(row.amount)}</td>
                    <td className="px-3 py-2">{row.method}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          row.status === "paid" && "bg-green-50 text-green-700",
                          row.status === "unpaid" && "bg-amber-50 text-amber-700",
                          row.status === "overdue" && "bg-red-50 text-red-700",
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    );
  };

  const renderCampaignsTab = () => {
    const startedSeries = monthlySpendRows.map((row) => ({ month: row.month, started: row.campaigns, completed: row.campaigns > 0 ? Math.max(0, row.campaigns - 0) : 0 }));
    const playsByDay = reportData.plays_by_day.map((row) => ({
      ...row,
      color: row.day === "Sat" || row.day === "Sun" ? COLORS.purple : COLORS.blue,
    }));

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCardSparkline
            label="TOTAL CAMPAIGNS"
            value={reportData.summary.campaigns_run}
            trend="+1 this month"
            color={COLORS.blue}
            points={[1, 1, 1, 2, 2, 3]}
            countKey={`${renderKey}-campaign-total`}
          />
          <StatCardSparkline
            label="AVG DURATION"
            value={avgCampaignDuration}
            trend="+2 days average"
            color={COLORS.purple}
            points={[3, 5, 6, 6, 7, 8]}
            countKey={`${renderKey}-campaign-duration`}
            suffix=" days"
          />
          <StatCardSparkline
            label="APPROVAL RATE"
            value={reportData.summary.approval_rate}
            trend={`${reportData.summary.approval_rate >= 70 ? "Healthy approval" : "Needs review"}`}
            positive={reportData.summary.approval_rate >= 70}
            color={reportData.summary.approval_rate >= 70 ? COLORS.green : COLORS.amber}
            points={[72, 74, 76, 79, 82, reportData.summary.approval_rate]}
            countKey={`${renderKey}-campaign-approval`}
            suffix="%"
            alert={reportData.summary.approval_rate < 70}
          />
          <StatCardSparkline
            label="TOTAL PLAYS"
            value={totalPlays}
            trend="+14.5% vs weekdays"
            color={COLORS.green}
            points={[420, 380, 510, 445, 620, 710, 550]}
            countKey={`${renderKey}-campaign-plays`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            title="Campaigns Over Time"
            className="xl:col-span-2"
            right={
              <div className="inline-flex rounded-full bg-gray-100 p-1">
                {(["monthly", "weekly"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setCampaignView(view)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] capitalize",
                      campaignView === view ? "bg-white font-medium text-gray-700" : "text-gray-500",
                    )}
                  >
                    {view}
                  </button>
                ))}
              </div>
            }
            footerValue={`${reportData.summary.campaigns_run} total campaigns`}
            footerTrend="Trend vs previous period"
            onMenuAction={(action) => handleMenuAction("Campaigns Over Time", action)}
          >
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={startedSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={
                      <DarkTooltip
                        formatter={(value, label, payload) =>
                          `${label} — ${payload?.[0]?.value ?? 0} started | ${payload?.[1]?.value ?? 0} completed`
                        }
                      />
                    }
                  />
                  <Line
                    dataKey="started"
                    stroke={COLORS.blue}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                    isAnimationActive
                    animationDuration={600}
                    onClick={(row) =>
                      openModal(
                        `${String((row as { month?: string })?.month ?? "Month")} — Campaigns`,
                        <div className="space-y-3">
                          {mockBookings.map((booking) => (
                            <CampaignCard
                              key={booking.ref}
                              image={booking.screen_image}
                              title={booking.screen}
                              location={booking.screen}
                              startDate={booking.start.split(" ")[0]}
                              endDate={booking.end.split(" ")[0]}
                              status={booking.campaign_status}
                              amount={booking.amount}
                              duration={booking.duration}
                              reference={booking.ref}
                              href={`/dashboard/customer/campaigns/${booking.id}`}
                            />
                          ))}
                        </div>,
                      )
                    }
                  />
                  <Line
                    dataKey="completed"
                    stroke={COLORS.green}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{ r: 5 }}
                    isAnimationActive
                    animationDuration={600}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-0.5 w-4 bg-blue-600" /> Started
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-0.5 w-4 border-b border-dashed border-green-600" /> Completed
              </span>
            </div>
          </ChartCard>

          <ChartCard
            title="Campaign Status"
            className="xl:col-span-1"
            footerValue={`${reportData.summary.campaigns_run}`}
            footerTrend="Status distribution"
            onMenuAction={(action) => handleMenuAction("Campaign Status", action)}
          >
            <div className="space-y-3">
              <div className="relative h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={campaignStatusRows} dataKey="count" nameKey="status" innerRadius={52} outerRadius={82}>
                      {campaignStatusRows.map((row) => (
                        <Cell key={row.status} fill={row.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${value}`} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-gray-900">{reportData.summary.campaigns_run}</p>
                  <p className="text-[11px] text-gray-400">campaigns</p>
                </div>
              </div>
              {campaignStatusRows.map((row) => (
                <div key={row.status} className="flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                    {row.status}
                  </span>
                  <span>{row.count}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            title="Plays Per Campaign"
            footerValue="Best: Café Javas Promo"
            footerTrend="2,890 plays"
            onMenuAction={(action) => handleMenuAction("Plays Per Campaign", action)}
          >
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={impressionCampaignRows} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="campaign" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={106} />
                  <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${Number(value).toLocaleString()} plays`} />} />
                  <Bar
                    dataKey="plays"
                    radius={[0, 6, 6, 0]}
                    onClick={(row) => {
                      const name = String((row as { campaign?: string })?.campaign ?? "");
                      const booking = mockBookings.find((entry) => name.toLowerCase().includes(entry.screen.split(" ")[0].toLowerCase()));
                      if (booking) router.push(`/dashboard/customer/campaigns/${booking.id}`);
                    }}
                  >
                    {impressionCampaignRows.map((row) => (
                      <Cell key={row.campaign} fill={row.color} />
                    ))}
                    <LabelList position="right" dataKey="plays" style={{ fontSize: 11, fill: "#6B7280" }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Plays by Day of Week"
            footerValue="Best day: Saturday"
            footerTrend="710 plays average"
            onMenuAction={(action) => handleMenuAction("Plays by Day of Week", action)}
          >
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={playsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                  <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${value} plays`} />} />
                  <Bar
                    dataKey="plays"
                    radius={[6, 6, 0, 0]}
                    onClick={(row) =>
                      openModal(
                        `${String((row as { day?: string })?.day ?? "")} — Day Detail`,
                        <div className="space-y-2">
                          {reportData.impressions_by_campaign.map((campaign) => (
                            <div key={campaign.campaign} className="rounded-lg border border-slate-200 p-3 text-sm">
                              <p className="font-medium text-gray-900">{campaign.campaign}</p>
                              <p className="text-xs text-gray-500">
                                {campaign.plays.toLocaleString()} plays · {campaign.impressions_high.toLocaleString()} est. reach
                              </p>
                            </div>
                          ))}
                        </div>,
                      )
                    }
                  >
                    {playsByDay.map((entry) => (
                      <Cell key={entry.day} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Plays by Hour"
            footerValue={`Peak: ${peakHourRow.hour}`}
            footerTrend={`${peakHourRow.plays} plays at peak hour`}
            positive={false}
            onMenuAction={(action) => handleMenuAction("Plays by Hour", action)}
          >
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData.plays_by_hour}>
                  <defs>
                    <linearGradient id="hourly-plays-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="hour" interval={1} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${value} plays`} />} />
                  <Area dataKey="plays" stroke={COLORS.blue} fill="url(#hourly-plays-fill)" strokeWidth={2} dot={false} />
                  <ReferenceLine x="8PM" stroke="#EF4444" strokeDasharray="3 3" />
                  <ReferenceDot x="8PM" y={peakHourRow.plays} r={5} fill="#EF4444" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title="Campaign History"
          subtitle="Campaign · Screen · Start · End · Duration · Plays · Impressions · Spend · Status"
          className="xl:col-span-3"
          right={
            <LoadingButton variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setExportOpen(true)}>
              <FileDown className="h-3.5 w-3.5" />
              Export Campaign Report
            </LoadingButton>
          }
          onMenuAction={(action) => handleMenuAction("Campaign History", action)}
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {(["all", "live", "scheduled", "completed"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setCampaignFilter(filter)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium capitalize",
                  campaignFilter === filter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Campaign", "Screen", "Start", "End", "Duration", "Plays", "Impressions", "Spend", "Status"].map((heading) => (
                    <th key={heading} className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCampaignHistory.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-slate-100 text-sm hover:bg-gray-50"
                    onClick={() => {
                      const booking = mockBookings.find((item) =>
                        item.ref.toLowerCase().includes("bk"),
                      );
                      if (booking) router.push(`/dashboard/customer/campaigns/${booking.id}`);
                    }}
                  >
                    <td className="px-3 py-2">{row.campaign}</td>
                    <td className="px-3 py-2">{row.screen}</td>
                    <td className="px-3 py-2">{row.start}</td>
                    <td className="px-3 py-2">{row.end}</td>
                    <td className="px-3 py-2">{row.duration}</td>
                    <td className="px-3 py-2">{row.plays.toLocaleString()}</td>
                    <td className="px-3 py-2">{row.impressions.toLocaleString()}</td>
                    <td className="px-3 py-2">{formatUGX(row.spend)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          row.status === "live" && "bg-green-50 text-green-700",
                          row.status === "scheduled" && "bg-blue-50 text-blue-700",
                          row.status === "completed" && "bg-gray-100 text-gray-700",
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    );
  };

  const renderScreensTab = () => {
    const screensUsed = reportData.screen_usage.length;
    const mostUsed = reportData.screen_usage.reduce(
      (best, row) => (row.total_hours > best.total_hours ? row : best),
      reportData.screen_usage[0],
    );
    const bestRoi = reportData.screen_usage.reduce(
      (best, row) => {
        const score = row.spend ? row.impressions / row.spend : 0;
        const current = best.spend ? best.impressions / best.spend : 0;
        return score > current ? row : best;
      },
      reportData.screen_usage[0],
    );

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCardSparkline
            label="SCREENS USED"
            value={screensUsed}
            trend="Across active campaigns"
            color={COLORS.blue}
            points={[1, 1, 2, 2, 3, 3]}
            countKey={`${renderKey}-screens-used`}
          />
          <StatCardSparkline
            label="MOST USED SCREEN"
            value={mostUsed.total_hours}
            trend={mostUsed.screen}
            color={COLORS.purple}
            points={[4, 7, 16, 43, 67, mostUsed.total_hours]}
            countKey={`${renderKey}-screens-most`}
            suffix=" hrs"
          />
          <StatCardSparkline
            label="BEST ROI SCREEN"
            value={Math.round((bestRoi.spend ? bestRoi.impressions / bestRoi.spend : 0) * 1000)}
            trend={`${bestRoi.screen} ROI`}
            color={COLORS.green}
            points={[2, 3, 5, 8, 11, 13]}
            countKey={`${renderKey}-screens-roi`}
            suffix=" /k"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            title="Screen Performance"
            className="xl:col-span-2"
            footerValue={`Best: ${mostUsed.screen}`}
            footerTrend={formatUGX(mostUsed.spend)}
            onMenuAction={(action) => handleMenuAction("Screen Performance", action)}
          >
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.screen_usage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="screen" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                  <Tooltip
                    content={
                      <DarkTooltip
                        formatter={(_, label, payload) =>
                          `${label} — ${formatUGX(Number(payload?.[0]?.value ?? 0))} | ${Math.round(Number(payload?.[1]?.value ?? 0) * 1000).toLocaleString()} impressions`
                        }
                      />
                    }
                  />
                  <Legend />
                  <Bar dataKey="spend" fill={COLORS.blue} radius={[6, 6, 0, 0]} name="Spend (UGX)" />
                  <Bar
                    dataKey={(row) => Math.round(row.impressions / 1000)}
                    fill={COLORS.purple}
                    radius={[6, 6, 0, 0]}
                    name="Impressions (÷1000)"
                    onClick={(row) =>
                      openModal(
                        `${String((row as { screen?: string })?.screen ?? "Screen")} — Usage Detail`,
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-slate-200 p-3">
                              <p className="text-xs text-gray-400">Bookings</p>
                              <p className="text-lg font-semibold text-gray-900">{(row as { bookings?: number })?.bookings ?? 0}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-3">
                              <p className="text-xs text-gray-400">Hours</p>
                              <p className="text-lg font-semibold text-gray-900">{(row as { total_hours?: number })?.total_hours ?? 0}</p>
                            </div>
                          </div>
                          <LoadingButton onClick={() => router.push("/dashboard/customer/screens")}>Book Again</LoadingButton>
                        </div>,
                      )
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Location Breakdown"
            className="xl:col-span-1"
            footerValue={`${reportData.location_breakdown.length} types`}
            footerTrend="CBD vs Suburban"
            onMenuAction={(action) => handleMenuAction("Location Breakdown", action)}
          >
            <div className="space-y-3">
              <div className="relative h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reportData.location_breakdown} dataKey="spend" nameKey="type" innerRadius={56} outerRadius={84}>
                      {reportData.location_breakdown.map((row, index) => (
                        <Cell key={row.type} fill={index === 0 ? COLORS.blue : COLORS.purple} />
                      ))}
                    </Pie>
                    <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${formatUGX(Number(value))}`} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-semibold text-gray-900">{reportData.location_breakdown.length}</p>
                  <p className="text-[11px] text-gray-400">types</p>
                </div>
              </div>
              <div className="space-y-2">
                {reportData.location_breakdown.map((row, index) => (
                  <ProgressBarRow
                    key={row.type}
                    label={row.type}
                    amount={formatUGX(row.spend)}
                    pct={row.pct}
                    color={index === 0 ? COLORS.blue : COLORS.purple}
                  />
                ))}
              </div>
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title="Screen Usage Summary"
          className="xl:col-span-3"
          subtitle="Screen · Location · Bookings · Hours · Spend · Impressions · Last Used · Actions"
          onMenuAction={(action) => handleMenuAction("Screen Usage Summary", action)}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Screen", "Location", "Bookings", "Hours", "Spend", "Impressions", "Last Used", "Actions"].map((heading) => (
                    <th key={heading} className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.screen_usage.map((row, index) => (
                  <tr
                    key={row.screen}
                    className="cursor-pointer border-b border-slate-100 text-sm hover:bg-gray-50"
                    onClick={() =>
                      openModal(
                        `${row.screen} — Screen Usage Detail`,
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <div className="rounded-xl border border-slate-200 p-3">
                              <p className="text-xs text-gray-400">Bookings</p>
                              <p className="text-lg font-semibold text-gray-900">{row.bookings}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-3">
                              <p className="text-xs text-gray-400">Hours</p>
                              <p className="text-lg font-semibold text-gray-900">{row.total_hours}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-3">
                              <p className="text-xs text-gray-400">Spend</p>
                              <p className="text-lg font-semibold text-gray-900">{formatUGX(row.spend)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-3">
                              <p className="text-xs text-gray-400">Impressions</p>
                              <p className="text-lg font-semibold text-gray-900">{row.impressions.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-200 p-3 text-sm text-gray-600">
                            <p className="mb-2 font-medium text-gray-900">Booking history</p>
                            {mockBookings.slice(0, 5).map((booking) => (
                              <div key={booking.ref} className="flex items-center justify-between border-b border-slate-100 py-1.5 last:border-b-0">
                                <span>{booking.start.split(" ")[0]}</span>
                                <span>{booking.duration}</span>
                                <span>{formatUGX(booking.amount)}</span>
                              </div>
                            ))}
                          </div>
                          <LoadingButton onClick={() => router.push(`/dashboard/customer/screens/${String(index + 1)}`)}>
                            Book This Screen Again
                          </LoadingButton>
                        </div>,
                      )
                    }
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={mockScreens[index % mockScreens.length]?.image}
                          alt={row.screen}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <span>{row.screen}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">{row.location}</td>
                    <td className="px-3 py-2">{row.bookings}</td>
                    <td className="px-3 py-2">{row.total_hours}</td>
                    <td className="px-3 py-2">{formatUGX(row.spend)}</td>
                    <td className="px-3 py-2">{row.impressions.toLocaleString()}</td>
                    <td className="px-3 py-2">{row.last_used}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openModal(
                            `${row.screen} — Screen Usage Detail`,
                            <div className="text-sm text-gray-600">Detailed modal opened from action button.</div>,
                          );
                        }}
                        className="rounded-lg border border-blue-100 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    );
  };

  const renderReachTab = () => {
    const cumulativeData = reportData.cumulative_reach.map((item, index, arr) => ({
      ...item,
      perCampaign: index === 0 ? item.reach : Math.max(0, item.reach - arr[index - 1].reach),
    }));

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCardSparkline
            label="TOTAL EST. REACH"
            value={totalReach}
            trend="+8.2% from last period"
            color={COLORS.green}
            points={[10200, 10200, 51700, totalReach]}
            countKey={`${renderKey}-reach-total`}
          />
          <StatCardSparkline
            label="AVG REACH / CAMPAIGN"
            value={avgReachPerCampaign}
            trend="Across active campaigns"
            color={COLORS.blue}
            points={[5400, 6300, 12100, avgReachPerCampaign]}
            countKey={`${renderKey}-reach-avg`}
          />
          <StatCardSparkline
            label="PEAK HOUR"
            value={Number(peakHourRow.hour.replace(/\D/g, "") || 20)}
            trend={`${peakHourRow.hour} strongest slot`}
            color={COLORS.purple}
            points={[18, 19, 20, 20]}
            countKey={`${renderKey}-reach-peak`}
            suffix=":00"
          />
          <StatCardSparkline
            label="BEST LOCATION"
            value={bestScreenReach.reach}
            trend={bestScreenReach.screen}
            color={COLORS.teal}
            points={[8400, 16900, 22100, bestScreenReach.reach]}
            countKey={`${renderKey}-reach-location`}
          />
        </div>

        <div className="rounded-xl bg-blue-50 p-4">
          <div className="flex items-start gap-3 text-sm text-blue-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Reach estimates are based on verified foot traffic data from our screen locations.
              Actual reach may vary by ±15%.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            title="Cumulative Reach Over Time"
            className="xl:col-span-2"
            right={
              <div className="inline-flex rounded-full bg-gray-100 p-1">
                {(["cumulative", "per_campaign"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setReachMode(mode)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] capitalize",
                      reachMode === mode ? "bg-white font-medium text-gray-700" : "text-gray-500",
                    )}
                  >
                    {mode === "per_campaign" ? "Per Campaign" : "Cumulative"}
                  </button>
                ))}
              </div>
            }
            footerValue={totalReach.toLocaleString()}
            footerTrend="+406.4% since Jan"
            onMenuAction={(action) => handleMenuAction("Cumulative Reach Over Time", action)}
          >
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeData}>
                  <defs>
                    <linearGradient id="reach-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={COLORS.green} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                  <Tooltip
                    content={
                      <DarkTooltip
                        formatter={(value, label) =>
                          `${label} — ${Number(value).toLocaleString()} ${reachMode === "cumulative" ? "total" : "new"} reach`
                        }
                      />
                    }
                  />
                  <Area
                    dataKey={reachMode === "cumulative" ? "reach" : "perCampaign"}
                    stroke={COLORS.green}
                    fill="url(#reach-fill)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, fill: COLORS.green, stroke: "white", strokeWidth: 2 }}
                    isAnimationActive
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Reach by Screen"
            className="xl:col-span-1"
            footerValue={`Best reach: ${bestScreenReach.screen}`}
            footerTrend={`${bestScreenReach.reach.toLocaleString()} estimated people`}
            onMenuAction={(action) => handleMenuAction("Reach by Screen", action)}
          >
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.reach_by_screen} layout="vertical" margin={{ right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                  <YAxis type="category" dataKey="screen" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={104} />
                  <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${Number(value).toLocaleString()} reach`} />} />
                  <Bar
                    dataKey="reach"
                    radius={[0, 6, 6, 0]}
                    onClick={(item) =>
                      openModal(
                        `${String((item as { screen?: string })?.screen ?? "")} — Reach Detail`,
                        <div className="space-y-3 text-sm text-gray-600">
                          <p>Traffic per hour: {(item as { traffic_per_hr?: number })?.traffic_per_hr ?? 0}</p>
                          <p>Hours booked: {(item as { hours?: number })?.hours ?? 0}</p>
                        </div>,
                      )
                    }
                  >
                    {reportData.reach_by_screen.map((row, index) => (
                      <Cell key={row.screen} fill={[COLORS.blue, COLORS.purple, COLORS.green][index % 3]} />
                    ))}
                    <LabelList
                      dataKey="reach"
                      position="right"
                      formatter={(v) => `${(Number(v ?? 0) / 1000).toFixed(1)}K`}
                      style={{ fontSize: 11, fill: "#6B7280" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            title="Reach by Daypart"
            onMenuAction={(action) => handleMenuAction("Reach by Daypart", action)}
          >
            <div className="space-y-2">
              {reportData.reach_by_daypart.map((row) => (
                <ProgressBarRow
                  key={row.daypart}
                  label={row.daypart}
                  amount={row.reach.toLocaleString()}
                  pct={row.pct}
                  color={
                    row.daypart.toLowerCase().includes("prime")
                      ? COLORS.blue
                      : row.daypart.toLowerCase().includes("afternoon")
                        ? COLORS.green
                        : row.daypart.toLowerCase().includes("full")
                          ? COLORS.purple
                          : "#CBD5E1"
                  }
                />
              ))}
            </div>
            <p className="mt-3 text-[11px] font-medium text-blue-600">💡 Prime Time delivers highest CPM</p>
          </ChartCard>

          <ChartCard
            title="Ad Frequency Estimate"
            onMenuAction={(action) => handleMenuAction("Ad Frequency Estimate", action)}
          >
            <div className="space-y-3">
              <div className="relative h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="85%"
                    startAngle={90}
                    endAngle={-270}
                    data={[{ name: "frequency", value: 3.2, fill: COLORS.green }]}
                  >
                    <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "#F1F5F9" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-gray-900">3.2×</p>
                  <p className="text-[11px] text-gray-400">frequency</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Optimal range: 3–5×</p>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <div
                    key={n}
                    className={cn(
                      "flex h-5 w-6 items-center justify-center rounded text-[10px]",
                      n <= 2 && "bg-red-100 text-red-600",
                      n >= 3 && n <= 5 && "bg-green-100 text-green-700",
                      n >= 6 && "bg-amber-100 text-amber-700",
                    )}
                  >
                    {n}
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
                📈 Increasing campaign duration boosts frequency and brand recall.
              </div>
            </div>
          </ChartCard>

          <ChartCard
            title="Best Performing Times"
            onMenuAction={(action) => handleMenuAction("Best Performing Times", action)}
            footerValue="Friday"
            footerTrend="9 avg plays per hour"
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Peak Performance Hour</p>
                <p className="text-[26px] font-bold text-gray-900">8:00 PM</p>
                <p className="text-[11px] text-gray-400">{peakHourRow.plays} plays at peak</p>
                <div className="mt-2 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.plays_by_hour
                        .filter((item) => ["6PM", "7PM", "8PM", "9PM", "10PM", "11PM"].includes(item.hour))
                        .map((item) => ({ hour: item.hour, plays: item.plays }))}
                    >
                      <Bar dataKey="plays" radius={[4, 4, 0, 0]}>
                        {reportData.plays_by_hour
                          .filter((item) => ["6PM", "7PM", "8PM", "9PM", "10PM", "11PM"].includes(item.hour))
                          .map((item) => (
                            <Cell key={item.hour} fill={item.hour === "8PM" ? "#EF4444" : COLORS.blue} />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-gray-500">Best Day</p>
                <p className="text-[26px] font-bold text-gray-900">Friday</p>
                <div className="mt-2 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.plays_by_day}>
                      <Line dataKey="plays" stroke={COLORS.green} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        <HeatmapGrid
          title="Your Reach by Day & Hour"
          subtitle="Estimated audience size per time slot"
          points={reachHeatmapRows}
          scheme="green"
          onMenuAction={(action) => handleMenuAction("Your Reach by Day & Hour", action)}
          onCellClick={(point) =>
            openModal(
              `${point.day} ${point.hour} — Reach Detail`,
              <div className="space-y-2 text-sm text-gray-600">
                <p>{point.value.toLocaleString()} estimated people reached.</p>
                <p>Recommended booking window: Fri-Sat 6PM–9PM.</p>
              </div>,
            )
          }
          insights={[
            { text: "📍 Prime Time Fri-Sat = highest reach", tone: "green" },
            { text: "📈 Weekends 3-9PM = best engagement window", tone: "blue" },
            { text: "💡 Book Fridays 6-9PM for max impact", tone: "amber" },
          ]}
        />
      </div>
    );
  };

  const renderCreativesTab = () => {
    const approvedCount = creativeCards.filter((item) => item.status === "approved").length;
    const approvalRate = Math.round((approvedCount / Math.max(creativeCards.length, 1)) * 100);
    const avgQuality = Math.round(
      creativeCards.reduce((sum, row) => sum + row.quality_score, 0) / Math.max(creativeCards.length, 1),
    );

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCardSparkline
            label="TOTAL CREATIVES"
            value={creativeCards.length}
            trend="All uploaded creatives"
            color={COLORS.blue}
            points={[1, 1, 2, 2, 3, 3]}
            countKey={`${renderKey}-creative-total`}
          />
          <StatCardSparkline
            label="AVG QUALITY SCORE"
            value={avgQuality}
            trend="Across approved files"
            color={COLORS.purple}
            points={[72, 76, 81, 84, 88, avgQuality]}
            countKey={`${renderKey}-creative-quality`}
            suffix="/100"
          />
          <StatCardSparkline
            label="TOTAL PLAYS (ALL)"
            value={creativeCards.reduce((sum, row) => sum + row.plays, 0)}
            trend="+12.2% this period"
            color={COLORS.green}
            points={[120, 240, 560, 820, 1240, 3037]}
            countKey={`${renderKey}-creative-plays`}
          />
          <ChartCard
            title="Approval Rate"
            className="!p-4"
            onMenuAction={(action) => handleMenuAction("Approval Rate", action)}
            footerValue={`${approvalRate}%`}
            footerTrend={`${approvedCount} of ${creativeCards.length} approved`}
            positive={approvalRate >= 70}
          >
            <div className="relative h-[108px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="84%"
                  startAngle={90}
                  endAngle={-270}
                  data={[{ name: "approval", value: approvalRate, fill: approvalRate >= 70 ? COLORS.green : COLORS.amber }]}
                >
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "#F1F5F9" }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-900">
                {approvalRate}%
              </div>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {creativeCards.map((creative) => (
            <button
              key={creative.id}
              type="button"
              onClick={() =>
                openModal(
                  `${creative.name} — Creative Detail`,
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="relative overflow-hidden rounded-xl border border-slate-200">
                        <img src={creative.preview} alt={creative.name} className="h-44 w-full object-cover" />
                        {creative.type === "video" ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="rounded-full bg-white/70 p-2">
                              <Play className="h-5 w-5 text-gray-800" />
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3 text-sm text-gray-600">
                        <p>Type: {creative.type}</p>
                        <p>Campaign: {creative.campaign}</p>
                        <p>Screen: {creative.screen}</p>
                        <p>AI Moderation: {creative.ai_status}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="text-xs text-gray-500">Quality score</p>
                        <p className="text-2xl font-bold text-gray-900">{creative.quality_score}/100</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3 text-sm text-gray-600">
                        <p>{creative.plays.toLocaleString()} plays</p>
                        <p>{creative.impressions.toLocaleString()} impressions</p>
                        <p>{creative.revisions} revisions</p>
                      </div>
                      <LoadingButton variant="secondary">Download Creative</LoadingButton>
                    </div>
                  </div>,
                )
              }
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-[150px]">
                <img src={creative.preview} alt={creative.name} className="h-full w-full object-cover" />
                {creative.type === "video" ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-white/60 p-2">
                      <Play className="h-4 w-4 text-gray-800" />
                    </span>
                  </span>
                ) : null}
                <span
                  className={cn(
                    "absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium text-white",
                    creative.status === "approved" && "bg-green-500",
                    creative.status === "pending" && "bg-amber-500",
                    creative.status === "rejected" && "bg-red-500",
                    creative.status === "under review" && "bg-blue-500",
                  )}
                >
                  {creative.status.toUpperCase()}
                </span>
                <span
                  className={cn(
                    "absolute left-3 top-3 rounded-full px-2 py-0.5 text-xs font-semibold text-white",
                    creative.quality_score >= 81
                      ? "bg-green-500"
                      : creative.quality_score >= 61
                        ? "bg-amber-500"
                        : "bg-red-500",
                  )}
                >
                  {creative.quality_score}
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="truncate text-sm font-medium text-gray-900">{creative.name}</p>
                  <p className="text-xs text-gray-400">{creative.campaign}</p>
                  <p className="text-xs text-gray-400">📍 {creative.screen}</p>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
                  <span className="text-sm font-semibold text-blue-600">{creative.plays.toLocaleString()} plays</span>
                  <span className="text-xs text-gray-500">{creative.impressions.toLocaleString()} reach</span>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Quality</span>
                    <span>{creative.quality_score}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-500",
                        creative.quality_score >= 81
                          ? "bg-green-500"
                          : creative.quality_score >= 61
                            ? "bg-amber-500"
                            : "bg-red-500",
                      )}
                      style={{ width: `${creative.quality_score}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-gray-50 px-4 py-3 text-[11px]">
                <span className="text-gray-400">Submitted: {creative.submitted}</span>
                <span className="text-blue-600">View Details →</span>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard
            title="Quality Score Distribution"
            className="xl:col-span-2"
            footerValue={`${avgQuality}/100 avg`}
            footerTrend="Creative quality spread"
            onMenuAction={(action) => handleMenuAction("Quality Score Distribution", action)}
          >
            <div className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="plays" type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                  <YAxis dataKey="quality_score" type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <ZAxis dataKey="impressions" range={[80, 420]} />
                  <Tooltip content={<DarkTooltip formatter={(value, _, payload) => `${payload?.[0]?.name ?? "Creative"} — ${value}`} />} />
                  <ReferenceLine y={80} stroke={COLORS.green} strokeDasharray="4 4" />
                  <ReferenceLine y={60} stroke={COLORS.amber} strokeDasharray="4 4" />
                  <Scatter
                    data={creativeCards}
                    onClick={(item) =>
                      openModal(
                        `${String((item as { name?: string })?.name ?? "")} — Creative Detail`,
                        <div className="text-sm text-gray-600">Opened from bubble chart.</div>,
                      )
                    }
                  >
                    {creativeCards.map((item) => (
                      <Cell
                        key={item.id}
                        fill={
                          item.status === "approved"
                            ? COLORS.green
                            : item.status === "pending"
                              ? COLORS.amber
                              : COLORS.orange
                        }
                      />
                    ))}
                    <LabelList dataKey="name" position="center" style={{ fontSize: 10, fill: "#FFFFFF", fontWeight: 600 }} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Approval Status"
            onMenuAction={(action) => handleMenuAction("Approval Status", action)}
            footerValue={`${approvedCount} of ${creativeCards.length} approved`}
            footerTrend={`${creativeCards.reduce((sum, row) => sum + row.revisions, 0)} revisions submitted`}
          >
            <div className="space-y-3">
              <div className="relative h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Approved", value: approvedCount, color: COLORS.green },
                        { name: "Pending", value: creativeCards.filter((c) => c.status === "pending").length, color: COLORS.amber },
                        { name: "Rejected", value: creativeCards.filter((c) => c.status === "rejected").length, color: "#EF4444" },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={84}
                    >
                      {[COLORS.green, COLORS.amber, "#EF4444"].map((color) => (
                        <Cell key={color} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DarkTooltip formatter={(value, label) => `${label} — ${value}`} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-bold text-green-700">{approvalRate}%</p>
                  <p className="text-[11px] text-gray-400">approval rate</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-600" /> Approved
                  </span>
                  <span>{approvedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Pending
                  </span>
                  <span>{creativeCards.filter((row) => row.status === "pending").length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Rejected
                  </span>
                  <span>{creativeCards.filter((row) => row.status === "rejected").length}</span>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title="Creative Performance"
          className="xl:col-span-3"
          subtitle="Creative · Type · Campaign · Quality · Plays · Impressions · Revisions · Status"
          right={
            <LoadingButton variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setExportOpen(true)}>
              <Download className="h-3.5 w-3.5" />
              Export Creative Report
            </LoadingButton>
          }
          onMenuAction={(action) => handleMenuAction("Creative Performance", action)}
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {(["all", "approved", "pending", "rejected"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setCreativeFilter(filter)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium capitalize",
                  creativeFilter === filter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Creative", "Type", "Campaign", "Quality", "Plays", "Impressions", "Revisions", "Status"].map((heading) => (
                    <th key={heading} className="px-3 py-2 text-left text-[11px] font-medium uppercase text-gray-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCreatives.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-slate-100 text-sm hover:bg-gray-50"
                    onClick={() =>
                      openModal(
                        `${row.name} — Creative Detail`,
                        <div className="text-sm text-gray-600">
                          Quality score: {row.quality_score}/100 · {row.plays.toLocaleString()} plays.
                        </div>,
                      )
                    }
                  >
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2">{row.campaign}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          row.quality_score >= 81
                            ? "bg-green-50 text-green-700"
                            : row.quality_score >= 61
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700",
                        )}
                      >
                        {row.quality_score}
                      </span>
                    </td>
                    <td className="px-3 py-2">{row.plays.toLocaleString()}</td>
                    <td className="px-3 py-2">{row.impressions.toLocaleString()}</td>
                    <td className="px-3 py-2">{row.revisions}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          row.status === "approved" && "bg-green-50 text-green-700",
                          row.status === "pending" && "bg-amber-50 text-amber-700",
                          row.status === "rejected" && "bg-red-50 text-red-700",
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    );
  };

  const renderCurrentTab = () => {
    if (loading) {
      return <TabChartSkeletonGrid />;
    }

    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "spending":
        return renderSpendingTab();
      case "campaigns":
        return renderCampaignsTab();
      case "screens":
        return renderScreensTab();
      case "reach":
        return renderReachTab();
      case "creatives":
        return renderCreativesTab();
      default:
        return renderOverviewTab();
    }
  };

  const exportTabs = [
    {
      id: "summary",
      label: "Summary",
      content: (
        <div className="space-y-5">
          <div className="rounded-2xl bg-[linear-gradient(135deg,#1e40af,#2563EB)] p-6 text-white">
            <p className="text-2xl font-semibold">Advertising Report</p>
            <p className="mt-2 text-sm text-blue-100">Customer portal report · Generated {new Date().toLocaleDateString("en-GB")}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-gray-500">Total Spend</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatUGX(reportData.summary.total_spend)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-gray-500">Estimated Impressions</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{reportData.summary.total_impressions.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-gray-500">Campaigns</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{reportData.summary.campaigns_run}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-gray-500">Airtime Hours</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{reportData.summary.total_airtime_hours}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "spending",
      label: "Spending",
      content: (
        <div className="space-y-4">
          <div className="h-72 rounded-xl border border-slate-200 bg-white p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySpendRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} tickFormatter={formatYAxis} />
                <Bar dataKey="spend" fill={COLORS.blue} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 text-sm text-gray-600">
            <p>Top screen spend: {spendByScreenRows[0]?.screen} · {formatUGX(spendByScreenRows[0]?.spend ?? 0)}</p>
          </div>
        </div>
      ),
    },
    {
      id: "campaigns",
      label: "Campaigns",
      content: (
        <div className="space-y-3">
          {campaignHistory.map((row) => (
            <div key={row.id} className="rounded-xl border border-slate-200 p-3 text-sm text-gray-600">
              <p className="font-medium text-gray-900">{row.campaign}</p>
              <p>{row.screen} · {row.plays.toLocaleString()} plays · {row.impressions.toLocaleString()} impressions</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "reach",
      label: "Reach",
      content: (
        <div className="space-y-3">
          {reportData.reach_by_screen.map((row) => (
            <div key={row.screen} className="rounded-xl border border-slate-200 p-3 text-sm text-gray-600">
              <p className="font-medium text-gray-900">{row.screen}</p>
              <p>{row.reach.toLocaleString()} estimated people reached</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "invoices",
      label: "Invoices",
      content: (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Invoice", "Customer", "Amount", "Status"].map((heading) => (
                  <th key={heading} className="px-3 py-2 text-left text-[11px] uppercase text-gray-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-slate-100 text-sm">
                  <td className="px-3 py-2">{invoice.number}</td>
                  <td className="px-3 py-2">{invoice.customer}</td>
                  <td className="px-3 py-2">{formatUGX(invoice.total)}</td>
                  <td className="px-3 py-2">{String(invoice.status).toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6">
      <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-gray-900">Reports & Analytics</h1>
            <p className="text-[13px] text-gray-400">Your advertising performance overview</p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-wrap gap-2 rounded-full bg-white p-1 shadow-sm">
              {periodOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setPeriod(option.key)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm transition",
                    period === option.key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <LoadingButton onClick={() => setExportOpen(true)}>
              <Upload className="h-4 w-4" />
              Export Report
            </LoadingButton>
          </div>
        </div>

        <div className="border-b border-gray-100 pb-3">
          <div className="flex flex-row gap-2 overflow-x-auto">
            {tabOptions.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  "shrink-0 whitespace-nowrap px-3 pb-3 pt-1 text-sm transition-colors",
                  activeTab === tab.key
                    ? "border-b-2 border-blue-600 font-medium text-blue-600"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-in fade-in duration-150">{renderCurrentTab()}</div>
      </div>

      <DetailModal
        open={detail.open}
        title={detail.title}
        onClose={closeModal}
        size={detail.size}
        footer={
          <>
            <LoadingButton variant="secondary" onClick={closeModal}>
              Cancel
            </LoadingButton>
            <LoadingButton onClick={closeModal}>
              Done
            </LoadingButton>
          </>
        }
      >
        {detail.body}
      </DetailModal>

      <ExportPreviewModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Customer Reports Export"
        reportDate={new Date().toLocaleDateString("en-GB")}
        periodLabel={periodOptions.find((item) => item.key === period)?.label}
        tabs={exportTabs}
      />

      <div className="sr-only" aria-live="polite">
        {statsCalcText}
      </div>
    </div>
  );
}
