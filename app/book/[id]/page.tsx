"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { mockScreens } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";

function computeTotal(pricePerHour: number, start: string, end: string) {
  const startH = Number(start.split(":")[0] ?? 0);
  const endH = Number(end.split(":")[0] ?? 0);
  const hours = Math.max(0.5, endH - startH);
  const subtotal = pricePerHour * hours;
  const vat = subtotal * 0.18;
  return { hours, subtotal, vat, total: subtotal + vat };
}

export default function BookConfirmPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const screen = mockScreens.find((s) => s.id === params.id);

  const [loading, setLoading] = React.useState(false);
  const [quote, setQuote] = React.useState<{
    date: string;
    start: string;
    end: string;
  } | null>(null);

  React.useEffect(() => {
    const raw = window.localStorage.getItem(`afrah_quote_${params.id}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { date: string; start: string; end: string };
        setQuote({ date: parsed.date, start: parsed.start, end: parsed.end });
        return;
      } catch {
        // ignore
      }
    }
    setQuote({ date: new Date().toISOString().slice(0, 10), start: "18:00", end: "21:00" });
  }, [params.id]);

  if (!screen || !quote) {
    return (
      <main className="min-h-screen bg-page px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Card>
            <div className="text-[24px] font-semibold text-gray-900">
              Booking not found
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Go back and select a screen to book.
            </div>
            <div className="mt-6">
              <Link href="/dashboard/customer/screens">
                <Button>Browse Screens</Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  const pricing = computeTotal(screen.price_per_hour, quote.start, quote.end);

  return (
    <main className="min-h-screen bg-page px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          backButton={<BackButton />}
          title="Confirm Booking"
          subtitle="Review your booking summary and price breakdown."
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card className="p-6">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Booking Summary
            </div>
            <div className="mt-3 text-lg font-semibold text-gray-900">
              {screen.name}
            </div>
            <div className="mt-1 text-sm text-gray-600">{screen.location}</div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Date
                </div>
                <div className="mt-2 font-mono text-sm text-gray-900">
                  {quote.date}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Time
                </div>
                <div className="mt-2 font-mono text-sm text-gray-900">
                  {quote.start} — {quote.end}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Link href={`/dashboard/customer/screens/${screen.id}`}>
                <Button variant="secondary">Edit Quote</Button>
              </Link>
              <Button
                loading={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    await new Promise((r) => setTimeout(r, 700));
                    const bookingRef = `BK-${new Date().getFullYear()}-${String(
                      Math.floor(Math.random() * 9000) + 1000,
                    )}`;

                    window.localStorage.setItem(
                      `afrah_booking_${screen.id}`,
                      JSON.stringify({
                        screenId: screen.id,
                        ref: bookingRef,
                        date: quote.date,
                        start: quote.start,
                        end: quote.end,
                        total: pricing.total,
                        status: "pending_payment",
                      }),
                    );

                    showToast({
                      type: "success",
                      title: "Confirmed",
                      message: "Proceeding to payment…",
                    });
                    router.push(`/book/${screen.id}/payment`);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Confirm & Pay
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Price Breakdown
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Base (UGX/hour)</span>
                <span className="font-medium">
                  UGX {screen.price_per_hour.toLocaleString("en-US")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Duration</span>
                <span className="font-medium">{pricing.hours} hours</span>
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
          </Card>
        </div>

        <div className="flex items-center justify-end">
          <Link href="/dashboard/customer/screens">
            <Button variant="ghost">Back to Screens</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
