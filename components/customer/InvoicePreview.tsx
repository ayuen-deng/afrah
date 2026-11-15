import * as React from "react";

import { InvoiceDocument, buildInvoiceDocumentProps } from "@/components/invoices";

type InvoiceLike = {
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

export function InvoicePreview({ invoice }: { invoice: InvoiceLike }) {
  return <InvoiceDocument {...buildInvoiceDocumentProps(invoice)} />;
}
