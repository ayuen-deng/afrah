"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";

import { InvoiceDocument, buildInvoiceDocumentProps } from "@/components/invoices";

export function FinanceInvoicePreview({ invoice }: { invoice: any }) {
  return <InvoiceDocument {...buildInvoiceDocumentProps(invoice)} />;
}

export function ReportCard({
  title,
  children,
  open,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[18px] font-semibold text-gray-800">{title}</div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-primary"
        >
          {open ? "Hide" : "Generate"}
        </button>
      </div>
      {open ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
