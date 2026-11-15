"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpToLine,
  Download,
  FileSpreadsheet,
  Printer,
  X,
} from "lucide-react";

import { InvoiceDocument, type InvoiceDocumentProps } from "@/components/invoices";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatUGX } from "@/lib/ugx";
import { useToast } from "@/components/ui/Toast";
import {
  CampaignEstimatedImpressionsChart,
  CampaignPlaysByHourChart,
} from "@/components/reports/CampaignAnalyticsCharts";

type ExportPreviewTab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type CampaignReportData = {
  customerName: string;
  screen: string;
  dateRange: string;
  bookingReference: string;
  quickStats: Array<{
    label: string;
    value: string;
    trend: string;
    tone?: "blue" | "green" | "amber";
    points?: number[];
  }>;
  playsByHour: Array<{ label: string; plays: number }>;
  estimatedImpressions: Array<{ label: string; impressions: number }>;
  playbackRows: Array<{
    date: string;
    hour: string;
    plays: number;
    impressions: string;
    screenStatus: string;
  }>;
};

type FinancialReportData = {
  summaryCards: Array<{
    label: string;
    value: string;
    trend: string;
    tone?: "blue" | "green" | "amber";
    points?: number[];
  }>;
  barTitle: string;
  barData: Array<{ label: string; value: number }>;
  donutTitle: string;
  donutData: Array<{ name: string; value: number; color: string }>;
  tableHeaders: string[];
  tableRows: Array<Record<string, string | number>>;
};

type ExportPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  reportDate: string;
  periodLabel?: string;
  exportFormat?: "pdf" | "excel";
  tabs?: ExportPreviewTab[];
  invoiceDocument?: InvoiceDocumentProps;
  documentTabLabel?: string;
  campaignReport?: CampaignReportData;
  financialReport?: FinancialReportData;
};

function Sparkline({
  points = [18, 26, 21, 34, 28, 40],
  stroke = "#2563EB",
}: {
  points?: number[];
  stroke?: string;
}) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const width = 68;
  const height = 28;
  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / Math.max(max - min || 1, 1)) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-[68px]">
      <path d={path} fill="none" stroke={stroke} strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

function DarkTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  formatter?: (value: number, label?: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-full bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg">
      {formatter ? formatter(value, label) : `${label} ${value}`}
    </div>
  );
}

function PreviewStatCard({
  label,
  value,
  trend,
  tone = "blue",
  points,
}: {
  label: string;
  value: string;
  trend: string;
  tone?: "blue" | "green" | "amber";
  points?: number[];
}) {
  const color = tone === "green" ? "#10B981" : tone === "amber" ? "#F59E0B" : "#2563EB";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[12px] font-medium uppercase tracking-[0.05em] text-gray-400">{label}</div>
        <Sparkline points={points} stroke={color} />
      </div>
      <div className="mt-4 text-[28px] font-bold text-gray-900">{value}</div>
      <div className={cn("mt-3 flex items-center gap-2 text-xs font-medium", tone === "amber" ? "text-amber-600" : tone === "green" ? "text-green-600" : "text-blue-600")}>
        <span className="h-2 w-2 rounded-full bg-current" />
        <span>{trend}</span>
      </div>
    </div>
  );
}

