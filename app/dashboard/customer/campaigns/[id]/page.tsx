"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, FileText, UploadCloud } from "lucide-react";
import { eachDayOfInterval, isValid, parse } from "date-fns";

import { mockAdQueue, mockBookings, mockInvoices, mockScreens } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";
import { BackButton } from "@/components/ui/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { QualityReport } from "@/components/customer/QualityReport";
import { StatCardSparkline } from "@/components/ui/StatCardSparkline";
import { ChartSkeleton } from "@/components/ui/skeletons";
import { BookingCalendar } from "@/components/ui/BookingCalendar";
import {
  buildInvoiceDocumentProps,
  InvoiceDocument,
  type InvoiceDocumentProps,
} from "@/components/invoices";
import { ExportPreviewModal } from "@/components/reports";
import {
  CampaignEstimatedImpressionsChart,
  CampaignPlaysByHourChart,
} from "@/components/reports/CampaignAnalyticsCharts";
import { cn } from "@/lib/cn";

type Tab = "overview" | "creative" | "analytics" | "invoice";

type Campaign = (typeof mockBookings)[number] & {
  _local?: boolean;
  campaign_status: string;
  payment_status: string;
  ad_type?: string;
  duration?: string;
};

type Invoice =
  | (typeof mockInvoices)[number]
  | {
      id: string;
      number: string;
      customer: string;
      company: string;
      booking_ref: string;
      screen: string;
      subtotal: number;
      vat: number;
      total: number;
      status: string;
      due_date: string;
      paid_at?: string;
      method?: string;
      reference?: string;
    };

function parseTimeSlot(duration?: string) {
  if (!duration) return "6:00 PM - 9:00 PM";
  if (duration.includes("-")) return duration;
  if (duration.includes("hour")) return "6:00 PM - 9:00 PM";
  return duration;
}

