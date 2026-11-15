"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, UploadCloud } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

export default function BookingSuccessPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [ref, setRef] = React.useState<string>("BK-2026-0000");

  React.useEffect(() => {
    const raw = window.localStorage.getItem(`afrah_booking_${params.id}`);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { ref: string; status: string };
      setRef(parsed.ref);
    } catch {
      // ignore
    }
  }, [params.id]);

  return (
    <main className="min-h-screen bg-page px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="p-8">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50"
              >
                <CheckCircle2 className="h-9 w-9 text-green-600" />
              </motion.div>

              <div className="mt-4 text-2xl font-semibold text-gray-900">
                Booking Successful
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Your campaign is now in the pipeline.
              </div>

              <div className="mt-5">
                <Badge variant="info" className="px-4 py-2 text-sm font-semibold font-mono">
                  {ref}
                </Badge>
              </div>

              <div className="mt-8 grid w-full gap-3 sm:grid-cols-5">
                {[
                  { label: "Payment", status: "complete" },
                  { label: "Creative Upload", status: "next" },
                  { label: "Review", status: "pending" },
                  { label: "Scheduled", status: "pending" },
                  { label: "Live", status: "pending" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={
                      s.status === "complete"
                        ? "rounded-xl border border-green-200 bg-green-50 p-3 text-center"
                        : s.status === "next"
                          ? "rounded-xl border border-blue-200 bg-blue-50 p-3 text-center"
                          : "rounded-xl border border-gray-200 bg-white p-3 text-center"
                    }
                  >
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {s.label}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {s.status === "complete"
                        ? "Done"
                        : s.status === "next"
                          ? "Next"
                          : "Pending"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  onClick={() => {
                    showToast({
                      type: "success",
                      title: "Upload opened",
                      message: "Taking you to creative upload…",
                    });
                    router.push(`/dashboard/customer/campaigns/${params.id}/upload`);
                  }}
                >
                  <UploadCloud className="h-4 w-4" />
                  Upload Your Ad Now
                </Button>
                <Link href="/dashboard/customer/campaigns">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      showToast({
                        type: "info",
                        title: "No problem",
                        message: "You can upload later from My Campaigns.",
                      })
                    }
                  >
                    I&apos;ll upload later
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="flex items-center justify-center">
          <Link href="/dashboard/customer">
            <Button variant="ghost">Back to Customer Home</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

