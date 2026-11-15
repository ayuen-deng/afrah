"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Search } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ExportPreviewModal } from "@/components/reports";
import { InvoiceDocument, buildQuoteDocumentProps, type InvoiceDocumentProps } from "@/components/invoices";
import { mockScreens } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";

type QuoteStatus = "sent" | "accepted" | "draft" | "expired" | "rejected";

type Quote = {
  id: string;
  number: string;
  screenId: string;
  screen: string;
  created: string;
  valid_until: string;
  amount: number;
  status: QuoteStatus;
  notes?: string;
};

function statusVariant(status: QuoteStatus) {
  if (status === "accepted") return "success" as const;
  if (status === "sent") return "info" as const;
  if (status === "draft") return "warning" as const;
  if (status === "expired" || status === "rejected") return "error" as const;
  return "neutral" as const;
}

export default function CustomerQuotesPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [tab, setTab] = React.useState<"all" | "sent" | "accepted" | "draft" | "expired">("all");
  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [active, setActive] = React.useState<Quote | null>(null);
  const [modOpen, setModOpen] = React.useState(false);
  const [modText, setModText] = React.useState("");
  const [showAcceptInline, setShowAcceptInline] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);

  const [quotes, setQuotes] = React.useState<Quote[]>([
    {
      id: "qt-001",
      number: "QT-2024-0001",
      screenId: "1",
      screen: "Kampala Road Screen",
      created: "04/04/2024",
      valid_until: "11/04/2024",
      amount: 318600,
      status: "sent",
    },
    {
      id: "qt-002",
      number: "QT-2024-0002",
      screenId: "2",
      screen: "Entebbe Road Screen",
      created: "02/04/2024",
      valid_until: "09/04/2024",
      amount: 8490199,
      status: "accepted",
      notes: "Approved for 14 days. Pay to lock dates.",
    },
    {
      id: "qt-003",
      number: "QT-2024-0003",
      screenId: "5",
      screen: "Garden City Screen",
      created: "25/03/2024",
      valid_until: "01/04/2024",
      amount: 453599,
      status: "expired",
    },
    {
      id: "qt-004",
      number: "QT-2024-0004",
      screenId: "4",
      screen: "Bombo Road Screen",
      created: "03/04/2024",
      valid_until: "10/04/2024",
      amount: 892080,
      status: "draft",
      notes: "Draft - waiting for your confirmation on times.",
    },
  ]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotes.filter((quote) => {
      const matchesTab = tab === "all" ? true : quote.status === tab;
      const matchesSearch =
        !q || quote.number.toLowerCase().includes(q) || quote.screen.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [quotes, tab, search]);

  const counts = React.useMemo(() => {
    const base = { all: quotes.length, sent: 0, accepted: 0, draft: 0, expired: 0 };
    quotes.forEach((quote) => {
      if (quote.status === "sent") base.sent += 1;
      if (quote.status === "accepted") base.accepted += 1;
      if (quote.status === "draft") base.draft += 1;
      if (quote.status === "expired") base.expired += 1;
    });
    return base;
  }, [quotes]);

  const activeDoc: InvoiceDocumentProps | null = React.useMemo(() => {
    if (!active) return null;
    return buildQuoteDocumentProps({
      number: active.number,
      customer: "Sarah Nakato",
      company: "Personal",
      created: active.created,
      valid_until: active.valid_until,
      screen: active.screen,
      amount: active.amount,
      status: active.status,
    });
  }, [active]);

  const exportDoc: InvoiceDocumentProps | null = React.useMemo(() => {
    const target = selectedIds.length ? quotes.find((q) => q.id === selectedIds[0]) : active;
    if (!target) return null;
    return buildQuoteDocumentProps({
      number: target.number,
      customer: "Sarah Nakato",
      company: "Personal",
      created: target.created,
      valid_until: target.valid_until,
      screen: target.screen,
      amount: target.amount,
      status: target.status,
    });
  }, [active, quotes, selectedIds]);

  function screenIdForQuote(quote: Quote) {
    const byId = mockScreens.find((screen) => screen.id === quote.screenId)?.id;
    if (byId) return byId;
    const byName = mockScreens.find((screen) => screen.name === quote.screen)?.id;
    return byName ?? "1";
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function openQuote(quote: Quote) {
    setActive(quote);
    setShowAcceptInline(false);
    setExportOpen(true);
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Quotes</div>
          <div className="mt-1 text-sm text-gray-600">
            Review, accept, or request changes in a full quotation preview.
          </div>
        </div>
        <Button variant="secondary" onClick={() => setExportOpen(true)}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { key: "all", label: "All", count: counts.all },
                { key: "sent", label: "Sent", count: counts.sent },
                { key: "accepted", label: "Accepted", count: counts.accepted },
                { key: "draft", label: "Draft", count: counts.draft },
                { key: "expired", label: "Expired", count: counts.expired },
              ] as const
            ).map((item) => {
              const activeTab = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={
                    activeTab
                      ? "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
                      : "inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  }
                >
                  {item.label}
                  <span className={activeTab ? "text-white/90" : "text-gray-500"}>{item.count}</span>
                </button>
              );
            })}
          </div>

          <div className="md:w-[360px]">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by quote number or screen..."
                className="w-full text-sm text-gray-900 outline-none"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every((quote) => selectedIds.includes(quote.id))}
                    onChange={(event) => {
                      if (event.target.checked) setSelectedIds(filtered.map((quote) => quote.id));
                      else setSelectedIds([]);
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                    aria-label="Select all quotes"
                  />
                </th>
                {["Quote", "Created", "Valid Until", "Amount", "Status"].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((quote) => (
                <tr
                  key={quote.id}
                  onClick={() => openQuote(quote)}
                  className="h-12 cursor-pointer border-b border-slate-100 hover:bg-gray-50"
                >
                  <td className="px-4" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(quote.id)}
                      onChange={() => toggleSelect(quote.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary"
                      aria-label={`Select ${quote.number}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            mockScreens.find((screen) => screen.id === quote.screenId)?.image ??
                            mockScreens[0]?.image
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="leading-tight">
                        <div className="font-mono text-sm font-medium text-gray-900">{quote.number}</div>
                        <div className="text-xs text-gray-500">{quote.screen}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">{quote.created}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">{quote.valid_until}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatUGX(quote.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(quote.status)} dot>
                      {quote.status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                    No quotes found for this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIds.length ? (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
          <div className="text-sm font-medium text-gray-700">{selectedIds.length} selected</div>
          <Button onClick={() => setExportOpen(true)}>Export Selected</Button>
        </div>
      ) : null}

      <Modal
        open={detailOpen}
        title="Quote Detail"
        className="max-w-2xl"
        onClose={() => {
          setDetailOpen(false);
          setShowAcceptInline(false);
        }}
        footer={
          active ? (
            <div className="w-full space-y-3">
              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                  onClick={() => {
                    setQuotes((prev) =>
                      prev.map((quote) => (quote.id === active.id ? { ...quote, status: "rejected" } : quote)),
                    );
                    showToast({
                      type: "success",
                      title: "Quote rejected",
                      message: `${active.number} has been rejected.`,
                    });
                    setDetailOpen(false);
                    setShowAcceptInline(false);
                  }}
                >
                  Reject Quote
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setModText(active.notes ?? "");
                      setModOpen(true);
                    }}
                  >
                    Request Modification
                  </Button>
                  <Button onClick={() => setShowAcceptInline((open) => !open)}>Accept Quote</Button>
                </div>
              </div>

              {showAcceptInline ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-sm text-gray-700">
                  <div>Accept this quote? This will create a booking.</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      loading={saving}
                      onClick={async () => {
                        setSaving(true);
                        try {
                          await new Promise((resolve) => setTimeout(resolve, 800));
                          const screenId = screenIdForQuote(active);
                          const bookingRef = `BK-${new Date().getFullYear()}-${String(
                            Math.floor(Math.random() * 9000) + 1000,
                          )}`;
                          window.localStorage.setItem(
                            `afrah_booking_${screenId}`,
                            JSON.stringify({
                              screenId,
                              ref: bookingRef,
                              total: active.amount,
                              status: "pending_payment",
                            }),
                          );
                          setQuotes((prev) =>
                            prev.map((quote) =>
                              quote.id === active.id ? { ...quote, status: "accepted" } : quote,
                            ),
                          );
                          setDetailOpen(false);
                          setShowAcceptInline(false);
                          showToast({
                            type: "success",
                            title: "Quote accepted",
                            message: "Redirecting to payment.",
                          });
                          router.push(`/book/${screenId}/payment`);
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      Yes, Accept
                    </Button>
                    <Button variant="secondary" onClick={() => setShowAcceptInline(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null
        }
      >
        {activeDoc ? <InvoiceDocument {...activeDoc} /> : null}
      </Modal>

      <Modal
        open={modOpen}
        title="Request modification"
        onClose={() => setModOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={async () => {
                if (!active) return;
                setSaving(true);
                try {
                  await new Promise((resolve) => setTimeout(resolve, 800));
                  setQuotes((prev) =>
                    prev.map((quote) =>
                      quote.id === active.id ? { ...quote, status: "draft", notes: modText } : quote,
                    ),
                  );
                  setModOpen(false);
                  showToast({
                    type: "success",
                    title: "Modification requested",
                    message: "Your request has been saved.",
                  });
                } finally {
                  setSaving(false);
                }
              }}
            >
              Submit Request
            </Button>
          </>
        }
      >
        <textarea
          value={modText}
          onChange={(event) => setModText(event.target.value)}
          className="h-28 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Share what needs to be adjusted..."
        />
      </Modal>

      <ExportPreviewModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Quote Export Preview"
        reportDate="10/04/2026"
        periodLabel={selectedIds.length ? `${selectedIds.length} selected quotes` : "Single quote export"}
        exportFormat="pdf"
        invoiceDocument={exportDoc ?? undefined}
        documentTabLabel="Quotation"
      />
    </div>
  );
}
