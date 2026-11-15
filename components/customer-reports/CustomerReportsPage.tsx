"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart2, Download, ExternalLink, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { mockInvoices, mockReportData } from "@/lib/mockData";
import { cn } from "@/lib/cn";
import { formatUGX } from "@/lib/ugx";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { ExportPreviewModal } from "@/components/reports";
import { ChartSkeleton, PageSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { useToast } from "@/components/ui/Toast";
import { ChartFullscreenModal } from "@/components/customer-reports/shared";
import { OverviewTab } from "@/components/customer-reports/OverviewTab";
import { SpendingTab } from "@/components/customer-reports/SpendingTab";
import { CampaignsTab } from "@/components/customer-reports/CampaignsTab";
import { ScreensTab } from "@/components/customer-reports/ScreensTab";
import { ReachTab } from "@/components/customer-reports/ReachTab";
import { CreativesTab } from "@/components/customer-reports/CreativesTab";
import type { ChartMenuAction, ReportPeriod, ReportTab } from "@/components/customer-reports/types";

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

function getPeriodMultiplier(period: ReportPeriod) {
  if (period === "this_month") return 0.42;
  if (period === "last_3_months") return 0.83;
  if (period === "this_year") return 1;
  return 1.22;
}

function usePeriodData(period: ReportPeriod) {
  return React.useMemo(() => {
    const clone = structuredClone(mockReportData);
    const multiplier = getPeriodMultiplier(period);
    const scale = (value: number) => Math.round(value * multiplier);

    clone.summary.total_spend = scale(clone.summary.total_spend);
    clone.summary.total_impressions = scale(clone.summary.total_impressions);
    clone.summary.total_airtime_hours = Math.max(1, scale(clone.summary.total_airtime_hours));
    clone.summary.avg_campaign_value = Math.max(1, scale(clone.summary.avg_campaign_value));
    clone.summary.outstanding_balance = Math.max(0, scale(clone.summary.outstanding_balance));

    clone.monthly_spend = clone.monthly_spend.map((row) => ({
      ...row,
      spend: scale(row.spend),
      campaigns: Math.max(0, Math.round(row.campaigns * Math.max(multiplier, 0.5))),
    }));
    clone.spend_by_screen = clone.spend_by_screen.map((row) => ({ ...row, spend: scale(row.spend) }));
    clone.spend_by_time_slot = clone.spend_by_time_slot.map((row) => ({ ...row, spend: scale(row.spend) }));
    clone.payment_methods = clone.payment_methods.map((row) => ({ ...row, amount: scale(row.amount) }));
    clone.vat_paid_total = scale(clone.vat_paid_total);
    clone.plays_by_hour = clone.plays_by_hour.map((row) => ({ ...row, plays: Math.round(row.plays * multiplier) }));
    clone.plays_by_day = clone.plays_by_day.map((row) => ({ ...row, plays: Math.round(row.plays * multiplier) }));
    clone.impressions_by_campaign = clone.impressions_by_campaign.map((row) => ({
      ...row,
      plays: Math.round(row.plays * multiplier),
      impressions_low: scale(row.impressions_low),
      impressions_high: scale(row.impressions_high),
    }));
    clone.screen_usage = clone.screen_usage.map((row) => ({
      ...row,
      spend: scale(row.spend),
      impressions: scale(row.impressions),
    }));
    clone.location_breakdown = clone.location_breakdown.map((row) => ({
      ...row,
      spend: scale(row.spend),
      impressions: scale(row.impressions),
    }));
    clone.cumulative_reach = clone.cumulative_reach.map((row) => ({ ...row, reach: scale(row.reach) }));
    clone.reach_by_screen = clone.reach_by_screen.map((row) => ({ ...row, reach: scale(row.reach) }));
    clone.reach_by_daypart = clone.reach_by_daypart.map((row) => ({ ...row, reach: scale(row.reach) }));
    clone.creatives = clone.creatives.map((row) => ({
      ...row,
      plays: Math.round(row.plays * multiplier),
      impressions: scale(row.impressions),
    }));

    return clone;
  }, [period]);
}

function ReportTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <ChartSkeleton key={`stat-skeleton-${index}`} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}

