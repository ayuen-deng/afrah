"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const profileSchema = z.object({
  company: z.string().min(2, "Company is required."),
  phone: z.string().min(7, "Phone is required."),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function CustomerOnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = React.useState(1);
  const [saving, setSaving] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { company: "Personal", phone: "0771234567" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <div className="text-[24px] font-semibold text-gray-900">
          Customer Onboarding
        </div>
        <div className="mt-1 text-sm text-gray-600">
          Step {step} of 3
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { n: 1, label: "Complete profile" },
          { n: 2, label: "How it works" },
          { n: 3, label: "Browse screens" },
        ].map((s) => (
          <Card key={s.n} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Step {s.n}
              </div>
              {step > s.n ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : null}
            </div>
            <div className="mt-2 text-sm font-semibold text-gray-900">
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      {step === 1 ? (
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">
            Complete your profile
          </div>
          <div className="mt-1 text-sm text-gray-600">
            This helps us tailor quotes and invoices in the Ugandan context.
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={handleSubmit(async () => {
              setSaving(true);
              try {
                await new Promise((r) => setTimeout(r, 900));
                showToast({
                  type: "success",
                  title: "Profile saved",
                  message: "Moving to the next step…",
                });
                setStep(2);
              } finally {
                setSaving(false);
              }
            })}
          >
            <div>
              <label className="text-sm font-medium text-gray-700">Company</label>
              <input
                {...register("company")}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.company ? (
                <div className="mt-1 text-xs text-red-600">
                  {errors.company.message}
                </div>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input
                {...register("phone")}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.phone ? (
                <div className="mt-1 text-xs text-red-600">
                  {errors.phone.message}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="submit" loading={saving}>
                Save & Continue
              </Button>
            </div>
          </form>
        </Card>
      ) : step === 2 ? (
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">
            How it works
          </div>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <div>1) Browse screens on the map or grid view.</div>
            <div>2) Get a live quote based on dates and times.</div>
            <div>3) Pay via MTN MoMo / Airtel Money and confirm booking.</div>
            <div>4) Upload your ad creative and track results.</div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              onClick={() => {
                showToast({
                  type: "success",
                  title: "Got it",
                  message: "One more step…",
                });
                setStep(3);
              }}
            >
              Continue
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">
            Browse screens
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Jump into the screen browser and request your first quote.
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              loading={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await fetch("/api/auth/complete-onboarding", { method: "POST" });
                  showToast({
                    type: "success",
                    title: "Onboarding complete",
                    message: "Taking you to the screen browser…",
                  });
                  router.push("/dashboard/customer/screens");
                } finally {
                  setSaving(false);
                }
              }}
            >
              Browse Screens
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

