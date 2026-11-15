"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addDays,
  format,
} from "date-fns";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BackButton } from "@/components/ui/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookingCalendar } from "@/components/ui/BookingCalendar";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";
import { MapboxMap } from "@/components/maps/MapboxMap";

type Screen = {
  id: string;
  name: string;
  location: string;
  city: string;
  lat: number;
  lng: number;
  price_per_hour: number;
  traffic: number;
  location_type: string;
  size: string;
  resolution: string;
  formats?: string;
  max_file_size?: string;
  status: string;
  image: string;
};

const schema = z
  .object({
    date: z.string().min(1, "Date is required."),
    start: z.string().min(1, "Start time is required."),
    end: z.string().min(1, "End time is required."),
  })
  .superRefine((val, ctx) => {
    if (!val.start || !val.end) return;
    if (val.end <= val.start) {
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "End time must be after start time.",
      });
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
    locationType === "cbd" ? 1.3 : locationType === "suburban" ? 1.1 : 1.0;

  const daypartMultiplier =
    startH >= 17 && startH <= 21 ? 1.25 : startH >= 7 && startH <= 10 ? 1.1 : 1.0;

  const base = pricePerHour * durationHours;
  const afterMultipliers = base * locationMultiplier * daypartMultiplier;

  const durationDiscount = durationHours >= 12 ? 0.15 : durationHours >= 6 ? 0.1 : 0;
  const discounted = afterMultipliers * (1 - durationDiscount);

  const vatRate = 0.18;
  const vat = discounted * vatRate;
  const total = discounted + vat;

  return {
    durationHours,
    base,
    locationMultiplier,
    daypartMultiplier,
    durationDiscount,
    subtotal: discounted,
    vat,
    total,
  };
}

function bookedDaysForScreen(screen: Screen) {
  const today = new Date();
  const seed = Number(screen.id) || 1;
  const base = addDays(today, seed);
  const days = new Set<string>();
  const count = screen.status === "booked" ? 9 : 4;
  for (let i = 0; i < count; i += 1) {
    const d = addDays(base, i * 2);
    days.add(format(d, "yyyy-MM-dd"));
  }
  return days;
}

