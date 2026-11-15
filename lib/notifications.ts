import { inferRoleFromLabel, type Role } from "@/lib/roles";

export type NotificationRoleKey =
  | "customer"
  | "customer_service"
  | "sales"
  | "head_of_design"
  | "designer"
  | "operations"
  | "finance"
  | "ceo"
  | "technician"
  | "staff"
  | "super_admin";

export type NotificationPriority = "normal" | "high";

export type NotificationType =
  | "booking"
  | "payment"
  | "campaign"
  | "broadcast"
  | "ad_review"
  | "rejection"
  | "task"
  | "revision"
  | "hr"
  | "alert"
  | "system"
  | "recognition"
  | "announcement"
  | "invoice"
  | "commission"
  | "lead"
  | "expense"
  | "payroll"
  | "reminder"
  | "approval"
  | "kpi"
  | "user"
  | "integration"
  | "fault"
  | "asset"
  | "query"
  | "quote"
  | "screen";

export type NotificationRecord = {
  id: string;
  role: NotificationRoleKey;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  time: string;
  date: string;
  read: boolean;
  link: string;
  meta: string[];
  broadcastId?: string;
};

export type BroadcastPriority = "normal" | "important" | "urgent";

export type BroadcastRecord = {
  id: string;
  sender: string;
  senderRole: "CEO" | "Operations Manager";
  senderInitials: string;
  senderColor: string;
  senderPhoto: string;
  subject: string;
  body: string;
  priority: BroadcastPriority;
  recipients: "all" | "selected";
  recipientRoles: NotificationRoleKey[];
  sentAt: string;
  timeAgo: string;
  readBy: string[];
  totalRecipients: number;
  readCount: number;
  readRate: number;
};

export const typeLabels: Record<NotificationType, string> = {
  booking: "Bookings",
  payment: "Payments",
  campaign: "Campaigns",
  broadcast: "Broadcasts",
  ad_review: "Ad Review",
  rejection: "Rejections",
  task: "Tasks",
  revision: "Revisions",
  hr: "HR",
  alert: "Alerts",
  system: "System",
  recognition: "Recognition",
  announcement: "Announcements",
  invoice: "Invoices",
  commission: "Commissions",
  lead: "Leads",
  expense: "Expenses",
  payroll: "Payroll",
  reminder: "Reminders",
  approval: "Approvals",
  kpi: "KPIs",
  user: "Users",
  integration: "Integrations",
  fault: "Faults",
  asset: "Assets",
  query: "Queries",
  quote: "Quotes",
  screen: "Screens",
};

export const roleNotificationTypes: Record<NotificationRoleKey, NotificationType[]> = {
  customer: ["booking", "payment", "campaign", "invoice", "quote", "screen"],
  customer_service: ["query", "booking", "payment", "campaign", "alert", "broadcast", "reminder"],
  sales: ["lead", "quote", "commission", "campaign", "alert", "broadcast"],
  head_of_design: ["ad_review", "task", "revision", "alert", "broadcast"],
  designer: ["task", "revision", "hr", "recognition", "broadcast"],
  operations: ["hr", "alert", "system", "fault", "asset", "broadcast"],
  finance: ["payment", "invoice", "expense", "payroll", "alert", "broadcast"],
  ceo: ["approval", "alert", "campaign", "system", "kpi", "broadcast"],
  technician: ["task", "fault", "broadcast"],
  staff: ["hr", "asset", "payroll", "announcement", "broadcast"],
  super_admin: ["system", "alert", "user", "integration", "broadcast"],
};

export const notificationRolePaths: Record<NotificationRoleKey, string> = {
  customer: "/dashboard/customer/notifications",
  customer_service: "/dashboard/customer-service/notifications",
  sales: "/dashboard/sales/notifications",
  head_of_design: "/dashboard/design-head/notifications",
  designer: "/dashboard/designer/notifications",
  operations: "/dashboard/operations/notifications",
  finance: "/dashboard/finance/notifications",
  ceo: "/dashboard/ceo/notifications",
  technician: "/dashboard/technician/notifications",
  staff: "/dashboard/staff/notifications",
  super_admin: "/super-admin/notifications",
};

const roleToNotificationRoleKey: Record<Role, NotificationRoleKey> = {
  customer: "customer",
  customer_service_rep: "customer_service",
  sales_executive: "sales",
  head_of_design: "head_of_design",
  designer: "designer",
  operations_manager: "operations",
  finance: "finance",
  ceo: "ceo",
  technician: "technician",
  internal_staff: "staff",
  super_admin: "super_admin",
};

export function getNotificationRoleKeyFromLabel(roleLabel?: string): NotificationRoleKey | null {
  if (!roleLabel) return null;
  const role = inferRoleFromLabel(roleLabel);
  return role ? roleToNotificationRoleKey[role] : null;
}

export function getNotificationPath(roleKey: NotificationRoleKey | null | undefined) {
  return roleKey ? notificationRolePaths[roleKey] : "/notifications";
}

export function getNotificationsForRole(notifications: NotificationRecord[], role: NotificationRoleKey) {
  const allowedTypes = new Set(roleNotificationTypes[role]);
  return notifications.filter((notification) => allowedTypes.has(notification.type));
}

export function getTypeFiltersForRole(role: NotificationRoleKey) {
  return roleNotificationTypes[role].map((type) => ({
    value: type,
    label: typeLabels[type],
  }));
}

export type NotificationCategory =
  | "all"
  | "bookings"
  | "payments"
  | "campaigns"
  | "hr"
  | "system"
  | "alerts";

export const notificationCategoryOptions: Array<{ value: NotificationCategory; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "bookings", label: "Bookings" },
  { value: "payments", label: "Payments" },
  { value: "campaigns", label: "Campaigns" },
  { value: "hr", label: "HR" },
  { value: "system", label: "System" },
  { value: "alerts", label: "Alerts" },
];

export function getNotificationGroupLabel(group: string) {
  const normalized = group.trim().toLowerCase();
  if (normalized === "today") return "Today";
  if (normalized === "yesterday") return "Yesterday";
  if (normalized === "earlier") return "Earlier";
  return group;
}

export function matchesNotificationCategory(
  notification: NotificationRecord,
  category: NotificationCategory,
) {
  if (category === "all") return true;

  const type = notification.type;
  if (category === "bookings") {
    return ["booking", "quote", "screen"].includes(type);
  }
  if (category === "payments") {
    return ["payment", "invoice", "commission"].includes(type);
  }
  if (category === "campaigns") {
    return ["campaign", "ad_review", "rejection", "task", "query"].includes(type);
  }
  if (category === "hr") {
    return ["hr", "asset"].includes(type);
  }
  if (category === "system") {
    return ["system", "recognition", "announcement"].includes(type);
  }
  if (category === "alerts") {
    return ["alert", "fault"].includes(type);
  }

  return true;
}
