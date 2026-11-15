"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Search } from "lucide-react";

import { buildInvoiceDocumentProps } from "@/components/invoices";
import { ExportPreviewModal } from "@/components/reports";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { mockInvoices, mockScreens } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";

type InvoiceStatus = "paid" | "unpaid" | "overdue" | "void";
type Invoice = (typeof mockInvoices)[number] & { status: InvoiceStatus };

function statusVariant(status: InvoiceStatus) {
  if (status === "paid") return "success" as const;
  if (status === "unpaid") return "warning" as const;
  if (status === "overdue") return "error" as const;
  return "neutral" as const;
}

export default function CustomerInvoicesPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [tab, setTab] = React.useState<"all" | "paid" | "unpaid" | "overdue">("all");
  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [previewInvoice, setPreviewInvoice] = React.useState<Invoice | null>(null);
  const [exportOpen, setExportOpen] = React.useState(false);

  const [invoices] = React.useState<Invoice[]>(() => {
    const extra: Invoice[] = [
      {
        id: "inv-005",
        number: "INV-2024-0005",
        customer: "Sarah Nakato",
        company: "Personal",
        customer_photo: "https://picsum.photos/seed/cust3/100/100",
        booking_ref: "BK-2024-0005",
        screen: "Entebbe Road Screen",
        subtotal: 550000,
        vat: 99000,
        total: 649000,
        status: "unpaid",
        due_date: "10/04/2024",
      },
      {
        id: "inv-006",
        number: "INV-2024-0006",
        customer: "Sarah Nakato",
        company: "Personal",
        customer_photo: "https://picsum.photos/seed/cust3/100/100",
        booking_ref: "BK-2024-0006",
        screen: "Kampala Road Screen",
        subtotal: 320000,
        vat: 57600,
        total: 377600,
        status: "overdue",
        due_date: "28/03/2024",
      },
    ];
    return [...(mockInvoices as Invoice[]), ...extra];
  });

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesTab = tab === "all" ? true : invoice.status === tab;
      const matchesSearch =
        !q ||
        invoice.number.toLowerCase().includes(q) ||
        invoice.screen.toLowerCase().includes(q) ||
        invoice.booking_ref.toLowerCase().includes(q);
      const matchesCustomer = invoice.customer === "Sarah Nakato";
      return matchesTab && matchesSearch && matchesCustomer;
    });
  }, [invoices, tab, search]);

  const counts = React.useMemo(() => {
    const mine = invoices.filter((invoice) => invoice.customer === "Sarah Nakato");
    const base = { all: mine.length, paid: 0, unpaid: 0, overdue: 0 };
    mine.forEach((invoice) => {
      if (invoice.status === "paid") base.paid += 1;
      if (invoice.status === "unpaid") base.unpaid += 1;
      if (invoice.status === "overdue") base.overdue += 1;
    });
    return base;
  }, [invoices]);

  const exportTarget = React.useMemo(() => {
    if (selectedIds.length) return invoices.find((invoice) => invoice.id === selectedIds[0]) ?? null;
    if (previewInvoice) return previewInvoice;
    return filtered[0] ?? null;
  }, [filtered, invoices, previewInvoice, selectedIds]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function screenIdForInvoice(invoice: Invoice) {
    const byName = mockScreens.find((screen) => screen.name === invoice.screen)?.id;
    return byName ?? "1";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Invoices</div>
          <div className="mt-1 text-sm text-gray-600">
            Track paid, unpaid, and overdue invoices with instant previews.
          </div>
        </div>

        <Button onClick={() => setExportOpen(true)}>
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
                { key: "paid", label: "Paid", count: counts.paid },
                { key: "unpaid", label: "Unpaid", count: counts.unpaid },
                { key: "overdue", label: "Overdue", count: counts.overdue },
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
                      ? "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                      : "inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                placeholder="Search by invoice number, screen, or booking ref..."
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
                    checked={filtered.length > 0 && filtered.every((invoice) => selectedIds.includes(invoice.id))}
                    onChange={(event) => {
                      if (event.target.checked) setSelectedIds(filtered.map((invoice) => invoice.id));
                      else setSelectedIds([]);
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                    aria-label="Select all invoices"
                  />
                </th>
                {["Invoice", "Booking Ref", "Due Date", "Total", "Status", "Action"].map((header) => (
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
              {filtered.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => {
                    setPreviewInvoice(invoice);
                    setExportOpen(true);
                  }}
                  className="h-12 cursor-pointer border-b border-slate-100 hover:bg-gray-50"
                >
                  <td className="px-4" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(invoice.id)}
                      onChange={() => toggleSelect(invoice.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary"
                      aria-label={`Select ${invoice.number}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            mockScreens.find((screen) => screen.name === invoice.screen)?.image ??
                            mockScreens[0]?.image
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="leading-tight">
                        <div className="font-mono text-sm font-medium text-gray-900">{invoice.number}</div>
                        <div className="text-xs text-gray-500">{invoice.screen}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">{invoice.booking_ref}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">{invoice.due_date}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatUGX(invoice.total)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(invoice.status)} dot>
                      {invoice.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                    {invoice.status === "unpaid" || invoice.status === "overdue" ? (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const screenId = screenIdForInvoice(invoice);
                          window.localStorage.setItem(
                            `afrah_booking_${screenId}`,
                            JSON.stringify({
                              screenId,
                              ref: invoice.booking_ref,
                              total: invoice.total,
                              status: "pending_payment",
                            }),
                          );
                          showToast({
                            type: "success",
                            title: "Redirecting to payment",
                            message: `${invoice.number} is ready for payment.`,
                          });
                          router.push(`/book/${screenId}/payment`);
                        }}
                      >
                        Pay Now
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-500">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    No invoices found for this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <ExportPreviewModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Invoice Export Preview"
        reportDate={exportTarget?.due_date ?? ""}
        periodLabel={
          selectedIds.length > 1
            ? `Download ${selectedIds.length} invoices as PDF`
            : exportTarget?.number ?? "Single invoice"
        }
        exportFormat="pdf"
        invoiceDocument={exportTarget ? buildInvoiceDocumentProps(exportTarget) : undefined}
      />
    </div>
  );
}
