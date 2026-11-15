"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const schema = z
  .object({
    fullName: z.string().min(2, "Full name is required."),
    email: z.string().email("Enter a valid email address."),
    phone: z.string().min(7, "Phone is required."),
    password: z.string().min(8, "Minimum 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
    terms: z.boolean().refine((v) => v, "You must accept the terms."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { terms: false },
  });

  const termsChecked = watch("terms");

  return (
    <AuthSplitLayout title="Create your customer account">
      <form
        onSubmit={handleSubmit(async (values) => {
          setSubmitting(true);
          try {
            const res = await fetch("/api/auth/signup", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(values),
            });
            const json = (await res.json()) as
              | { ok: true; redirectTo: string }
              | { ok: false; error: string };

            if (!res.ok || !json.ok) {
              showToast({
                type: "error",
                title: "Sign up failed",
                message: "Please check the form and try again.",
              });
              return;
            }

            showToast({
              type: "success",
              title: "Account created",
              message: "Starting onboarding…",
            });
            router.push(json.redirectTo);
          } finally {
            setSubmitting(false);
          }
        })}
        className="space-y-4"
      >
        <div>
          <label className="text-sm font-medium text-gray-700">Full Name</label>
          <input
            {...register("fullName")}
            placeholder="Afrah Customer"
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.fullName ? (
            <div className="mt-1 text-xs text-red-600">
              {errors.fullName.message}
            </div>
          ) : null}
        </div>

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

        <div>
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <input
            {...register("phone")}
            placeholder="07XXXXXXXX"
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.phone ? (
            <div className="mt-1 text-xs text-red-600">
              {errors.phone.message}
            </div>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Password</label>
          <input
            {...register("password")}
            type="password"
            placeholder="Minimum 8 characters"
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.password ? (
            <div className="mt-1 text-xs text-red-600">
              {errors.password.message}
            </div>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            {...register("confirmPassword")}
            type="password"
            placeholder="Repeat password"
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.confirmPassword ? (
            <div className="mt-1 text-xs text-red-600">
              {errors.confirmPassword.message}
            </div>
          ) : null}
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={Boolean(termsChecked)}
              onChange={(e) => setValue("terms", e.target.checked, { shouldValidate: true })}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
            />
            <span>
              I agree to the terms and conditions
              {errors.terms ? (
                <div className="mt-1 text-xs text-red-600">
                  {errors.terms.message}
                </div>
              ) : null}
            </span>
          </label>
        </div>

        <Button type="submit" loading={submitting} className="w-full">
          Sign up
        </Button>

        <div className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
}

