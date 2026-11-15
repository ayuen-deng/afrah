"use client";

import * as React from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
});

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-6 py-12">
      <Card className="w-full max-w-md">
        <div className="text-[18px] font-semibold text-gray-800">
          Reset password
        </div>
        {sent ? (
          <div className="mt-4">
            <div className="text-sm text-gray-600">Check your email.</div>
            <div className="mt-5">
              <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(async (values) => {
              setSubmitting(true);
              try {
                const res = await fetch("/api/auth/reset-password", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify(values),
                });
                if (!res.ok) {
                  showToast({
                    type: "error",
                    title: "Could not send link",
                    message: "Please check the email and try again.",
                  });
                  return;
                }

                setSent(true);
                showToast({
                  type: "success",
                  title: "Reset link sent",
                  message: "Check your email.",
                });
              } finally {
                setSubmitting(false);
              }
            })}
            className="mt-5 space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                {...register("email")}
                placeholder="you@email.com"
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.email ? (
                <div className="mt-1 text-xs text-red-600">
                  {errors.email.message}
                </div>
              ) : null}
            </div>

            <Button type="submit" loading={submitting} className="w-full">
              Send Reset Link
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </Card>
    </main>
  );
}

