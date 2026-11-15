"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, CheckCircle2 } from "lucide-react";

import { mockCustomers, mockScreens } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

const schema = z
  .object({
    customer: z.string().min(2, "Customer is required."),
    screenId: z.string().min(1, "Screen is required."),
    date: z.string().min(1, "Date is required (DD/MM/YYYY)."),
    start: z.string().min(1, "Start time is required."),
    end: z.string().min(1, "End time is required."),
  })
  .superRefine((val, ctx) => {
    if (val.end <= val.start) {
      ctx.addIssue({ code: "custom", path: ["end"], message: "End must be after start." });
    }
  });

type FormValues = z.infer<typeof schema>;

function parseHour(time: string) {
  const [hh] = time.split(":");
  return Number(hh);
}

function computePricing({
  pricePerHour,
  locationType,
  startTime,
  endTime,
}: {
  pricePerHour: number;
  locationType: string;
  startTime: string;
  endTime: string;
}) {
  const startH = parseHour(startTime);
  const endH = parseHour(endTime);
  const durationHours = Math.max(0.5, endH - startH);

  const locationMultiplier =
    locationType === "cbd" ? 1.5 : locationType === "suburban" ? 1.2 : 1.0;

  const daypartMultiplier = startH >= 18 && startH <= 21 ? 1.8 : 1.0;

  const base = pricePerHour * durationHours;
  const subtotal = base * locationMultiplier * daypartMultiplier;
  const vat = subtotal * 0.18;
  const total = subtotal + vat;

  return { durationHours, base, locationMultiplier, daypartMultiplier, subtotal, vat, total };
}

function nextBookingRef() {
  const year = "2024";
  const raw = window.localStorage.getItem("afrah_booking_counter");
  const n = raw ? Number(raw) : 41;
  const next = n + 1;
  window.localStorage.setItem("afrah_booking_counter", String(next));
  const pad = (x: number) => String(x).padStart(4, "0");
  return `BK-${year}-${pad(next)}`;
}

export default function CustomerServiceBookForCustomerPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer: "",
      screenId: "1",
      date: "06/04/2024",
      start: "18:00",
      end: "21:00",
    },
  });

  React.useEffect(() => {
    const raw = window.localStorage.getItem("afrah_cs_book_prefill");
    if (!raw) return;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "object" && parsed) {
        const p = parsed as { customer?: unknown; screenId?: unknown };
        if (typeof p.customer === "string") form.setValue("customer", p.customer);
        if (typeof p.screenId === "string") form.setValue("screenId", p.screenId);
      }
    } catch {
      // ignore
    }
    window.localStorage.removeItem("afrah_cs_book_prefill");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const values = form.watch();
  const screen = mockScreens.find((s) => s.id === values.screenId) ?? mockScreens[0];
  const pricing =
    values.start && values.end
      ? computePricing({
          pricePerHour: screen.price_per_hour,
          locationType: screen.location_type,
          startTime: values.start,
          endTime: values.end,
        })
      : null;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[24px] font-semibold text-gray-900">
          Book for Customer
        </div>
        <div className="mt-1 text-sm text-gray-600">
          Create a booking on behalf of a customer (demo workflow).
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Card className="p-6">
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(() => setConfirmOpen(true))}
          >
            <div>
              <label className="text-sm font-medium text-gray-700">Customer</label>
              <select
                value={values.customer}
                onChange={(e) => form.setValue("customer", e.target.value, { shouldValidate: true })}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select customer…</option>
                {mockCustomers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} — {c.company}
                  </option>
                ))}
              </select>
              {form.formState.errors.customer ? (
                <div className="mt-1 text-xs text-red-600">{form.formState.errors.customer.message}</div>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Screen</label>
              <select
                value={values.screenId}
                onChange={(e) => form.setValue("screenId", e.target.value, { shouldValidate: true })}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              >
                {mockScreens.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — UGX {s.price_per_hour.toLocaleString("en-US")}/hr
                  </option>
                ))}
              </select>
              {form.formState.errors.screenId ? (
                <div className="mt-1 text-xs text-red-600">{form.formState.errors.screenId.message}</div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Date</label>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <input
                    {...form.register("date")}
                    className="w-full text-sm text-gray-900 outline-none"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                {form.formState.errors.date ? (
                  <div className="mt-1 text-xs text-red-600">{form.formState.errors.date.message}</div>
                ) : null}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Time</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    {...form.register("start")}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="18:00"
                  />
                  <input
                    {...form.register("end")}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="21:00"
                  />
                </div>
                {form.formState.errors.end ? (
                  <div className="mt-1 text-xs text-red-600">{form.formState.errors.end.message}</div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit">Create Booking</Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Price breakdown
          </div>
          {pricing ? (
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Base</span>
                <span className="font-medium">{formatUGX(pricing.base)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Location multiplier</span>
                <span className="font-medium">× {pricing.locationMultiplier.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Daypart multiplier</span>
                <span className="font-medium">× {pricing.daypartMultiplier.toFixed(1)}</span>
              </div>
              <div className="my-2 h-px bg-gray-200" />
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-medium">{formatUGX(pricing.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>VAT (18%)</span>
                <span className="font-medium">{formatUGX(pricing.vat)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-gray-900">
                <span>TOTAL</span>
                <span>{formatUGX(pricing.total)}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-gray-600">
              Select start and end time to calculate.
            </div>
          )}

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Selected screen
            </div>
            <div className="mt-2 text-sm font-semibold text-gray-900">{screen.name}</div>
            <div className="mt-1 text-sm text-gray-600">{screen.location}</div>
          </div>
        </Card>
      </div>

      <Modal
        open={confirmOpen}
        title="Confirm booking creation"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await new Promise((r) => setTimeout(r, 900));
                  const ref = nextBookingRef();
                  window.localStorage.setItem(
                    "afrah_cs_last_booking",
                    JSON.stringify({
                      ref,
                      customer: values.customer,
                      screen: screen.name,
                      date: values.date,
                      start: values.start,
                      end: values.end,
                      total: pricing?.total ?? 0,
                    }),
                  );
                  showToast({
                    type: "success",
                    title: "Booking created",
                    message: `Reference ${ref} saved.`,
                  });
                  setConfirmOpen(false);
                  router.push("/dashboard/customer-service");
                } finally {
                  setSaving(false);
                }
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            Customer: <span className="font-semibold">{values.customer || "—"}</span>
          </div>
          <div>
            Screen: <span className="font-semibold">{screen.name}</span>
          </div>
          <div>
            Date/time:{" "}
            <span className="font-mono">
              {values.date} {values.start}–{values.end}
            </span>
          </div>
          <div>
            Total:{" "}
            <span className="font-semibold">
              {formatUGX(pricing?.total ?? 0)}
            </span>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-green-800">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Demo note
            </div>
            <div className="mt-1 text-xs">
              Payment is handled in the customer portal. This page creates the booking draft and records the reference.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
