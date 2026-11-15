import { NextResponse } from "next/server";
import { z } from "zod";

import { roleHome, type Role } from "@/lib/roles";

const schema = z.object({
  role: z.enum([
    "customer",
    "customer_service_rep",
    "sales_executive",
    "head_of_design",
    "designer",
    "operations_manager",
    "finance",
    "ceo",
    "technician",
    "internal_staff",
    "super_admin",
  ]),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid role." }, { status: 400 });
  }

  const role = parsed.data.role as Role;
  const redirectTo = roleHome[role];

  const res = NextResponse.json({ ok: true, role, redirectTo });
  res.cookies.set("role", role, { path: "/", sameSite: "lax" });
  return res;
}
