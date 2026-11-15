import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { differenceInCalendarDays, isValid, parse } from "date-fns";

import { cn } from "@/lib/cn";
import { formatUGX } from "@/lib/ugx";

type DocumentParty = {
  name: string;
  company?: string;
  email?: string;
};

type IssuedBy = {
  name?: string;
  address?: string;
  tin?: string;
  website?: string;
  email?: string;
  phone?: string;
  initials?: string;
};

type LineItem = {
  description: string;
  qty?: number;
  unitPrice?: number;
  amount: number;
};

export type InvoiceDocumentProps = {
  isQuotation?: boolean;
  documentTitle?: "INVOICE" | "QUOTATION";
  number: string;
  issuedTo: DocumentParty;
  issuedBy?: IssuedBy;
  issueDate: string;
  dueDate?: string;
  validUntil?: string;
  bookingRef?: string;
  screen?: string;
  lineItems: LineItem[];
  subtotal: number;
  vat?: number;
  total: number;
  status: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentTerms?: string;
  className?: string;
};

function parseUgDate(value?: string) {
  if (!value) return null;
  const parsed = parse(value, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? parsed : null;
}

function getStatusBanner({
  documentTitle,
  status,
  dueDate,
  validUntil,
  paidAt,
  paymentMethod,
  paymentReference,
}: Pick<
  InvoiceDocumentProps,
  "documentTitle" | "status" | "dueDate" | "validUntil" | "paidAt" | "paymentMethod" | "paymentReference"
>) {
  const normalized = status.toLowerCase();
  const quoteDue = validUntil ?? dueDate;

  if (documentTitle === "QUOTATION") {
    if (normalized === "draft") {
      return {
        className: "border-gray-200 bg-gray-50 text-gray-700",
        content: "DRAFT",
        subContent: "Quotation is saved as draft.",
      };
    }
    if (normalized === "accepted") {
      return {
        className: "border-green-200 bg-green-50 text-green-800",
        content: "ACCEPTED",
        subContent: "Quotation approved and ready for payment.",
      };
    }
    if (normalized === "expired" || normalized === "rejected") {
      return {
        className: "border-red-200 bg-red-50 text-red-800",
        content: normalized === "expired" ? "EXPIRED" : "REJECTED",
        subContent: quoteDue ? `Valid until ${quoteDue}` : "This quotation is no longer active.",
      };
    }
    if (normalized === "sent") {
      return {
        className: "border-blue-200 bg-blue-50 text-blue-800",
        content: quoteDue ? `SENT | Valid until ${quoteDue}` : "SENT",
        subContent: "Quotation has been sent to the customer.",
      };
    }

    return {
      className: "border-amber-200 bg-amber-50 text-amber-800",
      content: normalized.toUpperCase(),
      subContent: "Quotation is awaiting the next action.",
    };
  }

  if (normalized === "paid") {
    return {
      className: "border-green-200 bg-green-50 text-green-800",
      content: "PAID",
      subContent: [paymentMethod, paymentReference, paidAt].filter(Boolean).join(" | "),
    };
  }

  if (normalized === "overdue") {
    const parsedDue = parseUgDate(dueDate);
    const overdueDays = parsedDue ? Math.max(differenceInCalendarDays(new Date(), parsedDue), 1) : null;
    return {
      className: "border-red-200 bg-red-50 text-red-800",
      content: overdueDays ? `OVERDUE — ${overdueDays} days past due` : "OVERDUE",
      subContent: dueDate ? `Payment due since ${dueDate}` : "Immediate payment required.",
    };
  }

  if (normalized === "void") {
    return {
      className: "border-gray-200 bg-gray-50 text-gray-700",
      content: "VOID",
      subContent: "This document has been voided.",
    };
  }

  return {
    className: "border-amber-200 bg-amber-50 text-amber-800",
    content: dueDate ? `PAYMENT DUE: ${dueDate}` : "PAYMENT DUE",
    subContent: "Please use the payment instructions below.",
  };
}

export function buildInvoiceDocumentProps(invoice: {
  number: string;
  customer: string;
  company?: string;
  email?: string;
  booking_ref?: string;
  screen?: string;
  subtotal: number;
  vat?: number;
  total: number;
  status: string;
  due_date: string;
  paid_at?: string;
  method?: string;
  reference?: string;
}): InvoiceDocumentProps {
  return {
    isQuotation: false,
    documentTitle: "INVOICE",
    number: invoice.number,
    issuedTo: {
      name: invoice.customer,
      company: invoice.company,
      email: invoice.email,
    },
    issueDate: invoice.paid_at ?? invoice.due_date,
    dueDate: invoice.due_date,
    bookingRef: invoice.booking_ref,
    screen: invoice.screen,
    lineItems: [
      {
        description: `Digital billboard booking${invoice.screen ? ` — ${invoice.screen}` : ""}`,
        qty: 1,
        unitPrice: invoice.subtotal,
        amount: invoice.subtotal,
      },
    ],
    subtotal: invoice.subtotal,
    vat: invoice.vat ?? 0,
    total: invoice.total,
    status: invoice.status,
    paidAt: invoice.paid_at,
    paymentMethod: invoice.method,
    paymentReference: invoice.reference,
  };
}

export function buildQuoteDocumentProps(quote: {
  number: string;
  customer?: string;
  company?: string;
  email?: string;
  created?: string;
  valid_until?: string;
  screen?: string;
  items?: Array<{ screen?: string; amount?: number }>;
  amount?: number;
  total?: number;
  status: string;
}): InvoiceDocumentProps {
  const total = quote.total ?? quote.amount ?? 0;
  const vat = Math.round(total * (18 / 118));
  const subtotal = total - vat;

  return {
    isQuotation: true,
    documentTitle: "QUOTATION",
    number: quote.number,
    issuedTo: {
      name: quote.customer ?? "Sarah Nakato",
      company: quote.company ?? "Personal",
      email: quote.email,
    },
    issueDate: quote.created ?? quote.valid_until ?? "",
    dueDate: quote.valid_until,
    validUntil: quote.valid_until,
    screen: quote.screen ?? quote.items?.[0]?.screen,
    lineItems:
      quote.items?.length
        ? quote.items.map((item) => ({
            description: `Screen reservation — ${item.screen ?? quote.screen ?? "Digital billboard"}`,
            qty: 1,
            unitPrice: item.amount ?? total,
            amount: item.amount ?? total,
          }))
        : [
            {
              description: `Screen reservation — ${quote.screen ?? "Digital billboard"}`,
              qty: 1,
              unitPrice: subtotal,
              amount: subtotal,
            },
          ],
    subtotal,
    vat,
    total,
    status: quote.status,
    paymentTerms: "7 Days",
  };
}

export function InvoiceDocument({
  isQuotation = false,
  documentTitle = "INVOICE",
  number,
  issuedTo,
  issuedBy,
  issueDate,
  dueDate,
  validUntil,
  bookingRef,
  screen,
  lineItems,
  subtotal,
  vat = 0,
  total,
  status,
  paidAt,
  paymentMethod,
  paymentReference,
  paymentTerms,
  className,
}: InvoiceDocumentProps) {
  const resolvedTitle = isQuotation ? "QUOTATION" : documentTitle;

  const company = {
    name: "Afrah Media Ltd",
    address: "Nakasero, Kampala, Uganda",
    tin: "1002345678",
    website: "afrahmedia.ug",
    email: "info@afrahmedia.ug",
    phone: "+256 700 123456",
    initials: "AM",
    ...issuedBy,
  };

  const banner = getStatusBanner({
    documentTitle: resolvedTitle,
    status,
    dueDate,
    validUntil,
    paidAt,
    paymentMethod,
    paymentReference,
  });

  return (
    <div className={cn("overflow-hidden rounded-2xl bg-white shadow-lg", className)}>
      <div className="bg-[linear-gradient(135deg,#1e40af,#2563EB)] px-8 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[28px] font-bold text-white">{resolvedTitle}</div>
            <div className="mt-2 text-sm text-blue-200">#{number}</div>
          </div>

          <div className="flex items-start gap-4 sm:text-right">
            <div>
              <div className="text-[20px] font-bold text-white">AFRAH MEDIA</div>
              <div className="mt-2 text-sm text-blue-200">{company.website}</div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold text-white">
              {company.initials}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 px-8 py-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">Issued To</div>
            <div className="mt-3 text-base font-semibold text-gray-900">{issuedTo.name}</div>
            <div className="mt-1 text-sm text-gray-600">{issuedTo.company ?? "Personal"}</div>
            <div className="mt-1 text-[13px] text-gray-500">{issuedTo.email ?? "—"}</div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">Issued By</div>
            <div className="mt-3 text-base font-semibold text-gray-900">{company.name}</div>
            <div className="mt-1 text-[13px] text-gray-500">{company.address}</div>
            <div className="mt-1 text-[13px] text-gray-500">TIN: {company.tin}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white/60 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">Issue Date</div>
            <div className="mt-2 text-sm font-medium text-gray-900">{issueDate}</div>
          </div>
          <div className="rounded-xl bg-white/60 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">
              {resolvedTitle === "QUOTATION" ? "Valid Until" : "Due Date"}
            </div>
            <div
              className={cn(
                "mt-2 text-sm font-medium",
                status.toLowerCase() === "overdue" ? "text-red-600" : "text-gray-900",
              )}
            >
              {validUntil ?? dueDate ?? "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Description", "Qty", "Unit Price", "Amount"].map((label) => (
                  <th
                    key={label}
                    className={cn(
                      "px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400",
                      label === "Description" ? "text-left" : "text-right",
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={`${item.description}-${index}`} className="h-12 border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.description}
                    {bookingRef || screen ? (
                      <div className="mt-1 text-xs text-gray-400">
                        {[bookingRef, screen].filter(Boolean).join(" | ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{item.qty ?? 1}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{formatUGX(item.unitPrice ?? item.amount)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{formatUGX(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Subtotal</span>
              <span>{formatUGX(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>VAT (18%)</span>
              <span>{formatUGX(vat)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3" />
            <div className="rounded-xl border-2 border-primary bg-blue-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold uppercase tracking-wide text-primary">Total Due</span>
                <span className="text-2xl font-bold text-primary">{formatUGX(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={cn("mt-6 rounded-xl border px-4 py-4", banner.className)}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            {banner.content === "PAID" ? <CheckCircle2 className="h-5 w-5" /> : null}
            <span>{banner.content}</span>
          </div>
          <div className="mt-2 text-sm">{banner.subContent}</div>
        </div>

        <div className="mt-6 rounded-xl border border-blue-100 bg-white p-5">
          <div className="text-sm font-semibold text-primary">
            {resolvedTitle === "QUOTATION" ? "Payment Terms" : "Payment Instructions"}
          </div>
          {resolvedTitle === "QUOTATION" ? (
            <div className="mt-3 text-sm text-gray-700">{paymentTerms ?? "7 Days"}</div>
          ) : (
            <div className="mt-3 space-y-1 text-sm text-gray-700">
              <div>Bank: Stanbic Bank Uganda</div>
              <div>Account Name: Afrah Media Ltd</div>
              <div>Account Number: 9030012345</div>
              <div>Reference: {number}</div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 px-8 py-5 text-center">
        <div className="text-sm font-medium text-gray-800">Thank you for your business</div>
        <div className="mt-1 text-sm text-gray-500">
          {company.website} | {company.email} | {company.phone}
        </div>
        <div className="mt-2 text-xs text-gray-400">This is a computer generated invoice</div>
      </div>
    </div>
  );
}