function CampaignReportPreview({ report, invoiceDocument }: { report: CampaignReportData; invoiceDocument?: InvoiceDocumentProps }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[linear-gradient(135deg,#1e40af,#2563EB)] p-6 text-white">
        <div className="text-xl font-semibold">Campaign Report</div>
        <div className="mt-2 text-sm text-blue-100">
          {report.customerName} | {report.screen}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-blue-100">
          <span>{report.dateRange}</span>
          <span>{report.bookingReference}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {report.quickStats.map((item) => (
          <PreviewStatCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CampaignPlaysByHourChart data={report.playsByHour} trendText="+12.6% vs prior slot" />
        <CampaignEstimatedImpressionsChart data={report.estimatedImpressions} trendText="Range 8.4K-12K" />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4 text-sm font-semibold text-gray-900">Campaign Activity</div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {["Date", "Hour", "Plays", "Est. Impressions", "Screen Status"].map((header) => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.playbackRows.map((row, index) => (
              <tr key={`${row.date}-${row.hour}-${index}`} className="border-b border-slate-100 last:border-b-0">
                <td className="px-6 py-4 text-sm text-gray-700">{row.date}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{row.hour}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{row.plays}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{row.impressions}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{row.screenStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoiceDocument ? <InvoiceDocument {...invoiceDocument} /> : null}
    </div>
  );
}

function FinancialReportPreview({ report }: { report: FinancialReportData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {report.summaryCards.map((item) => (
          <PreviewStatCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-gray-900">{report.barTitle}</div>
            <button type="button" className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-50">
              ...
            </button>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.barData}>
                <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="4 4" />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<DarkTooltip formatter={(value, currentLabel) => `${currentLabel} ${formatUGX(value)}`} />} />
                <Bar dataKey="value" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-gray-900">{report.donutTitle}</div>
            <button type="button" className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-50">
              ...
            </button>
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_180px]">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={report.donutData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={92} paddingAngle={3}>
                    {report.donutData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip formatter={(value, currentLabel) => `${currentLabel} ${value}%`} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {report.donutData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {report.tableHeaders.map((header) => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.tableRows.map((row, index) => (
              <tr key={index} className="border-b border-slate-100 last:border-b-0">
                {report.tableHeaders.map((header) => (
                  <td key={header} className="px-6 py-4 text-sm text-gray-700">
                    {String(row[header] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ExportPreviewModal({
  open,
  onClose,
  title,
  reportDate,
  periodLabel,
  exportFormat = "pdf",
  tabs,
  invoiceDocument,
  documentTabLabel,
  campaignReport,
  financialReport,
}: ExportPreviewModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = React.useState<string>("");
  const [exporting, setExporting] = React.useState(false);

  const computedTabs = React.useMemo<ExportPreviewTab[]>(() => {
    if (tabs?.length) return tabs;

    if (campaignReport) {
      return [
        {
          id: "summary",
          label: "Campaign Summary",
          content: <CampaignReportPreview report={campaignReport} invoiceDocument={undefined} />,
        },
        ...(invoiceDocument
          ? [
              {
                id: "invoice",
                label: "Invoice",
                content: <InvoiceDocument {...invoiceDocument} />,
              },
            ]
          : []),
      ];
    }

    if (financialReport) {
      return [
        { id: "revenue", label: "Revenue Summary", content: <FinancialReportPreview report={financialReport} /> },
        { id: "payments", label: "Payment Breakdown", content: <FinancialReportPreview report={financialReport} /> },
        { id: "vat", label: "VAT", content: <FinancialReportPreview report={financialReport} /> },
      ];
    }

    if (invoiceDocument) {
      return [
        {
          id: "document",
          label:
            documentTabLabel ??
            ((invoiceDocument.isQuotation || invoiceDocument.documentTitle === "QUOTATION")
              ? "Quotation"
              : "Invoice"),
          content: <InvoiceDocument {...invoiceDocument} />,
        },
      ];
    }

    return [];
  }, [campaignReport, documentTabLabel, financialReport, invoiceDocument, tabs]);

  React.useEffect(() => {
    if (!computedTabs.length) return;
    setActiveTab((current) => (computedTabs.some((tab) => tab.id === current) ? current : computedTabs[0].id));
  }, [computedTabs]);

  const activeContent = computedTabs.find((tab) => tab.id === activeTab)?.content;
  const fileLabel = exportFormat === "excel" ? "Download Excel" : "Download PDF";
  const ExportIcon = exportFormat === "excel" ? FileSpreadsheet : Download;

  async function handleExport() {
    setExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showToast({
        type: "success",
        title: exportFormat === "excel" ? "Excel exported successfully" : "PDF downloaded successfully",
        message: `${title} is ready.`,
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm"
        >
          <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close export preview" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-20 bg-white">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <div className="text-lg font-semibold text-gray-900">{title}</div>
                <div className="mt-1 text-sm text-gray-500">
                  {reportDate}
                  {periodLabel ? ` | ${periodLabel}` : ""}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleExport} loading={exporting}>
                  <ArrowUpToLine className="h-4 w-4" />
                  Export
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    showToast({ type: "info", title: "Print dialog opened", message: "Choose your printer or save as PDF." });
                  }}
                  className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                  aria-label="Print"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {computedTabs.length > 1 ? (
              <div className="flex flex-wrap gap-2 border-b border-gray-100 px-6 py-4">
                {computedTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      activeTab === tab.id ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : null}
            </div>

            <div className="flex-1 bg-slate-50 px-6 py-6">
              <div className="max-h-[70vh] overflow-y-auto pr-1 scroll-smooth">{activeContent}</div>
            </div>

            <div className="sticky bottom-0 z-20 flex items-center justify-between gap-3 border-t border-gray-100 bg-white px-6 py-4">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleExport} loading={exporting}>
                <ExportIcon className="h-4 w-4" />
                {exporting ? `Generating ${exportFormat.toUpperCase()}...` : fileLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
