"use client";

import {
  mockCustomers,
  mockEmployees,
  mockFeatureFlags,
  mockSystemHealth,
} from "@/lib/mockData";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "suspended";
  lastLogin: string;
  photo?: string;
  initials: string;
  loginHistory: { id: string; date: string; device: string; location: string }[];
};

export type AdminFeatureFlag = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  roles: string[];
  updated: string;
};

export type AuditLogEntry = {
  id: string;
  time: string;
  user: string;
  role: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  table: string;
  changes: string;
  before: Record<string, string>;
  after: Record<string, string>;
  ip: string;
};

export type IntegrationItem = {
  id: string;
  name: string;
  status: "Connected" | "Disconnected";
  lastPing: string;
  detail: string;
  stats: string[];
};

export type ErrorLogItem = {
  id: string;
  message: string;
  user: string;
  page: string;
  time: string;
  frequency: number;
  severity: "low" | "medium" | "high";
};

export type SuperAdminSettings = {
  appName: string;
  logo: string;
  maxImageMb: number;
  maxVideoMb: number;
  acceptedFormats: string[];
  vatRate: number;
  gateways: {
    mtn: boolean;
    airtel: boolean;
    card: boolean;
  };
  maintenanceMode: boolean;
};

const EVENT = "afrah_super_admin_store_updated";

const keys = {
  users: "afrah_super_admin_users",
  flags: "afrah_super_admin_flags",
  audit: "afrah_super_admin_audit",
  settings: "afrah_super_admin_settings",
  integrations: "afrah_super_admin_integrations",
  errors: "afrah_super_admin_errors",
};

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  emit();
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function seedUsers(): AdminUser[] {
  return [
    {
      id: "usr-001",
      name: "Demo Principal",
      email: "demo@afrahmedia.ug",
      role: "ceo",
      status: "active",
      lastLogin: "04/04/2024 08:30",
      initials: "DP",
      loginHistory: [
        { id: "lh-001", date: "04/04/2024 08:30", device: "Chrome / Windows", location: "Nakasero" },
        { id: "lh-002", date: "03/04/2024 07:58", device: "Safari / iPhone", location: "Kololo" },
      ],
    },
    {
      id: "usr-002",
      name: "Fatuma Namutebi",
      email: "fatuma@afrahmedia.ug",
      role: "finance",
      status: "active",
      lastLogin: "04/04/2024 08:12",
      photo: mockEmployees[2]?.photo,
      initials: initials("Fatuma Namutebi"),
      loginHistory: [
        { id: "lh-003", date: "04/04/2024 08:12", device: "Chrome / Windows", location: "Nakasero" },
        { id: "lh-004", date: "03/04/2024 08:05", device: "Chrome / Windows", location: "Ntinda" },
      ],
    },
    {
      id: "usr-003",
      name: "Brian Kato",
      email: "brian@afrahmedia.ug",
      role: "designer",
      status: "active",
      lastLogin: "04/04/2024 08:45",
      photo: mockEmployees[0]?.photo,
      initials: initials("Brian Kato"),
      loginHistory: [
        { id: "lh-005", date: "04/04/2024 08:45", device: "Chrome / Windows", location: "Ntinda" },
        { id: "lh-006", date: "03/04/2024 09:01", device: "Chrome / Windows", location: "Ntinda" },
      ],
    },
    {
      id: "usr-004",
      name: "Sarah Nakato",
      email: "sarah@gmail.com",
      role: "customer",
      status: "active",
      lastLogin: "04/04/2024 14:03",
      photo: mockCustomers[2]?.photo,
      initials: initials("Sarah Nakato"),
      loginHistory: [
        { id: "lh-007", date: "04/04/2024 14:03", device: "Chrome / Windows", location: "Kampala" },
        { id: "lh-008", date: "03/04/2024 19:33", device: "Chrome / Android", location: "Kampala" },
      ],
    },
    {
      id: "usr-005",
      name: "Robert Ssemakula",
      email: "robert@pearldairy.co.ug",
      role: "customer",
      status: "active",
      lastLogin: "04/04/2024 09:28",
      photo: mockCustomers[0]?.photo,
      initials: initials("Robert Ssemakula"),
      loginHistory: [
        { id: "lh-009", date: "04/04/2024 09:28", device: "Edge / Windows", location: "Kampala" },
        { id: "lh-010", date: "02/04/2024 11:10", device: "Chrome / Windows", location: "Mukono" },
      ],
    },
  ];
}

