"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { useRouter } from "next/navigation";

import { financeStore, makeFinanceId } from "@/components/finance/store";
import { buildInvoiceDocumentProps } from "@/components/invoices";
import { FinanceInvoicePreview } from "@/components/finance/shared";
import { ExportPreviewModal } from "@/components/reports";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";

export function InvoicesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "paid" | "unpaid" | "overdue">("all");
  const [invoice, setInvoice] = React.useState<any | null>(null);
  const [previewInvoice, setPreviewInvoice] = React.useState<any | null>(null);
  const [markPaidOpen, setMarkPaidOpen] = React.useState(false);
  const [voidOpen, setVoidOpen] = React.useState(false);

  React.useEffect(() => {
    financeStore.seed();
    const refresh = () => setInvoices(financeStore.readInvoices());
    refresh();
    window.addEventListener(financeStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(financeStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const stats = {
    total: invoices.length,
    paid: invoices.filter((item) => item.status === "paid").length,
    unpaid: invoices.filter((item) => item.status === "unpaid").length,
    overdue: invoices.filter((item) => item.status === "overdue").length,
  };

  const filtered = invoices.filter((item) => {
    const matchesFilter = filter === "all" ? true : item.status === filter;
    const text = `${item.customer} ${item.company} ${item.number} ${item.screen}`.toLowerCase();
    return matchesFilter && (!query.trim() || text.includes(query.trim().toLowerCase()));
  });

  function openPreview(target?: any | null) {
    if (!target) return;
    setPreviewInvoice(target);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Monitor invoice health, collect receivables, and generate new invoices."
        actions={
          <>
            <Button variant="secondary" onClick={() => openPreview(filtered[0] ?? invoices[0] ?? null)}>Export</Button>
            <Button onClick={() => router.push("/invoices/new")}>Create Invoice</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {([
          ["all", "Total", stats.total],
          ["paid", "Paid", stats.paid],
          ["unpaid", "Unpaid", stats.unpaid],
          ["overdue", "Overdue", stats.overdue],
        ] as const).map(([id, label, value]) => (
          <button key={id} type="button" onClick={() => setFilter(id)} className={`rounded-2xl border p-4 text-left ${filter === id ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white"}`}>
            <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
          </button>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoice, customer, screen..." className="h-11 flex-1 rounded-lg border border-gray-200 px-4 text-sm outline-none focus:border-blue-500" />
          <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Date range applied", message: "Invoice list updated." })}>Date Range</Button>
        </div>
      </Card>

      <DataTable<any>
        data={filtered}
        rowKey={(row) => row.id}
        onRowClick={(row) => setInvoice(row)}
        columns={[
          {
            key: "customer",
            header: "Customer",
            cell: (row) => (
              <div className="flex items-center gap-3">
                <img src={row.customer_photo} alt={row.customer} className="h-9 w-9 rounded-full object-cover" />
                <div>
                  <div className="font-medium text-gray-900">{row.customer}</div>
                  <div className="text-xs text-gray-500">{row.company}</div>
                </div>
              </div>
            ),
          },
          { key: "screen", header: "Screen", cell: (row) => row.screen },
          { key: "subtotal", header: "Subtotal", cell: (row) => formatUGX(row.subtotal) },
          { key: "total", header: "Total", cell: (row) => formatUGX(row.total) },
          { key: "due", header: "Due Date", cell: (row) => row.due_date },
          { key: "status", header: "Status", cell: (row) => <Badge variant={row.status === "paid" ? "success" : row.status === "overdue" ? "error" : row.status === "void" ? "neutral" : "warning"}>{row.status}</Badge> },
        ]}
        rowActions={(row) => [
          { label: "Download PDF", onClick: () => openPreview(row) },
          { label: "Send Email", onClick: () => showToast({ type: "success", title: "Sent", message: `${row.number} emailed to customer.` }) },
          ...(row.status !== "paid" ? [{ label: "Mark as Paid", onClick: () => { setInvoice(row); setMarkPaidOpen(true); } }] : []),
          ...(row.status === "paid" ? [] : [{ label: "Void", onClick: () => { setInvoice(row); setVoidOpen(true); } }]),
        ]}
      />

      <Modal open={Boolean(invoice)} onClose={() => setInvoice(null)} title={invoice ? invoice.number : "Invoice Detail"} className="max-w-5xl">
        {invoice ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr,1fr]">
            <div className="space-y-4">
              {[
                ["Invoice Info", [`Customer: ${invoice.customer}`, `Company: ${invoice.company}`, `Booking: ${invoice.booking_ref}`, `Due: ${invoice.due_date}`]],
                ["Line Items", [`Billboard booking - ${invoice.screen}`, `VAT 18%`, `Reference: ${invoice.reference ?? "-"}`]],
                ["Payment", [`Method: ${invoice.method ?? "-"}`, `Paid At: ${invoice.paid_at ?? "-"}`, `Status: ${invoice.status}`]],
              ].map(([title, lines]) => (
                <div key={String(title)} className="rounded-2xl border border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-900">{title}</div>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    {(lines as string[]).map((line) => <div key={line}>{line}</div>)}
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => openPreview(invoice)}>Download PDF</Button>
                <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Sent", message: "Invoice emailed successfully." })}>Send Email</Button>
                {invoice.status !== "paid" ? <Button onClick={() => setMarkPaidOpen(true)}>Mark as Paid</Button> : null}
                {invoice.status !== "paid" ? <Button variant="danger" onClick={() => setVoidOpen(true)}>Void</Button> : null}
              </div>
            </div>
            <FinanceInvoicePreview invoice={invoice} />
          </div>
        ) : null}
      </Modal>

      <Modal open={markPaidOpen} onClose={() => setMarkPaidOpen(false)} title="Mark as Paid">
        <div className="space-y-4 text-sm text-gray-700">
          <div>Method: Bank Transfer</div>
          <div>Reference: STANBIC-{makeFinanceId("ref").slice(-4).toUpperCase()}</div>
          <div>Date: 04/04/2024</div>
          <Button
            onClick={() => {
              if (!invoice) return;
              financeStore.writeInvoices(invoices.map((item) => item.id === invoice.id ? { ...item, status: "paid", method: "Bank Transfer", reference: "STANBIC-00451", paid_at: "04/04/2024" } : item));
              setMarkPaidOpen(false);
              setInvoice(null);
              showToast({ type: "success", title: "Paid", message: "Invoice marked as paid." });
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>

      <Modal open={voidOpen} onClose={() => setVoidOpen(false)} title="Void Invoice">
        <div className="space-y-4 text-sm text-gray-700">
          <div>Are you sure you want to void this invoice? This action needs confirmation.</div>
          <Button
            variant="danger"
            onClick={() => {
              if (!invoice) return;
              financeStore.writeInvoices(invoices.map((item) => item.id === invoice.id ? { ...item, status: "void" } : item));
              setVoidOpen(false);
              setInvoice(null);
              showToast({ type: "success", title: "Voided", message: "Invoice has been voided." });
            }}
          >
            Void Invoice
          </Button>
        </div>
      </Modal>

      <ExportPreviewModal
        open={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        title="Invoice Export Preview"
        reportDate={previewInvoice?.due_date ?? ""}
        periodLabel={previewInvoice?.number}
        invoiceDocument={previewInvoice ? buildInvoiceDocumentProps(previewInvoice) : undefined}
      />
    </div>
  );
}
