"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { mockCustomers } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ExportPreviewModal } from "@/components/reports";
import { buildQuoteDocumentProps } from "@/components/invoices";

type QuoteStatus = "sent" | "accepted" | "draft" | "expired";

type QuoteItem = {
  id: string;
  screenId: string;
  screen: string;
  start_date: string; // DD/MM/YYYY
  end_date: string; // DD/MM/YYYY
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  days: number;
  hours_per_day: number;
  total_hours: number;
  rate_per_hour: number;
  amount: number; // before VAT
};

type Quote = {
  id: string;
  number: string;
  customer: string;
  company: string;
  email: string;
  phone: string;
  created: string; // DD/MM/YYYY
  valid_until: string; // DD/MM/YYYY
  payment_terms_days: number;
  design_fee: number;
  items: QuoteItem[];
  subtotal: number;
  vat: number;
  total: number;
  status: QuoteStatus;
  notes: string;
};

function readQuotes(): Quote[] {
  try {
    const raw = window.localStorage.getItem("afrah_cs_quotes");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Quote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQuotes(next: Quote[]) {
  window.localStorage.setItem("afrah_cs_quotes", JSON.stringify(next));
  window.dispatchEvent(new Event("afrah_cs_quotes_updated"));
}

function statusVariant(status: QuoteStatus) {
  if (status === "accepted") return "success" as const;
  if (status === "sent") return "info" as const;
  if (status === "draft") return "warning" as const;
  return "error" as const;
}

export default function CustomerServiceQuotesPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [tab, setTab] = React.useState<"all" | QuoteStatus>("all");
  const [search, setSearch] = React.useState("");
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [active, setActive] = React.useState<Quote | null>(null);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [confirmConvert, setConfirmConvert] = React.useState<Quote | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const stored = readQuotes();
    if (stored.length) {
      setQuotes(stored);
      return;
    }

    const seed: Quote[] = [
      {
        id: "qt-2024-0001",
        number: "QT-2024-0001",
        customer: "John Musoke",
        company: "Musoke & Sons",
        email: "john@musoke.ug",
        phone: "0771111111",
        created: "03/04/2024",
        valid_until: "10/04/2024",
        payment_terms_days: 7,
        design_fee: 0,
        items: [
          {
            id: "it-001",
            screenId: "1",
            screen: "Kampala Road Screen",
            start_date: "06/04/2024",
            end_date: "06/04/2024",
            start_time: "18:00",
            end_time: "21:00",
            days: 1,
            hours_per_day: 3,
            total_hours: 3,
            rate_per_hour: 50000,
            amount: 150000,
          },
        ],
        subtotal: 150000,
        vat: 27000,
        total: 177000,
        status: "sent",
        notes: "Rates enquiry for Owino market promo.",
      },
    ];

    writeQuotes(seed);
    setQuotes(seed);
  }, []);

  React.useEffect(() => {
    const onUpdate = () => setQuotes(readQuotes());
    window.addEventListener("afrah_cs_quotes_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_cs_quotes_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  React.useEffect(() => {
    const focus = window.localStorage.getItem("afrah_cs_quote_focus");
    if (!focus) return;
    const q = quotes.find((x) => x.id === focus) ?? null;
    if (!q) return;
    window.localStorage.removeItem("afrah_cs_quote_focus");
    openQuote(q);
  }, [quotes]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotes.filter((qt) => {
      const matchesTab = tab === "all" ? true : qt.status === tab;
      const matchesSearch =
        !q ||
        qt.number.toLowerCase().includes(q) ||
        qt.customer.toLowerCase().includes(q) ||
        (qt.items ?? []).some((i) => i.screen.toLowerCase().includes(q));
      return matchesTab && matchesSearch;
    });
  }, [quotes, search, tab]);

  const activeDocument = React.useMemo(() => {
    if (!active) return undefined;
    return buildQuoteDocumentProps({
      number: active.number,
      customer: active.customer,
      company: active.company,
      email: active.email,
      created: active.created,
      valid_until: active.valid_until,
      items: active.items.map((item) => ({ screen: item.screen, amount: item.amount })),
      total: active.total,
      status: active.status,
    });
  }, [active]);

  function openQuote(quote: Quote) {
    setActive(quote);
    setExportOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Quotations</div>
          <div className="mt-1 text-sm text-gray-600">
            Draft, send, remind, and convert quotes into bookings.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push("/quotes/new")}>New Quote</Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (!filtered.length) {
                showToast({
                  type: "info",
                  title: "No quotes to export",
                  message: "Create or search for a quote first.",
                });
                return;
              }
              openQuote(filtered[0]);
            }}
          >
            Export
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { k: "all", label: "All" },
                { k: "sent", label: "Sent" },
                { k: "accepted", label: "Accepted" },
                { k: "draft", label: "Draft" },
                { k: "expired", label: "Expired" },
              ] as const
            ).map((t) => {
              const activeTab = tab === t.k;
              return (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setTab(t.k)}
                  className={
                    activeTab
                      ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                      : "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="md:w-[360px]">
            <label className="text-sm font-medium text-gray-700">Search</label>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quotes..."
                className="w-full text-sm text-gray-900 outline-none"
              />
            </div>
          </div>
        </div>
      </Card>

      <DataTable
        data={filtered}
        rowKey={(q) => q.id}
        onRowClick={(q) => openQuote(q)}
        columns={[
          {
            key: "quote",
            header: "Quote",
            cell: (q) => (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mockCustomers.find((c) => c.name === q.customer)?.photo ?? "https://picsum.photos/seed/q/100/100"}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-medium text-gray-900">{q.customer}</div>
                  <div className="text-xs text-gray-500">{q.number}</div>
                </div>
              </div>
            ),
          },
          {
            key: "screens",
            header: "Screens",
            cell: (q) => (
              <div className="text-sm text-gray-700">
                {q.items.length} screen{q.items.length === 1 ? "" : "s"}
              </div>
            ),
          },
          { key: "valid", header: "Valid Until", cell: (q) => <span className="font-mono text-sm">{q.valid_until}</span>, className: "whitespace-nowrap" },
          { key: "total", header: "Total", cell: (q) => <span className="font-medium">{formatUGX(q.total)}</span>, className: "whitespace-nowrap" },
          {
            key: "status",
            header: "Status",
            cell: (q) => (
              <Badge variant={statusVariant(q.status)} dot>
                {q.status.toUpperCase()}
              </Badge>
            ),
            className: "whitespace-nowrap",
          },
        ]}
        rowActions={(q) => [
          { label: "View", onClick: () => openQuote(q) },
          {
            label: "Download PDF",
            onClick: () => openQuote(q),
          },
          {
            label: "Send Reminder",
            onClick: () =>
              showToast({
                type: "info",
                title: "Reminder sent",
                message: "Sent via email + WhatsApp (simulated).",
              }),
          },
          {
            label: "Convert to Booking",
            onClick: () => setConfirmConvert(q),
          },
          {
            label: "Edit",
            onClick: () => {
              window.localStorage.setItem("afrah_quote_builder_edit", JSON.stringify(q));
              router.push("/quotes/new");
            },
          },
        ]}
      />

      <ExportPreviewModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Quote Export Preview"
        reportDate={active?.created ?? "10/04/2026"}
        periodLabel={active ? `Valid until ${active.valid_until}` : "Quote preview"}
        exportFormat="pdf"
        invoiceDocument={activeDocument}
        documentTabLabel="Quotation"
      />

      <Modal
        open={Boolean(confirmConvert)}
        title="Convert to booking?"
        onClose={() => setConfirmConvert(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmConvert(null)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={async () => {
                if (!confirmConvert) return;
                setSaving(true);
                try {
                  await new Promise((r) => setTimeout(r, 900));
                  window.localStorage.setItem(
                    "afrah_cs_book_prefill",
                    JSON.stringify({
                      customer: confirmConvert.customer,
                      company: confirmConvert.company,
                      phone: confirmConvert.phone,
                      email: confirmConvert.email,
                      screenId: confirmConvert.items[0]?.screenId ?? "1",
                    }),
                  );
                  showToast({
                    type: "success",
                    title: "Booking started",
                    message: "Opening booking tool...",
                  });
                  setConfirmConvert(null);
                  setExportOpen(false);
                  router.push("/book");
                } finally {
                  setSaving(false);
                }
              }}
            >
              Continue
            </Button>
          </>
        }
      >
        <div className="text-sm text-gray-700">
          This creates a booking draft and opens the &quot;Book for Customer&quot; page.
        </div>
      </Modal>
    </div>
  );
}
