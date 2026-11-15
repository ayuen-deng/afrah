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

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <AuthSplitLayout title="Sign in to your account">
      <form
        onSubmit={handleSubmit(async (values) => {
          setSubmitting(true);
          try {
            const res = await fetch("/api/auth/login", {
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
                title: "Login failed",
                message: "Check your credentials and try again.",
              });
              return;
            }

            showToast({
              type: "success",
              title: "Welcome back",
              message: "Redirecting to your dashboard…",
            });
            router.push(json.redirectTo);
          } finally {
            setSubmitting(false);
          }
        })}
        className="space-y-4"
      >
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            {...register("email")}
            placeholder="you@company.com"
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.email ? (
            <div className="mt-1 text-xs text-red-600">
              {errors.email.message}
            </div>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <Link
              href="/reset-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.password ? (
            <div className="mt-1 text-xs text-red-600">
              {errors.password.message}
            </div>
          ) : null}
        </div>

        <Button type="submit" loading={submitting} className="w-full">
          Sign in
        </Button>

        <div className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
          Demo tip: use <span className="font-mono">demo+ceo@afrahmedia.ug</span>{" "}
          (or <span className="font-mono">demo+finance@afrahmedia.ug</span>) to
          simulate different roles.
        </div>
      </form>
    </AuthSplitLayout>
  );
}

