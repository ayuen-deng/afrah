import { NextResponse } from "next/server";
import { z } from "zod";

import { inferRoleFromEmail, roleHome } from "@/lib/roles";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid email or password." },
      { status: 400 },
    );
  }

  const role = inferRoleFromEmail(parsed.data.email);
  const redirectTo = roleHome[role];

  const res = NextResponse.json({ ok: true, role, redirectTo });
  res.cookies.set("role", role, { path: "/", sameSite: "lax" });
  return res;
}

