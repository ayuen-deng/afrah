import { NextResponse, type NextRequest } from "next/server";

type Role =
  | "customer"
  | "customer_service_rep"
  | "sales_executive"
  | "head_of_design"
  | "designer"
  | "operations_manager"
  | "finance"
  | "ceo"
  | "technician"
  | "internal_staff"
  | "super_admin";

const roleHome: Record<Role, string> = {
  customer: "/dashboard/customer",
  customer_service_rep: "/dashboard/customer-service",
  sales_executive: "/dashboard/sales",
  head_of_design: "/dashboard/design-head",
  designer: "/dashboard/designer",
  operations_manager: "/dashboard/operations",
  finance: "/dashboard/finance",
  ceo: "/dashboard/ceo",
  technician: "/dashboard/technician",
  internal_staff: "/dashboard/staff",
  super_admin: "/super-admin",
};

const roleAllowedPrefixes: Record<Role, string[]> = {
  customer: ["/dashboard/customer", "/book"],
  customer_service_rep: [
    "/dashboard/customer-service",
    "/queries",
    "/visitors",
    "/quotes",
    "/book",
    "/customers",
    "/reminders",
  ],
  sales_executive: [
    "/dashboard/sales",
    "/pipeline",
    "/leads",
    "/clients",
    "/commission",
    "/quotes",
  ],
  head_of_design: [
    "/dashboard/design-head",
    "/queue",
    "/tasks",
    "/review",
    "/revisions",
    "/playlists",
    "/templates",
    "/team",
  ],
  designer: ["/dashboard/designer", "/tasks", "/performance", "/resources"],
  operations_manager: ["/dashboard/operations", "/people", "/office", "/screens", "/assets"],
  finance: [
    "/dashboard/finance",
    "/invoices",
    "/payments",
    "/expenses",
    "/petty-cash",
    "/payroll",
    "/quickbooks",
    "/reports",
  ],
  ceo: [
    "/dashboard/ceo",
    "/map",
    "/approvals",
    "/kpis",
    "/analytics",
    "/announcements",
    "/settings",
    "/invoices",
  ],
  technician: ["/dashboard/technician", "/tasks", "/history", "/report"],
  internal_staff: [
    "/dashboard/staff",
    "/leave",
    "/assets",
    "/payslips",
    "/maintenance",
    "/announcements",
  ],
  super_admin: ["/super-admin", "/users", "/flags", "/audit", "/settings", "/integrations"],
};

const publicPrefixes = ["/", "/login", "/signup", "/reset-password"];

function isPublicPath(pathname: string) {
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/") return true;
  return publicPrefixes.some((p) => p !== "/" && (pathname === p || pathname.startsWith(`${p}/`)));
}

function isAllowedForRole(role: Role, pathname: string) {
  const prefixes = roleAllowedPrefixes[role];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    const role = request.cookies.get("role")?.value as Role | undefined;
    if (role && (pathname === "/login" || pathname === "/signup" || pathname === "/reset-password")) {
      return NextResponse.redirect(new URL(roleHome[role] ?? "/", request.url));
    }
    return NextResponse.next();
  }

  const role = request.cookies.get("role")?.value as Role | undefined;
  if (!role || !(role in roleHome)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    role === "customer" &&
    request.cookies.get("first_login")?.value &&
    pathname.startsWith("/dashboard/customer") &&
    !(
      pathname === "/dashboard/customer/onboarding" ||
      pathname.startsWith("/dashboard/customer/onboarding/")
    )
  ) {
    return NextResponse.redirect(
      new URL("/dashboard/customer/onboarding", request.url),
    );
  }

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(roleHome[role], request.url));
  }

  if (!isAllowedForRole(role, pathname)) {
    return NextResponse.redirect(new URL(roleHome[role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
