"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInCalendarDays, parse } from "date-fns";
import { Download, Send } from "lucide-react";

import { mockCustomers, mockScreens } from "@/lib/mockData";
import { formatDateUG } from "@/lib/dates";
import { formatUGX } from "@/lib/ugx";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BookingCalendar } from "@/components/ui/BookingCalendar";
import { useToast } from "@/components/ui/Toast";
import { PageSkeleton } from "@/components/ui/skeletons";
import { buildQuoteDocumentProps, InvoiceDocument } from "@/components/invoices";
import { ExportPreviewModal } from "@/components/reports";

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
  created: string;
  valid_until: string;
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

function nextQuoteNumber(existing: Quote[]) {
  const year = "2024";
  const max = existing.reduce((acc, q) => {
    const m = q.number.match(/^QT-\d{4}-(\d{4})$/);
    if (!m) return acc;
    const n = Number(m[1]);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  const next = max + 1;
  const pad = (x: number) => String(x).padStart(4, "0");
  return `QT-${year}-${pad(next)}`;
}

const itemSchema = z.object({
  screenId: z.string().min(1, "Select a screen."),
  start_date: z.string().min(1, "Start date is required (DD/MM/YYYY)."),
  end_date: z.string().min(1, "End date is required (DD/MM/YYYY)."),
  start_time: z.string().min(1, "Start time is required."),
  end_time: z.string().min(1, "End time is required."),
});

const schema = z.object({
  customer: z.string().min(2, "Customer is required."),
  company: z.string().min(1, "Company is required."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().min(7, "Phone is required."),
  items: z.array(itemSchema).min(1, "Add at least one screen."),
  needs_design: z.boolean(),
  design_fee: z
    .number()
    .refine((n) => Number.isFinite(n), "Enter a valid number.")
    .min(0, "Design fee must be 0 or more."),
  payment_terms_days: z
    .number()
    .refine((n) => Number.isFinite(n), "Enter a valid number.")
    .min(1, "Payment terms must be at least 1 day.")
    .max(30, "Payment terms cannot exceed 30 days."),
  notes: z.string().optional(),
  validity_days: z
    .number()
    .refine((n) => Number.isFinite(n), "Enter a valid number.")
    .min(1, "Validity must be at least 1 day.")
    .max(30, "Validity cannot exceed 30 days."),
});

type FormValues = z.infer<typeof schema>;

function computeTotals(itemsAmount: number, designFee: number) {
  const subtotal = Math.max(0, itemsAmount + designFee);
  const vat = subtotal * 0.18;
  const total = subtotal + vat;
  return { subtotal, vat, total };
}

type Screen = (typeof mockScreens)[number];

function parseDDMMYYYY(value: string) {
  const [dd, mm, yyyy] = (value ?? "").split("/").map(Number);
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(yyyy, mm - 1, dd);
  return Number.isFinite(d.getTime()) ? d : null;
}

function diffDays(start: string, end: string) {
  const s = parseDDMMYYYY(start);
  const e = parseDDMMYYYY(end);
  if (!s || !e) return 1;
  const ms = e.getTime() - s.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  return Math.max(1, days);
}

function timeMinutes(value: string) {
  const [hh, mm] = (value ?? "").split(":").map(Number);
  if (!Number.isFinite(hh)) return 0;
  if (!Number.isFinite(mm)) return hh * 60;
  return hh * 60 + mm;
}

function computeItem(item: FormValues["items"][number], screen: Screen): QuoteItem {
  const days = diffDays(item.start_date, item.end_date);
  const mins = Math.max(0, timeMinutes(item.end_time) - timeMinutes(item.start_time));
  const hoursPerDay = mins / 60;
  const totalHours = Math.max(0, days * hoursPerDay);
  const amount = totalHours * (screen.price_per_hour ?? 0);
  return {
    id: `itm-${item.screenId}-${item.start_date}-${item.start_time}`,
    screenId: item.screenId,
    screen: screen.name,
    start_date: item.start_date,
    end_date: item.end_date,
    start_time: item.start_time,
    end_time: item.end_time,
    days,
    hours_per_day: hoursPerDay,
    total_hours: totalHours,
    rate_per_hour: screen.price_per_hour ?? 0,
    amount,
  };
}

function buildQuoteDocument(quote: Quote) {
  return buildQuoteDocumentProps({
    number: quote.number,
    customer: quote.customer,
    company: quote.company,
    email: quote.email,
    created: quote.created,
    valid_until: quote.valid_until,
    items: quote.items.map((item) => ({
      screen: item.screen,
      amount: Math.round(Math.max(0, item.amount)),
    })),
    total: quote.total,
    status: quote.status,
  });
}

export default function CustomerServiceQuoteBuilderPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState<Quote | null>(null);
  const [pageLoading, setPageLoading] = React.useState(true);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [validityPickerOpen, setValidityPickerOpen] = React.useState(false);
  const [numberPreview, setNumberPreview] = React.useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer: "",
      company: "",
      email: "",
      phone: "",
      items: [],
      needs_design: false,
      design_fee: 0,
      payment_terms_days: 7,
      notes: "",
      validity_days: 7,
    },
  });

  const items = useFieldArray({ control: form.control, name: "items" });

  React.useEffect(() => {
    const prefillRaw = window.localStorage.getItem("afrah_quote_builder_prefill");
    if (prefillRaw) {
      try {
        const parsed = JSON.parse(prefillRaw) as unknown;
        const obj =
          parsed && typeof parsed === "object"
            ? (parsed as Record<string, unknown>)
            : null;
        form.setValue("customer", typeof obj?.customer === "string" ? obj.customer : "");
        form.setValue("company", typeof obj?.company === "string" ? obj.company : "");
        form.setValue("phone", typeof obj?.phone === "string" ? obj.phone : "");
        form.setValue("email", typeof obj?.email === "string" ? obj.email : "");
      } catch {
        // ignore
      }
      window.localStorage.removeItem("afrah_quote_builder_prefill");
      showToast({
        type: "info",
        title: "Prefilled",
        message: "Loaded details from the selected query.",
      });
    }

    const editRaw = window.localStorage.getItem("afrah_quote_builder_edit");
    if (editRaw) {
      try {
        const q = JSON.parse(editRaw) as Quote;
        setEditing(q);
        setNumberPreview(q.number);
        form.reset({
          customer: q.customer,
          company: q.company,
          email: q.email,
          phone: q.phone,
          items: (q.items ?? []).map((i) => ({
            screenId: i.screenId,
            start_date: i.start_date,
            end_date: i.end_date,
            start_time: i.start_time,
            end_time: i.end_time,
          })),
          needs_design: q.design_fee > 0,
          design_fee: q.design_fee,
          payment_terms_days: q.payment_terms_days ?? 7,
          notes: q.notes ?? "",
          validity_days: 7,
        });
      } catch {
        // ignore
      }
      window.localStorage.removeItem("afrah_quote_builder_edit");
    } else {
      setNumberPreview(nextQuoteNumber(readQuotes()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setPageLoading(false), 320);
    return () => window.clearTimeout(timer);
  }, []);

  const values = form.watch();

  React.useEffect(() => {
    if (!values.needs_design) return;
    const count = items.fields.length;
    const suggested = count >= 2 ? 500000 : 250000;
    if (!Number.isFinite(values.design_fee) || values.design_fee === 0) {
      form.setValue("design_fee", suggested, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.needs_design, items.fields.length]);

  const computedItems = React.useMemo(() => {
    return (values.items ?? []).map((it) => {
      const screen = mockScreens.find((s) => s.id === it.screenId) ?? mockScreens[0];
      return computeItem(it, screen);
    });
  }, [values.items]);

  const itemsAmount = React.useMemo(
    () => computedItems.reduce((acc, it) => acc + (Number.isFinite(it.amount) ? it.amount : 0), 0),
    [computedItems],
  );

  const effectiveDesignFee =
    values.needs_design && Number.isFinite(values.design_fee) ? values.design_fee : 0;

  const totals = computeTotals(itemsAmount, effectiveDesignFee);

  const validity = React.useMemo(() => {
    const created = new Date(2024, 3, 4);
    const days = Number.isFinite(values.validity_days) ? Math.max(1, values.validity_days) : 7;
    const until = new Date(created.getTime() + days * 24 * 60 * 60 * 1000);
    return { created: formatDateUG(created), valid_until: formatDateUG(until) };
  }, [values.validity_days]);

  const previewQuote: Quote = React.useMemo(() => {
    const number = editing?.number ?? (numberPreview || "QT-2024-000X");
    return {
      id: editing?.id ?? `qt-${number}`,
      number,
      customer: values.customer || "—",
      company: values.company || "—",
      email: values.email || "—",
      phone: values.phone || "—",
      created: validity.created,
      valid_until: validity.valid_until,
      payment_terms_days: Number.isFinite(values.payment_terms_days) ? values.payment_terms_days : 7,
      design_fee: effectiveDesignFee,
      items: computedItems,
      subtotal: totals.subtotal,
      vat: totals.vat,
      total: totals.total,
      status: editing?.status ?? "sent",
      notes: values.notes ?? "",
    };
  }, [
    computedItems,
    effectiveDesignFee,
    editing?.id,
    editing?.number,
    editing?.status,
    numberPreview,
    totals.subtotal,
    totals.total,
    totals.vat,
    validity.created,
    validity.valid_until,
    values.company,
    values.customer,
    values.email,
    values.notes,
    values.payment_terms_days,
    values.phone,
  ]);

  const quoteDocument = React.useMemo(() => buildQuoteDocument(previewQuote), [previewQuote]);
  const validitySelectedDate = React.useMemo(() => {
    const parsed = parse(validity.valid_until, "dd/MM/yyyy", new Date());
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [validity.valid_until]);
  const validityCreatedDate = React.useMemo(() => {
    const parsed = parse(validity.created, "dd/MM/yyyy", new Date());
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [validity.created]);
  const validityDisplay = `${validity.created} → ${validity.valid_until}`;

  if (pageLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">
            Quotation Builder
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Fill on the left, preview on the right with a live document preview.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => router.push("/quotes")}>
            Back to Quotes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_520px]">
        <Card className="p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Customer
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Search customer</label>
              <select
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                value={values.customer}
                onChange={(e) => {
                  const name = e.target.value;
                  form.setValue("customer", name, { shouldValidate: true });
                  const found = mockCustomers.find((c) => c.name === name);
                  if (found) {
                    form.setValue("company", found.company, { shouldValidate: true });
                    form.setValue("email", found.email, { shouldValidate: true });
                    form.setValue("phone", found.phone, { shouldValidate: true });
                  }
                }}
              >
                <option value="">Select customer...</option>
                {mockCustomers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} — {c.company}
                  </option>
                ))}
              </select>
              {form.formState.errors.customer ? (
                <div className="mt-1 text-xs text-red-600">
                  {form.formState.errors.customer.message}
                </div>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                {...form.register("email")}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
              {form.formState.errors.email ? (
                <div className="mt-1 text-xs text-red-600">{form.formState.errors.email.message}</div>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input
                {...form.register("phone")}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
              {form.formState.errors.phone ? (
                <div className="mt-1 text-xs text-red-600">{form.formState.errors.phone.message}</div>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Company</label>
              <input
                {...form.register("company")}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
              {form.formState.errors.company ? (
                <div className="mt-1 text-xs text-red-600">{form.formState.errors.company.message}</div>
              ) : null}
            </div>
          </div>

          <div className="mt-8 text-xs font-medium uppercase tracking-wide text-gray-500">
            Screens
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Quotation items</div>
                <div className="mt-1 text-xs text-gray-500">
                  Add screens, dates, and time windows. Duration and totals update live.
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  items.append({
                    screenId: "1",
                    start_date: "10/04/2024",
                    end_date: "24/04/2024",
                    start_time: "06:00",
                    end_time: "22:00",
                  })
                }
              >
                + {items.fields.length ? "Add Another Screen" : "Add Screen"}
              </Button>
            </div>

            {form.formState.errors.items ? (
              <div className="text-xs text-red-600">
                {"message" in form.formState.errors.items
                  ? (form.formState.errors.items.message as string)
                  : "Please add at least one screen."}
              </div>
            ) : null}

            {items.fields.length ? (
              <div className="space-y-3">
                {items.fields.map((f, idx) => {
                  const c = computedItems[idx];
                  const hoursPerDay = Number.isFinite(c?.hours_per_day) ? c.hours_per_day : 0;
                  const totalHours = Number.isFinite(c?.total_hours) ? c.total_hours : 0;
                  const durationText = `${c?.days ?? 1} days × ${hoursPerDay.toFixed(
                    hoursPerDay % 1 === 0 ? 0 : 1,
                  )} hours = ${totalHours.toFixed(totalHours % 1 === 0 ? 0 : 1)} hours`;
                  return (
                    <div key={f.id} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="grid w-full gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Screen</label>
                            <select
                              {...form.register(`items.${idx}.screenId` as const)}
                              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              {mockScreens.map((s) => (
                                <option key={s.id} value={s.id}>
                              {s.name} — UGX {s.price_per_hour.toLocaleString("en-US")}/hr
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700">Start date</label>
                            <input
                              placeholder="10/04/2024"
                              {...form.register(`items.${idx}.start_date` as const)}
                              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">End date</label>
                            <input
                              placeholder="24/04/2024"
                              {...form.register(`items.${idx}.end_date` as const)}
                              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700">Start time</label>
                            <input
                              type="time"
                              {...form.register(`items.${idx}.start_time` as const)}
                              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">End time</label>
                            <input
                              type="time"
                              {...form.register(`items.${idx}.end_time` as const)}
                              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                        </div>

                        {items.fields.length > 1 ? (
                          <Button type="button" variant="secondary" onClick={() => items.remove(idx)}>
                            ×
                          </Button>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs font-mono text-gray-500">{durationText}</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatUGX(Math.round(Number.isFinite(c?.amount) ? (c?.amount ?? 0) : 0))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                No screens added yet. Click &quot;+ Add Screen&quot; to begin.
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Does this client need design work?
                </label>
                <input
                  type="checkbox"
                  checked={values.needs_design}
                  onChange={(e) => form.setValue("needs_design", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                />
              </div>

              {values.needs_design ? (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Design fee</label>
                  <select
                    value={String(values.design_fee)}
                    onChange={(e) =>
                      form.setValue("design_fee", Number(e.target.value), { shouldValidate: true })
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="250000">Single Screen (1) — UGX 250,000</option>
                    <option value="500000">Multiple Screens (2–3) — UGX 500,000</option>
                    <option value="800000">Large Campaign (4+) — UGX 800,000</option>
                  </select>
                  {form.formState.errors.design_fee ? (
                    <div className="mt-1 text-xs text-red-600">
                      {form.formState.errors.design_fee.message}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Payment Terms (days)</label>
                <input
                  type="number"
                  {...form.register("payment_terms_days", { valueAsNumber: true })}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                />
                {form.formState.errors.payment_terms_days ? (
                  <div className="mt-1 text-xs text-red-600">
                    {form.formState.errors.payment_terms_days.message}
                  </div>
                ) : null}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Validity (days)</label>
                <input
                  type="number"
                  {...form.register("validity_days", { valueAsNumber: true })}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                />
                {form.formState.errors.validity_days ? (
                  <div className="mt-1 text-xs text-red-600">
                    {form.formState.errors.validity_days.message}
                  </div>
                ) : null}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="text-xs font-mono text-gray-500">{validityDisplay}</div>
                  <Button
                    type="button"
                    variant="secondary"
                    autoLoadOnClick={false}
                    className="h-8 px-2 text-xs"
                    onClick={() => setValidityPickerOpen(true)}
                  >
                    Pick Expiry Date
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                {...form.register("notes")}
                className="mt-2 h-24 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Pricing summary
              </div>
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatUGX(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>VAT (18%)</span>
                  <span className="font-medium">{formatUGX(totals.vat)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-gray-900">
                  <span>TOTAL</span>
                  <span>{formatUGX(totals.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button
                variant="secondary"
                loading={saving}
                onClick={form.handleSubmit(async (values) => {
                  setSaving(true);
                  try {
                    await new Promise((r) => setTimeout(r, 900));
                    const all = readQuotes();
                    const number = editing?.number ?? (numberPreview || nextQuoteNumber(all));
                    const builtItems = values.items.map((it) => {
                      const screen = mockScreens.find((s) => s.id === it.screenId) ?? mockScreens[0];
                      return computeItem(it, screen);
                    });
                    const itemsAmount = builtItems.reduce((acc, it) => acc + it.amount, 0);
                    const designFee = values.needs_design ? values.design_fee : 0;
                    const totals = computeTotals(itemsAmount, designFee);
                    const quote: Quote = {
                      id: editing?.id ?? `qt-${number}`,
                      number,
                      customer: values.customer,
                      company: values.company,
                      email: values.email,
                      phone: values.phone,
                      created: validity.created,
                      valid_until: validity.valid_until,
                      payment_terms_days: values.payment_terms_days,
                      design_fee: designFee,
                      items: builtItems,
                      subtotal: totals.subtotal,
                      vat: totals.vat,
                      total: totals.total,
                      status: "draft",
                      notes: values.notes ?? "",
                    };

                    const next = editing
                      ? all.map((q) => (q.id === quote.id ? quote : q))
                      : [quote, ...all];
                    writeQuotes(next);
                    setEditing(quote);
                    showToast({
                      type: "success",
                      title: "Draft saved",
                      message: `${quote.number} saved as draft.`,
                    });
                    router.push("/quotes");
                  } finally {
                    setSaving(false);
                  }
                })}
              >
                Save Draft
              </Button>

              <Button
                variant="secondary"
                type="button"
                onClick={() => setPreviewOpen(true)}
              >
                <Download className="h-4 w-4" />
                Preview PDF
              </Button>

              <Button
                loading={saving}
                type="button"
                onClick={form.handleSubmit(() => setSendOpen(true))}
              >
                <Send className="h-4 w-4" />
                Send to Customer
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Live quotation preview</div>
                <div className="mt-2 text-sm text-gray-600">Right panel uses the same reusable document component across ERP.</div>
              </div>
              <Badge variant={editing?.status === "sent" ? "info" : "warning"} dot>
                {editing?.status === "sent" || !editing ? "SENT" : "DRAFT"}
              </Badge>
            </div>

            <div className="mt-6">
              <InvoiceDocument {...quoteDocument} />
            </div>
          </Card>
        </div>
      </div>

      <ExportPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Quotation Preview"
        reportDate={previewQuote.created}
        periodLabel={`Valid until ${previewQuote.valid_until}`}
        exportFormat="pdf"
        invoiceDocument={quoteDocument}
        documentTabLabel="Quotation"
      />

      <Modal
        open={validityPickerOpen}
        title="Select Quote Expiry Date"
        onClose={() => setValidityPickerOpen(false)}
        className="max-w-xl"
        footer={
          <Button variant="secondary" onClick={() => setValidityPickerOpen(false)}>
            Close
          </Button>
        }
      >
        <BookingCalendar
          bookedDates={[]}
          activeDates={[]}
          selectedDate={validitySelectedDate}
          onDateSelect={(date) => {
            const nextDays = Math.max(differenceInCalendarDays(date, validityCreatedDate), 1);
            form.setValue("validity_days", nextDays, { shouldValidate: true, shouldDirty: true });
            setValidityPickerOpen(false);
          }}
        />
      </Modal>

      <Modal
        open={sendOpen}
        title={`Send to ${values.email || "customer"}?`}
        onClose={() => setSendOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSendOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await new Promise((r) => setTimeout(r, 900));
                  const all = readQuotes();
                  const number = editing?.number ?? (numberPreview || nextQuoteNumber(all));
                  const quote: Quote = {
                    ...previewQuote,
                    id: editing?.id ?? `qt-${number}`,
                    number,
                    status: "sent",
                  };
                  const next = editing
                    ? all.map((q) => (q.id === quote.id ? quote : q))
                    : [quote, ...all];
                  writeQuotes(next);
                  setEditing(quote);
                  showToast({
                    type: "success",
                    title: "Quote sent",
                    message: `Quote sent to ${quote.customer} (email + WhatsApp simulated).`,
                  });
                  setSendOpen(false);
                  router.push("/quotes");
                } finally {
                  setSaving(false);
                }
              }}
            >
              Confirm & Send
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            This will send <span className="font-mono">{previewQuote.number}</span> to{" "}
            <span className="font-mono">{values.email || "—"}</span> via email and WhatsApp (simulated).
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Summary</div>
            <div className="mt-2 flex items-center justify-between">
              <span>Screens</span>
              <span className="font-medium">{previewQuote.items.length}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Total</span>
              <span className="font-semibold text-gray-900">{formatUGX(previewQuote.total)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