function seedFlags(): AdminFeatureFlag[] {
  return mockFeatureFlags.map((flag) => ({
    ...flag,
    roles: flag.roles,
  }));
}

function seedAudit(): AuditLogEntry[] {
  return [
    {
      id: "audit-001",
      time: "04/04/2024 14:32",
      user: "Fatuma Namutebi",
      role: "finance",
      action: "UPDATE",
      table: "invoices",
      changes: "status: unpaid → paid",
      before: { status: "unpaid" },
      after: { status: "paid" },
      ip: "197.157.x.x",
    },
    {
      id: "audit-002",
      time: "01/04/2024 09:10",
      user: "Demo Principal",
      role: "ceo",
      action: "CREATE",
      table: "announcements",
      changes: "Q2 Revenue Target",
      before: {},
      after: { title: "Q2 Revenue Target Update" },
      ip: "197.157.x.x",
    },
    {
      id: "audit-003",
      time: "04/04/2024 10:12",
      user: "Brian Kato",
      role: "designer",
      action: "UPDATE",
      table: "tasks",
      changes: "to_do → in_progress",
      before: { status: "to_do" },
      after: { status: "in_progress" },
      ip: "154.72.x.x",
    },
    {
      id: "audit-004",
      time: "03/04/2024 15:48",
      user: "Demo Principal",
      role: "ceo",
      action: "UPDATE",
      table: "pricing_rules",
      changes: "1.5 → 1.6",
      before: { cbd_multiplier: "1.5" },
      after: { cbd_multiplier: "1.6" },
      ip: "197.157.x.x",
    },
    {
      id: "audit-005",
      time: "01/04/2024 08:05",
      user: "Fatuma Namutebi",
      role: "finance",
      action: "CREATE",
      table: "expenses",
      changes: "Rent 1,500,000",
      before: {},
      after: { category: "Rent", amount: "1500000" },
      ip: "197.157.x.x",
    },
  ];
}

function seedSettings(): SuperAdminSettings {
  return {
    appName: "Afrah Media",
    logo: "Afrah Media mark",
    maxImageMb: 100,
    maxVideoMb: 100,
    acceptedFormats: ["JPG", "PNG", "MP4", "MOV"],
    vatRate: 18,
    gateways: {
      mtn: true,
      airtel: true,
      card: true,
    },
    maintenanceMode: false,
  };
}

function seedIntegrations(): IntegrationItem[] {
  return [
    {
      id: "int-001",
      name: "QuickBooks Online",
      status: "Connected",
      lastPing: "04/04/2024 00:00",
      detail: "Accounting sync for invoices, expenses, and payroll.",
      stats: ["Items synced: 3", "Last sync: 04/04/2024 00:00"],
    },
    {
      id: "int-002",
      name: "Africa's Talking",
      status: "Connected",
      lastPing: "04/04/2024 08:00",
      detail: "SMS gateway for alerts and customer reminders.",
      stats: ["API credits: 8,432 SMS remaining", "Region: Uganda"],
    },
    {
      id: "int-003",
      name: "Pesapal",
      status: "Connected",
      lastPing: "04/04/2024 08:04",
      detail: "Card checkout routing for direct customer payments.",
      stats: ["Settlement status: Healthy", "Webhook latency: 221ms"],
    },
    {
      id: "int-004",
      name: "MTN MoMo",
      status: "Connected",
      lastPing: "04/04/2024 08:10",
      detail: "MTN mobile money collection and payment confirmations.",
      stats: ["Successful requests: 98.4%", "Pending callbacks: 2"],
    },
    {
      id: "int-005",
      name: "Airtel Money",
      status: "Connected",
      lastPing: "04/04/2024 08:08",
      detail: "Airtel Money checkout integration.",
      stats: ["Successful requests: 97.8%", "Timeout alerts: 1"],
    },
    {
      id: "int-006",
      name: "Mapbox",
      status: "Connected",
      lastPing: "04/04/2024 07:59",
      detail: "Map rendering for screen locations and field routing.",
      stats: ["Map loads today: 184", "Average render: 381ms"],
    },
  ];
}

