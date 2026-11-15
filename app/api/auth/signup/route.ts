import { NextResponse } from "next/server";
import { z } from "zod";

import { roleHome } from "@/lib/roles";

const schema = z
  .object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    terms: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
    if (!data.terms) {
      ctx.addIssue({
        code: "custom",
        path: ["terms"],
        message: "You must accept the terms.",
      });
    }
  });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please fix the highlighted fields." },
      { status: 400 },
    );
  }

  const role = "customer";
  const redirectTo = `${roleHome.customer}/onboarding`;

  const res = NextResponse.json({ ok: true, role, redirectTo });
  res.cookies.set("role", role, { path: "/", sameSite: "lax" });
  res.cookies.set("first_login", "1", { path: "/", sameSite: "lax" });
  return res;
}