export function ScreenDetailClient({ screen }: { screen: Screen }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const booked = React.useMemo(() => bookedDaysForScreen(screen), [screen]);

  const {
    register,
    watch,
    formState: { errors },
    setValue,
    handleSubmit,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      start: "18:00",
      end: "21:00",
    },
  });

  const values = watch();
  const pricing =
    values.start && values.end
      ? computePricing({
          pricePerHour: screen.price_per_hour,
          locationType: screen.location_type,
          startTime: values.start,
          endTime: values.end,
        })
      : null;
  const bookedDates = React.useMemo(
    () => Array.from(booked).map((day) => new Date(`${day}T00:00:00`)),
    [booked],
  );
  const selectedDate = values.date ? new Date(`${values.date}T00:00:00`) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        backButton={<BackButton />}
        title="Screen Detail"
        subtitle="Review specs, availability, and the live quote calculator before booking."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="relative aspect-[16/9] bg-gray-100">
              <Image src={screen.image} alt={screen.name} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/0 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      screen.status === "available"
                        ? "success"
                        : screen.status === "booked"
                          ? "warning"
                          : "error"
                    }
                    dot
                    className="bg-white/90"
                  >
                    {String(screen.status).toUpperCase()}
                  </Badge>
                  <Badge variant="neutral">{screen.city}</Badge>
                  <Badge variant="neutral">{screen.size}</Badge>
                </div>
                <div className="mt-3 text-2xl font-semibold text-white">
                  {screen.name}
                </div>
                <div className="mt-1 text-sm text-slate-200">
                  {screen.location}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Specs
              </div>
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <div>
                  <span className="text-gray-500">Resolution:</span>{" "}
                  <span className="font-mono">{screen.resolution}</span>
                </div>
                <div>
                  <span className="text-gray-500">Size:</span>{" "}
                  <span className="font-mono">{screen.size}</span>
                </div>
                <div>
                  <span className="text-gray-500">Formats:</span>{" "}
                  <span className="font-mono">{screen.formats ?? "JPG, PNG, MP4, MOV"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Max file:</span>{" "}
                  <span className="font-mono">{screen.max_file_size ?? "100MB"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Traffic:</span>{" "}
                  {screen.traffic.toLocaleString("en-US")} / day
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Location
              </div>
              <div className="mt-3">
                <MapboxMap
                  heightClassName="h-[240px]"
                  zoom={13}
                  center={{ lat: screen.lat, lng: screen.lng }}
                  markers={[
                    {
                      id: screen.id,
                      lat: screen.lat,
                      lng: screen.lng,
                      color: "#2563EB",
                      title: screen.name,
                      subtitle: screen.location,
                      onViewDetails: () => {},
                    },
                  ]}
                />
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Availability Calendar
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Booked dates are highlighted in red.
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setValue("date", format(new Date(), "yyyy-MM-dd"), { shouldValidate: true });
                  showToast({
                    type: "success",
                    title: "Jumped to today",
                    message: "Select a time window to calculate price.",
                  });
                }}
              >
                Today
              </Button>
            </div>

            <div className="mt-5">
              <BookingCalendar
                bookedDates={bookedDates}
                activeDates={[]}
                selectedDate={selectedDate}
                onDateSelect={(date) => setValue("date", format(date, "yyyy-MM-dd"), { shouldValidate: true })}
                labelsByDate={Object.fromEntries(bookedDates.map((date) => [format(date, "yyyy-MM-dd"), "Booked"]))}
              />
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">
              Live Quote Calculator
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Select date and time to see a live breakdown.
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit(() => setConfirmOpen(true))}
            >
              <div>
                <label className="text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  {...register("date")}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                />
                {errors.date ? (
                  <div className="mt-1 text-xs text-red-600">{errors.date.message}</div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Start</label>
                  <input
                    type="time"
                    {...register("start")}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {errors.start ? (
                    <div className="mt-1 text-xs text-red-600">{errors.start.message}</div>
                  ) : null}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">End</label>
                  <input
                    type="time"
                    {...register("end")}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {errors.end ? (
                    <div className="mt-1 text-xs text-red-600">{errors.end.message}</div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Price Breakdown
                </div>
                {pricing ? (
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span>Base price</span>
                      <span className="font-medium">{formatUGX(pricing.base)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Location multiplier</span>
                      <span className="font-medium">
                        × {pricing.locationMultiplier.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Daypart multiplier</span>
                      <span className="font-medium">
                        × {pricing.daypartMultiplier.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Duration discount</span>
                      <span className="font-medium">
                        {pricing.durationDiscount ? `-${Math.round(pricing.durationDiscount * 100)}%` : "—"}
                      </span>
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
                  <div className="mt-3 text-sm text-gray-600">
                    Select start and end time to calculate.
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    showToast({
                      type: "success",
                      title: "Quote PDF generated",
                      message: "Your quote is ready to download.",
                    })
                  }
                >
                  Get Quote PDF
                </Button>
                <Button type="submit">Book This Screen</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        title="Confirm booking"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                showToast({
                  type: "success",
                  title: "Booking started",
                  message: "Taking you to confirmation and payment…",
                });
                if (pricing) {
                  window.localStorage.setItem(
                    `afrah_quote_${screen.id}`,
                    JSON.stringify({
                      screenId: screen.id,
                      date: values.date,
                      start: values.start,
                      end: values.end,
                      total: pricing.total,
                    }),
                  );
                }
                router.push(`/book/${screen.id}`);
              }}
            >
              Confirm & Continue
            </Button>
          </>
        }
      >
        <div className="text-sm text-gray-700">
          You’re about to book <span className="font-semibold">{screen.name}</span>{" "}
          on <span className="font-mono">{values.date}</span> from{" "}
          <span className="font-mono">{values.start}</span> to{" "}
          <span className="font-mono">{values.end}</span>.
        </div>
      </Modal>
    </div>
  );
}