function seedErrors(): ErrorLogItem[] {
  return [
    {
      id: "err-001",
      message: "TypeError: Cannot read property 'total' of undefined",
      user: "Fatuma Namutebi",
      page: "/dashboard/finance",
      time: "04/04/2024 14:32",
      frequency: 3,
      severity: "high",
    },
    {
      id: "err-002",
      message: "Payment webhook timeout on MTN confirmation retry",
      user: "System",
      page: "/api/payments/mtn",
      time: "04/04/2024 12:18",
      frequency: 2,
      severity: "medium",
    },
    {
      id: "err-003",
      message: "Map tile load stalled for Garden City screen health view",
      user: "Demo Principal",
      page: "/map",
      time: "04/04/2024 11:45",
      frequency: 1,
      severity: "low",
    },
    {
      id: "err-004",
      message: "Feature flag cache refresh delayed by 4 seconds",
      user: "System",
      page: "/flags",
      time: "04/04/2024 10:09",
      frequency: 1,
      severity: "low",
    },
    {
      id: "err-005",
      message: "Payroll export row mismatch detected and auto-retried",
      user: "Fatuma Namutebi",
      page: "/payroll",
      time: "04/04/2024 09:17",
      frequency: 1,
      severity: "medium",
    },
  ];
}

export function seedSuperAdminStore() {
  if (!window.localStorage.getItem(keys.users)) {
    writeJSON(keys.users, seedUsers());
  }
  if (!window.localStorage.getItem(keys.flags)) {
    writeJSON(keys.flags, seedFlags());
  }
  if (!window.localStorage.getItem(keys.audit)) {
    writeJSON(keys.audit, seedAudit());
  }
  if (!window.localStorage.getItem(keys.settings)) {
    writeJSON(keys.settings, seedSettings());
  }
  if (!window.localStorage.getItem(keys.integrations)) {
    writeJSON(keys.integrations, seedIntegrations());
  }
  if (!window.localStorage.getItem(keys.errors)) {
    writeJSON(keys.errors, seedErrors());
  }
}

export const superAdminStore = {
  eventName: EVENT,
  seed: seedSuperAdminStore,
  readUsers: () => readJSON<AdminUser[]>(keys.users, seedUsers()),
  writeUsers: (value: AdminUser[]) => writeJSON(keys.users, value),
  readFlags: () => readJSON<AdminFeatureFlag[]>(keys.flags, seedFlags()),
  writeFlags: (value: AdminFeatureFlag[]) => writeJSON(keys.flags, value),
  readAuditLogs: () => readJSON<AuditLogEntry[]>(keys.audit, seedAudit()),
  writeAuditLogs: (value: AuditLogEntry[]) => writeJSON(keys.audit, value),
  readSettings: () => readJSON<SuperAdminSettings>(keys.settings, seedSettings()),
  writeSettings: (value: SuperAdminSettings) => writeJSON(keys.settings, value),
  readIntegrations: () => readJSON<IntegrationItem[]>(keys.integrations, seedIntegrations()),
  writeIntegrations: (value: IntegrationItem[]) => writeJSON(keys.integrations, value),
  readErrors: () => readJSON<ErrorLogItem[]>(keys.errors, seedErrors()),
  writeErrors: (value: ErrorLogItem[]) => writeJSON(keys.errors, value),
  readSystemHealth: () => ({
    ...mockSystemHealth,
    uptime_pct: 99.8,
    avg_response_ms: 284,
    activeUsers: ["Demo Principal (CEO)", "Fatuma (Finance)", "Brian (Designer)"],
    databaseBreakdown: [
      { label: "profiles", value: "0.2MB" },
      { label: "bookings", value: "0.8MB" },
      { label: "ads", value: "0.6MB" },
      { label: "invoices", value: "0.4MB" },
    ],
    storageBreakdown: [
      { label: "/ads", value: "8.2GB" },
      { label: "/invoices", value: "1.1GB" },
      { label: "/assets", value: "2.4GB" },
    ],
  }),
};