function parseCampaignDate(value?: string) {
  if (!value) return null;
  const clean = value.split(" ")[0];
  const parsed = parse(clean, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? parsed : null;
}

function getPipelineSteps(campaign: Campaign) {
  const current =
    campaign.campaign_status === "completed"
      ? 4
      : campaign.campaign_status === "live"
        ? 3
        : campaign.ad_type !== "pending_upload"
          ? 2
          : campaign.payment_status === "paid"
            ? 1
            : 0;

  return [
    { label: "Booked", done: current >= 0, active: current === 0 },
    { label: "Paid", done: current >= 1, active: current === 1 },
    { label: "Creative", done: current >= 2, active: current === 2 },
    { label: "Scheduled", done: current >= 3, active: current === 3 },
    { label: "Live", done: current >= 4, active: current === 4 },
  ];
}

export default function CustomerCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [tab, setTab] = React.useState<Tab>("overview");
  const [campaign, setCampaign] = React.useState<Campaign | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [reportModalOpen, setReportModalOpen] = React.useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = React.useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = React.useState(false);

  React.useEffect(() => {
    const fromMock = mockBookings.find((booking) => booking.id === params.id);
    if (fromMock) {
      setCampaign(fromMock as Campaign);
      return;
    }
    const raw = window.localStorage.getItem(`afrah_booking_${params.id}`);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        screenId: string;
        ref: string;
        date: string;
        start: string;
        end: string;
        total: number;
        status: string;
      };
      const screen = mockScreens.find((item) => item.id === parsed.screenId);
      if (!screen) return;
      setCampaign({
        id: parsed.screenId,
        ref: parsed.ref,
        customer_id: "cust-003",
        customer_name: "Sarah Nakato",
        company: "Personal",
        customer_photo: "https://picsum.photos/seed/cust3/100/100",
        screen: screen.name,
        screen_image: screen.image,
        start: parsed.date,
        end: parsed.date,
        duration: `${parsed.start}-${parsed.end}`,
        amount: Math.round(parsed.total),
        payment_status: parsed.status === "paid" ? "paid" : "pending",
        campaign_status: parsed.status === "paid" ? "scheduled" : "pending",
        ad_type: "pending_upload",
        _local: true,
      } as Campaign);
    } catch {
      // ignore malformed local booking
    }
  }, [params.id]);

  const invoice = React.useMemo<Invoice | null>(() => {
    if (!campaign) return null;
    const inv = mockInvoices.find((item) => item.booking_ref === campaign.ref);
    if (inv) return inv;
    const vat = Math.round(campaign.amount * (18 / 118));
    const subtotal = campaign.amount - vat;
    return {
      id: "inv-local",
      number: `INV-${new Date().getFullYear()}-0001`,
      customer: campaign.customer_name,
      company: campaign.company,
      booking_ref: campaign.ref,
      screen: campaign.screen,
      subtotal,
      vat,
      total: campaign.amount,
      status: campaign.payment_status === "paid" ? "paid" : "unpaid",
      due_date: campaign.start.split(" ")[0],
      paid_at: campaign.payment_status === "paid" ? campaign.start.split(" ")[0] : undefined,
      method: campaign.payment_status === "paid" ? "MTN MoMo" : undefined,
      reference: campaign.payment_status === "paid" ? "MTN-8847291" : undefined,
    };
  }, [campaign]);

  const invoiceDocument = React.useMemo<InvoiceDocumentProps | null>(() => {
    if (!invoice) return null;
    return buildInvoiceDocumentProps({
      number: invoice.number,
      customer: invoice.customer,
      company: invoice.company,
      booking_ref: invoice.booking_ref,
      screen: invoice.screen,
      subtotal: invoice.subtotal,
      vat: invoice.vat,
      total: invoice.total,
      status: invoice.status,
      due_date: invoice.due_date,
      paid_at: invoice.paid_at,
      method: invoice.method,
      reference: invoice.reference,
    });
  }, [invoice]);

  const screenMeta = React.useMemo(
    () => mockScreens.find((item) => item.name === campaign?.screen) ?? null,
    [campaign?.screen],
  );

  const hourStats = React.useMemo(
    () => [
      { label: "6:00 PM", plays: 42 },
      { label: "7:00 PM", plays: 52 },
      { label: "8:00 PM", plays: 53 },
    ],
    [],
  );

  const impressionSeries = React.useMemo(
    () => [
      { label: "6:00 PM", impressions: 2800 },
      { label: "7:00 PM", impressions: 3900 },
      { label: "8:00 PM", impressions: 4200 },
    ],
    [],
  );

  const campaignReportData = React.useMemo(() => {
    if (!campaign) return null;
    return {
      customerName: campaign.customer_name,
      screen: campaign.screen,
      dateRange: `${campaign.start.split(" ")[0]} - ${campaign.end.split(" ")[0]}`,
      bookingReference: campaign.ref,
      quickStats: [
        { label: "Total Plays", value: "147", trend: "+8% today", tone: "blue" as const, points: [28, 31, 34, 30, 39, 42] },
        { label: "Est. Impressions", value: "8,400-12,000", trend: "+11% this week", tone: "green" as const, points: [22, 24, 26, 30, 34, 38] },
        { label: "Duration", value: campaign.duration, trend: "Prime slot", tone: "amber" as const, points: [18, 20, 21, 21, 22, 23] },
        { label: "Amount Spent", value: formatUGX(campaign.amount), trend: "Paid", tone: "blue" as const, points: [12, 14, 17, 21, 24, 28] },
      ],
      playsByHour: hourStats,
      estimatedImpressions: impressionSeries,
      playbackRows: hourStats.map((item) => ({
        date: campaign.start.split(" ")[0],
        hour: item.label,
        plays: item.plays,
        impressions: `${Math.round(item.plays * 80)}-${Math.round(item.plays * 110)}`,
        screenStatus: campaign.campaign_status === "completed" ? "Completed" : "Live",
      })),
    };
  }, [campaign, hourStats]);

  const quality = React.useMemo(() => {
    const q = mockAdQueue[0];
    return {
      score: q.quality_score,
      items: (q.quality_report ?? []).map((entry) => ({
        check: entry.check,
        status: (entry.status === "good" ? "good" : "warning") as "good" | "warning",
        note: entry.note,
      })),
      preview: q.preview,
    };
  }, []);

  if (!campaign || !invoice || !invoiceDocument) {
    return (
      <Card>
        <div className="text-[18px] font-semibold text-gray-800">Loading campaign...</div>
        <div className="mt-2 text-sm text-gray-600">Getting your campaign details.</div>
      </Card>
    );
  }

  const basePrice = Math.round(campaign.amount * 0.78);
  const locationMultiplier = Math.round(campaign.amount * 0.08);
  const daypartMultiplier = Math.round(campaign.amount * 0.06);
  const durationDiscount = Math.round(campaign.amount * 0.04);
  const paymentDate = invoice.paid_at ?? campaign.start.split(" ")[0];
  const isLive = campaign.campaign_status === "live" || campaign.campaign_status === "completed";
  const pipeline = getPipelineSteps(campaign);
  const totalPlays = hourStats.reduce((sum, item) => sum + item.plays, 0);
  const totalImpressions = impressionSeries.reduce((sum, item) => sum + item.impressions, 0);
  const campaignStartDate = parseCampaignDate(campaign.start);
  const campaignEndDate = parseCampaignDate(campaign.end);
  const campaignBookedDates = (() => {
    if (!campaignStartDate) return [] as Date[];
    if (!campaignEndDate) return [campaignStartDate];
    if (campaignEndDate.getTime() < campaignStartDate.getTime()) return [campaignStartDate];
    return eachDayOfInterval({ start: campaignStartDate, end: campaignEndDate });
  })();
  const campaignActiveDates =
    campaign.campaign_status === "live" || campaign.campaign_status === "completed" ? campaignBookedDates : [];

  return (
    <div className="space-y-6">
      <PageHeader
        backButton={<BackButton />}
        title="Campaign Detail"
        subtitle="Overview, ad creative, analytics, and invoice."
        actions={
          <Link href={`/dashboard/customer/campaigns/${params.id}/upload`}>
            <Button>
              <UploadCloud className="h-4 w-4" />
              Upload Creative
            </Button>
          </Link>
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="relative aspect-[16/6] bg-gray-100">
          <Image src={campaign.screen_image} alt={campaign.screen} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info" className="font-mono">
                {campaign.ref}
              </Badge>
              <Badge
                variant={
                  campaign.campaign_status === "live"
                    ? "success"
                    : campaign.campaign_status === "scheduled"
                      ? "info"
                      : campaign.campaign_status === "completed"
                        ? "neutral"
                        : campaign.campaign_status === "rejected"
                          ? "error"
                          : "warning"
                }
                dot
                className="bg-white/90"
              >
                {String(campaign.campaign_status).toUpperCase()}
              </Badge>
            </div>
            <div className="mt-3 text-2xl font-semibold text-white">{campaign.screen}</div>
            <div className="mt-1 text-sm text-slate-200">
              {campaign.start.split(" ")[0]} - {campaign.end.split(" ")[0]} - {formatUGX(campaign.amount)}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "overview", label: "Overview" },
            { key: "creative", label: "Ad Creative" },
            { key: "analytics", label: "Analytics" },
            { key: "invoice", label: "Invoice" },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={
              tab === item.key
                ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                : "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="text-base font-semibold text-gray-900">Booking Details</div>
                <Badge
                  variant={
                    campaign.campaign_status === "live"
                      ? "success"
                      : campaign.campaign_status === "completed"
                        ? "neutral"
                        : campaign.campaign_status === "scheduled"
                          ? "info"
                          : "warning"
                  }
                >
                  {String(campaign.campaign_status).toUpperCase()}
                </Badge>
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {[
                  { label: "Screen Name", value: campaign.screen },
                  { label: "Location", value: screenMeta?.location ?? "Kampala Road, CBD" },
                  { label: "Campaign Date", value: campaign.start.split(" ")[0] },
                  { label: "Time Slot", value: parseTimeSlot(campaign.duration) },
                  { label: "Duration", value: campaign.duration },
                  {
                    label: "Booking Ref",
                    value: <span className="font-mono text-blue-600">{campaign.ref}</span>,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-3">
                    <div className="text-[12px] font-medium uppercase tracking-[0.05em] text-gray-400">{row.label}</div>
                    <div className="text-sm font-medium text-gray-700">{row.value}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-base font-semibold text-gray-900">Payment Summary</div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-700">
                  <span>Base Price</span>
                  <span>{formatUGX(basePrice)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>Location Multiplier</span>
                  <span>+{formatUGX(locationMultiplier)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>Daypart Multiplier</span>
                  <span>+{formatUGX(daypartMultiplier)}</span>
                </div>
                <div className="flex items-center justify-between text-green-600">
                  <span>Duration Discount</span>
                  <span>-{formatUGX(durationDiscount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>{formatUGX(invoice.subtotal)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-gray-500">
                    <span>VAT (18%)</span>
                    <span>{formatUGX(invoice.vat)}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-blue-700">Total Paid</span>
                    <span className="text-2xl font-bold text-blue-600">{formatUGX(invoice.total)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <Badge variant="warning">{invoice.method ?? "MTN MoMo"}</Badge>
                <div className="font-mono text-xs text-gray-500">{invoice.reference ?? "MTN-8847291"}</div>
                <div className="text-sm font-medium text-green-600">Paid on: {paymentDate}</div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {pipeline.map((step, index) => (
                <React.Fragment key={step.label}>
                  <div className="flex min-w-[88px] flex-col items-center text-center">
                    <div
                      className={cn(
                        "relative flex h-8 w-8 items-center justify-center rounded-full border-2",
                        step.done ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-400",
                      )}
                    >
                      {index + 1}
                      {step.active ? (
                        <span className="absolute -inset-2 rounded-full border border-blue-300 animate-pulse" />
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs font-medium text-gray-600">{step.label}</div>
                  </div>
                  {index < pipeline.length - 1 ? (
                    <div
                      className={cn(
                        "hidden h-[2px] flex-1 min-w-[30px] md:block",
                        pipeline[index + 1].done ? "bg-blue-500" : "border-t-2 border-dashed border-gray-300",
                      )}
                    />
                  ) : null}
                </React.Fragment>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-gray-900">Campaign Date Coverage</div>
                <div className="mt-1 text-sm text-gray-600">Booked days are highlighted in red, active days in green.</div>
              </div>
            </div>
            <div className="mt-5">
              <BookingCalendar
                bookedDates={campaignBookedDates}
                activeDates={campaignActiveDates}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "creative" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <Card className="p-6">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">File Preview</div>
            <div className="mt-4 relative aspect-[16/9] overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
              <Image src={quality.preview} alt="Ad preview" fill className="object-cover" />
            </div>
            <div className="mt-4 text-sm text-gray-700">Revision history</div>
            <div className="mt-2 space-y-2">
              {[
                { version: 1, name: "creative_v1.png", date: "04/04/2024 14:22" },
                { version: 2, name: "creative_v2.png", date: "04/04/2024 16:10" },
              ].map((file) => (
                <div
                  key={file.version}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-gray-900">
                      v{file.version} - {file.name}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">{file.date}</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      showToast({
                        type: "success",
                        title: "Downloaded",
                        message: file.name,
                      })
                    }
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </Card>
          <div className="space-y-4">
            <QualityReport score={quality.score} items={quality.items} />
            <Card className="p-6">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Actions</div>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  onClick={() =>
                    showToast({
                      type: "success",
                      title: "Submitted",
                      message: "Creative sent for review.",
                    })
                  }
                >
                  Submit for Review
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    showToast({
                      type: "info",
                      title: "Revision requested",
                      message: "A revision note was added.",
                    })
                  }
                >
                  Request Revision
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "analytics" ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCardSparkline
              label="PROOF OF PLAY"
              value={totalPlays}
              trendText="+9% from last slot"
              trendDirection="up"
              lineColor="#2563EB"
              points={[{ value: 34 }, { value: 38 }, { value: 36 }, { value: 42 }, { value: 47 }, { value: 52 }]}
            />
            <StatCardSparkline
              label="EST. IMPRESSIONS"
              value={`${(totalImpressions / 1000).toFixed(1)}K`}
              trendText="+12% this week"
              trendDirection="up"
              lineColor="#10B981"
              trendDotColorClassName="bg-green-500"
              points={[{ value: 2800 }, { value: 3100 }, { value: 3400 }, { value: 3600 }, { value: 3900 }, { value: 4200 }]}
            />
            <StatCardSparkline
              label="DURATION"
              value={campaign.duration}
              trendText="Prime time slot"
              trendDirection="neutral"
              lineColor="#F59E0B"
              trendDotColorClassName="bg-amber-500"
              points={[{ value: 10 }, { value: 12 }, { value: 11 }, { value: 13 }, { value: 12 }, { value: 14 }]}
            />
            <StatCardSparkline
              label="AMOUNT SPENT"
              value={formatUGX(campaign.amount)}
              trendText="Paid"
              trendDirection="up"
              lineColor="#2563EB"
              points={[{ value: 10 }, { value: 13 }, { value: 16 }, { value: 20 }, { value: 24 }, { value: 30 }]}
            />
          </div>

          {!isLive ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="p-6">
                <ChartSkeleton />
              </Card>
              <Card className="p-6">
                <ChartSkeleton />
              </Card>
              <div className="xl:col-span-2 text-sm text-gray-500">
                Charts available once campaign is live.
              </div>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              <CampaignPlaysByHourChart data={hourStats} trendText="+6.8% vs prior slot" />
              <CampaignEstimatedImpressionsChart data={impressionSeries} trendText="Range 8.4K-12K" />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setReportModalOpen(true)}>
              <FileText className="h-4 w-4" />
              Preview Report
            </Button>
            <Button variant="secondary" onClick={() => setReportModalOpen(true)}>
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "invoice" ? (
        <div className="space-y-4">
          <InvoiceDocument {...invoiceDocument} />

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setInvoiceModalOpen(true)}>
              Preview Invoice
            </Button>
            <Button onClick={() => setInvoiceModalOpen(true)}>Download Invoice PDF</Button>
            <Button variant="secondary" onClick={() => setReceiptModalOpen(true)}>
              Download Receipt PDF
            </Button>
          </div>
        </div>
      ) : null}

      <ExportPreviewModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Campaign Report Preview"
        reportDate={campaign.start.split(" ")[0]}
        periodLabel={`${campaign.start.split(" ")[0]} - ${campaign.end.split(" ")[0]}`}
        exportFormat="pdf"
        campaignReport={campaignReportData ?? undefined}
        invoiceDocument={invoiceDocument}
      />

      <ExportPreviewModal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Invoice Preview"
        reportDate={invoice.due_date}
        periodLabel={invoice.number}
        exportFormat="pdf"
        invoiceDocument={invoiceDocument}
      />

      <ExportPreviewModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Receipt Preview"
        reportDate={invoice.paid_at ?? invoice.due_date}
        periodLabel={`Receipt for ${invoice.number}`}
        exportFormat="pdf"
        invoiceDocument={{
          ...invoiceDocument,
          status: "paid",
        }}
      />
    </div>
  );
}
