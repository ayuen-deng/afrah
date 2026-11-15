"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CreditCard, Phone } from "lucide-react";

import { BackButton } from "@/components/ui/BackButton";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";
import { mockScreens } from "@/lib/mockData";

type Method = "mtn" | "airtel" | "card";

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PaymentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const screen = mockScreens.find((s) => s.id === params.id);

  const [method, setMethod] = React.useState<Method>("mtn");
  const [phone, setPhone] = React.useState("0771234567");
  const [processing, setProcessing] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(600);

  const [booking, setBooking] = React.useState<null | {
    ref: string;
    total: number;
    status: string;
  }>(null);

  React.useEffect(() => {
    const raw = window.localStorage.getItem(`afrah_booking_${params.id}`);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { ref: string; total: number; status: string };
      setBooking(parsed);
    } catch {
      // ignore
    }
  }, [params.id]);

  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [secondsLeft]);

  const timedOut = secondsLeft <= 0;

  if (!screen || !booking) {
    return (
      <main className="min-h-screen bg-page px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Card>
            <div className="text-[24px] font-semibold text-gray-900">
              No booking session
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Start a booking from a screen detail page.
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

  return (
    <main className="min-h-screen bg-page px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          backButton={<BackButton />}
          title="Payment"
          subtitle="Complete payment to activate your booking."
          actions={
            <div className="flex items-center gap-2">
              <Badge variant={timedOut ? "error" : "warning"} dot>
                {timedOut ? "TIMEOUT" : `Expires in ${formatTimer(secondsLeft)}`}
              </Badge>
              <Badge variant="info" className="font-mono">
                {booking.ref}
              </Badge>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card className="p-6">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Choose method
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMethod("mtn")}
                className={
                  method === "mtn"
                    ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                    : "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                }
              >
                MTN MoMo
              </button>
              <button
                type="button"
                onClick={() => setMethod("airtel")}
                className={
                  method === "airtel"
                    ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                    : "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                }
              >
                Airtel Money
              </button>
              <button
                type="button"
                onClick={() => setMethod("card")}
                className={
                  method === "card"
                    ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                    : "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                }
              >
                Card
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
              {method === "card" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    Card details (simulated)
                  </div>
                  <input
                    placeholder="Card number"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    defaultValue="4242 4242 4242 4242"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="MM/YY"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      defaultValue="12/30"
                    />
                    <input
                      placeholder="CVC"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      defaultValue="123"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4 text-gray-500" />
                    Phone number
                  </div>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="text-xs text-gray-500">
                    A payment prompt will be simulated.
                  </div>
                </div>
              )}
            </div>

            {timedOut ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Payment session expired. Click <span className="font-semibold">Try Again</span>{" "}
                to restart the countdown.
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Link href={`/book/${screen.id}`}>
                <Button variant="secondary">Back</Button>
              </Link>
              <Button
                loading={processing}
                disabled={timedOut}
                onClick={async () => {
                  setProcessing(true);
                  try {
                    await new Promise((r) => setTimeout(r, 3000));
                    const next = { ...booking, status: "paid", method };
                    window.localStorage.setItem(
                      `afrah_booking_${screen.id}`,
                      JSON.stringify(next),
                    );
                    showToast({
                      type: "success",
                      title: "Payment successful",
                      message: "Redirecting…",
                    });
                    router.push(`/book/${screen.id}/success`);
                  } finally {
                    setProcessing(false);
                  }
                }}
              >
                Pay {formatUGX(booking.total)}
              </Button>
              {timedOut ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSecondsLeft(600);
                    showToast({
                      type: "info",
                      title: "Timer restarted",
                      message: "You can try payment again.",
                    });
                  }}
                >
                  Try Again
                </Button>
              ) : null}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Summary
            </div>
            <div className="mt-3 text-lg font-semibold text-gray-900">
              {screen.name}
            </div>
            <div className="mt-1 text-sm text-gray-600">{screen.location}</div>
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Amount due
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {formatUGX(booking.total)}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                VAT included • Secure simulation
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
