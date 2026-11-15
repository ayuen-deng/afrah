export type Role =
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

export const roleLabels: Record<Role, string> = {
  customer: "Customer",
  customer_service_rep: "Customer Service",
  sales_executive: "Sales",
  head_of_design: "Design Head",
  designer: "Designer",
  operations_manager: "Operations",
  finance: "Finance",
  ceo: "CEO",
  technician: "Technician",
  internal_staff: "Staff",
  super_admin: "Super Admin",
};

export const roleHome: Record<Role, string> = {
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

export const roleSwitcherOptions: Array<{ role: Role; label: string; home: string }> = (
  Object.entries(roleLabels) as Array<[Role, string]>
).map(([role, label]) => ({
  role,
  label,
  home: roleHome[role],
}));

const aliasToRole: Record<string, Role> = {
  customer: "customer",
  "customer-service": "customer_service_rep",
  customer_service_rep: "customer_service_rep",
  sales: "sales_executive",
  sales_executive: "sales_executive",
  "design-head": "head_of_design",
  head_of_design: "head_of_design",
  designer: "designer",
  operations: "operations_manager",
  operations_manager: "operations_manager",
  finance: "finance",
  ceo: "ceo",
  technician: "technician",
  staff: "internal_staff",
  internal_staff: "internal_staff",
  "super-admin": "super_admin",
  super_admin: "super_admin",
};

export function inferRoleFromEmail(email: string): Role {
  const lower = email.trim().toLowerCase();

  const plusIdx = lower.indexOf("+");
  const atIdx = lower.lastIndexOf("@");
  if (plusIdx !== -1 && atIdx !== -1 && plusIdx < atIdx) {
    const tag = lower.slice(plusIdx + 1, atIdx).replaceAll(".", "_");
    const normalized = tag.replaceAll("__", "_");
    if (aliasToRole[normalized]) return aliasToRole[normalized];
    if (aliasToRole[tag]) return aliasToRole[tag];
  }

  const known: Record<string, Role> = {
    "diana@afrahmedia.ug": "customer_service_rep",
    "brian@afrahmedia.ug": "designer",
    "alex@afrahmedia.ug": "designer",
    "fatuma@afrahmedia.ug": "finance",
  };
  if (known[lower]) return known[lower];

  if (lower.includes("ceo")) return "ceo";
  if (lower.includes("finance")) return "finance";
  if (lower.includes("operations")) return "operations_manager";
  if (lower.includes("tech")) return "technician";

  return "customer";
}

export function inferRoleFromLabel(label: string): Role | null {
  const normalized = label.trim().toLowerCase();
  const entry = Object.entries(roleLabels).find(([, value]) => value.toLowerCase() === normalized);
  return entry ? (entry[0] as Role) : null;
}
