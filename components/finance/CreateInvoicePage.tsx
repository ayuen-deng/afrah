"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { useRouter } from "next/navigation";

import { financeStore, makeFinanceId } from "@/components/finance/store";
import { buildInvoiceDocumentProps } from "@/components/invoices";
import { ExportPreviewModal } from "@/components/reports";
import { FinanceInvoicePreview } from "@/components/finance/shared";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

export function CreateInvoicePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<any>({
    number: "INV-2024-0006",
    customer: "John Musoke",
    company: "Musoke & Sons",
    customer_photo: "https://picsum.photos/seed/musoke/100/100",
    booking_ref: "BK-2024-0006",
    screen: "Bombo Road Screen",
    subtotal: 450000,
    vat: 81000,
    total: 531000,
    status: "unpaid",
    due_date: "10/04/2024",
    method: "-",
    reference: "-",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Invoice"
        subtitle="Use the live two-panel builder to create and preview an invoice before sending."
        actions={<Button variant="secondary" onClick={() => router.push("/invoices")}>Back to Invoices</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr,1fr]">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Customer", "customer"],
              ["Company", "company"],
              ["Booking Ref", "booking_ref"],
              ["Screen", "screen"],
              ["Due Date", "due_date"],
            ].map(([label, key]) => (
              <label key={String(key)} className="text-sm font-medium text-gray-700">
                <div className="mb-2">{label}</div>
                <input
                  value={draft[key]}
                  onChange={(event) => setDraft((current: any) => ({ ...current, [key]: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-gray-200 px-4 outline-none focus:border-blue-500"
                />
              </label>
            ))}
            {[
              ["Subtotal", "subtotal"],
              ["VAT", "vat"],
            ].map(([label, key]) => (
              <label key={String(key)} className="text-sm font-medium text-gray-700">
                <div className="mb-2">{label}</div>
                <input
                  type="number"
                  value={draft[key]}
                  onChange={(event) => setDraft((current: any) => {
                    const next = { ...current, [key]: Number(event.target.value) };
                    next.total = next.subtotal + next.vat;
                    return next;
                  })}
                  className="h-11 w-full rounded-lg border border-gray-200 px-4 outline-none focus:border-blue-500"
                />
              </label>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Saved", message: "Draft invoice saved." })}>Save Draft</Button>
            <Button variant="secondary" onClick={() => setPreviewOpen(true)}>Preview PDF</Button>
            <Button
              onClick={() => {
                financeStore.writeInvoices([
                  ...financeStore.readInvoices(),
                  { ...draft, id: makeFinanceId("inv") },
                ]);
                showToast({ type: "success", title: "Sent", message: "Invoice created and sent to customer." });
                router.push("/invoices");
              }}
            >
              Send Invoice
            </Button>
          </div>
        </Card>
        <FinanceInvoicePreview invoice={draft} />
      </div>

      <ExportPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Invoice Preview"
        reportDate={draft.due_date}
        periodLabel={draft.number}
        invoiceDocument={buildInvoiceDocumentProps(draft)}
      />
    </div>
  );
}