export function CustomerReportsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [initialLoading, setInitialLoading] = React.useState(true);
  const [tabLoading, setTabLoading] = React.useState(false);
  const [periodLoading, setPeriodLoading] = React.useState(false);

  const [period, setPeriod] = React.useState<ReportPeriod>("this_month");
  const [tab, setTab] = React.useState<ReportTab>("overview");
  const data = usePeriodData(period);

  const [exportOpen, setExportOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailTitle, setDetailTitle] = React.useState("");
  const [detailBody, setDetailBody] = React.useState<React.ReactNode>(null);
  const [chartModalOpen, setChartModalOpen] = React.useState(false);
  const [chartModalTitle, setChartModalTitle] = React.useState("");
  const [chartModalContent, setChartModalContent] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setInitialLoading(false), 320);
    return () => window.clearTimeout(timer);
  }, []);

  const periodLabel = periodOptions.find((item) => item.key === period)?.label ?? "This Month";
  const noData = data.monthly_spend.every((row) => row.spend === 0);

  const changeTab = (next: ReportTab) => {
    if (tab === next) return;
    setTabLoading(true);
    window.setTimeout(() => {
      setTab(next);
      setTabLoading(false);
    }, 200);
  };

  const changePeriod = (next: ReportPeriod) => {
    if (period === next) return;
    setPeriodLoading(true);
    window.setTimeout(() => {
      setPeriod(next);
      setPeriodLoading(false);
    }, 300);
  };

  const openDetail = (title: string, body: React.ReactNode) => {
    setDetailTitle(title);
    setDetailBody(body);
    setDetailOpen(true);
  };

  const handleChartMenuAction = (title: string, action: ChartMenuAction, chart: React.ReactNode) => {
    if (action === "view_larger") {
      setChartModalTitle(title);
      setChartModalContent(chart);
      setChartModalOpen(true);
      return;
    }
    if (action === "add_to_report") {
      showToast({ type: "success", title: "Added to report", message: `${title} has been added to your export.` });
      return;
    }
    if (action === "download_png") {
      showToast({ type: "success", title: "PNG downloaded", message: `${title} chart downloaded.` });
      return;
    }
    showToast({ type: "success", title: "Chart exported", message: `${title} export preview is ready.` });
  };

  if (initialLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports &amp; Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Your advertising performance and spend overview</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex w-full flex-wrap gap-2 rounded-full bg-gray-100 p-1 sm:w-auto">
            {periodOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => changePeriod(item.key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  period === item.key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-200",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <LoadingButton onClick={() => setExportOpen(true)}>
            <BarChart2 className="h-4 w-4" />
            Export Full Report
          </LoadingButton>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabOptions.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => changeTab(item.key)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === item.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <LoadingButton variant="secondary" onClick={() => setExportOpen(true)}>
          <Download className="h-4 w-4" />
          Export Tab Report
        </LoadingButton>
      </div>

      {tabLoading || periodLoading ? (
        <ReportTabSkeleton />
      ) : noData ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <h3 className="text-lg font-semibold text-gray-900">No data for this period</h3>
          <p className="mt-2 text-sm text-gray-500">Switch period or launch a new campaign to start seeing analytics.</p>
          <LoadingButton className="mt-4" onClick={() => router.push("/dashboard/customer/screens")}>
            Book a Campaign →
          </LoadingButton>
        </div>
      ) : (
        <>
          {tab === "overview" ? (
            <OverviewTab data={data} onRequestDetail={openDetail} onChartMenuAction={handleChartMenuAction} onNavigateToStatus={(status) => router.push(`/dashboard/customer/campaigns?filter=${status.toLowerCase()}`)} />
          ) : null}
          {tab === "spending" ? (
            <SpendingTab data={data} onRequestDetail={openDetail} onOpenExport={() => setExportOpen(true)} onChartMenuAction={handleChartMenuAction} />
          ) : null}
          {tab === "campaigns" ? (
            <CampaignsTab data={data} onRequestDetail={openDetail} onOpenExport={() => setExportOpen(true)} onChartMenuAction={handleChartMenuAction} onNavigateToCampaign={(id) => router.push(`/dashboard/customer/campaigns/${id}`)} onNavigateToFilteredCampaigns={(status) => router.push(`/dashboard/customer/campaigns?filter=${status.toLowerCase()}`)} />
          ) : null}
          {tab === "screens" ? (
            <ScreensTab data={data} onRequestDetail={openDetail} onChartMenuAction={handleChartMenuAction} />
          ) : null}
          {tab === "reach" ? (
            <ReachTab data={data} onRequestDetail={openDetail} onChartMenuAction={handleChartMenuAction} />
          ) : null}
          {tab === "creatives" ? (
            <CreativesTab data={data} onRequestDetail={openDetail} onOpenExport={() => setExportOpen(true)} onChartMenuAction={handleChartMenuAction} />
          ) : null}
        </>
      )}

      <ExportPreviewModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Advertising Report"
        reportDate="22/04/2026"
        periodLabel={periodLabel}
        tabs={[
          { id: "summary", label: "Summary", content: <SummaryExport data={data} /> },
          { id: "spending", label: "Spending", content: <SpendingExport data={data} /> },
          { id: "campaigns", label: "Campaigns", content: <CampaignsExport data={data} /> },
          { id: "reach", label: "Reach", content: <ReachExport data={data} /> },
          { id: "invoices", label: "Invoices", content: <InvoicesExport /> },
        ]}
      />

      <ChartFullscreenModal open={chartModalOpen} title={chartModalTitle} onClose={() => setChartModalOpen(false)}>
        {chartModalContent}
      </ChartFullscreenModal>

      <AnimatePresence>
        {detailOpen ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[65] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
            <button type="button" className="absolute inset-0" onClick={() => setDetailOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
                <h3 className="text-base font-semibold text-gray-900">{detailTitle}</h3>
                <button type="button" onClick={() => setDetailOpen(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-50">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">{detailBody}</div>
              <div className="sticky bottom-0 flex justify-between border-t border-gray-100 bg-white px-6 py-4">
                <button type="button" onClick={() => setDetailOpen(false)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Close</button>
                <button type="button" onClick={() => setDetailOpen(false)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">
                  Open Full Page
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SummaryExport({ data }: { data: ReturnType<typeof usePeriodData> }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-gray-900">Executive Summary</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <SummaryMetric label="Total Spend" value={formatUGX(data.summary.total_spend)} />
        <SummaryMetric label="Impressions" value={data.summary.total_impressions.toLocaleString("en-US")} />
        <SummaryMetric label="Campaigns" value={data.summary.campaigns_run.toString()} />
        <SummaryMetric label="Airtime" value={`${data.summary.total_airtime_hours} hrs`} />
      </div>
    </div>
  );
}

function SpendingExport({ data }: { data: ReturnType<typeof usePeriodData> }) {
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-gray-900">Spending Overview</h3>
      {data.spend_by_screen.map((row) => (
        <div key={row.screen} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <span>{row.screen}</span>
          <span className="font-semibold">{formatUGX(row.spend)}</span>
        </div>
      ))}
    </div>
  );
}

function CampaignsExport({ data }: { data: ReturnType<typeof usePeriodData> }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">Campaign Performance</h3>
      <div className="space-y-2">
        {data.impressions_by_campaign.map((row) => (
          <div key={row.campaign} className="rounded-lg border border-gray-100 p-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">{row.campaign}</p>
            <p>{row.screen}</p>
            <p>Plays: {row.plays.toLocaleString("en-US")} • Reach: {Math.round((row.impressions_low + row.impressions_high) / 2).toLocaleString("en-US")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReachExport({ data }: { data: ReturnType<typeof usePeriodData> }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">Reach Summary</h3>
      {data.reach_by_screen.map((row) => (
        <div key={row.screen} className="flex items-center justify-between border-b border-gray-100 py-2 text-sm text-gray-700 last:border-b-0">
          <span>{row.screen}</span>
          <span className="font-semibold">{row.reach.toLocaleString("en-US")}</span>
        </div>
      ))}
    </div>
  );
}

function InvoicesExport() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">Invoice Summary</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {["Invoice", "Customer", "Total", "Status", "Due Date"].map((header) => (
                <th key={header} className="px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-400">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-3 py-2 text-sm text-gray-700">{invoice.number}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{invoice.customer}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{formatUGX(invoice.total)}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{invoice.status}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{invoice.due_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
      {label}: <span className="font-semibold">{value}</span>
    </div>
  );
}
