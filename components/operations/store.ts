"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  mockAssets,
  mockEmployees,
  mockJobPositions,
  mockOffboarding,
  mockOnboarding,
  mockPayroll,
  mockPulseSurvey,
  mockRecognition,
  mockScreenAssets,
  mockTrainingPrograms,
} from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";

type EmployeeStatus = "active" | "onboarding" | "on_leave" | "dismissed";
type LeaveStatus = "pending" | "approved" | "rejected";
type ReviewStatus = "completed" | "due_soon" | "overdue";

export type OperationsEmployee = (typeof mockEmployees)[number] & {
  status: EmployeeStatus;
};

export type LeaveRequest = {
  id: string;
  employee_id: string;
  employee: string;
  dept: string;
  type: "Annual" | "Sick" | "Emergency";
  start: string;
  end: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  rejection_reason?: string;
};

export type AttendanceEntry = {
  id: string;
  employee_id: string;
  employee: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  hours: string;
  overtime?: string;
  status: "Present" | "Late" | "Early" | "Field" | "On Leave";
  notes?: string;
};

export type ReviewItem = {
  id: string;
  employee_id: string;
  employee: string;
  type: string;
  period: string;
  status: ReviewStatus;
  rating?: number;
  due_in_days?: number;
  wins?: string;
  improvements?: string;
  recommendation?: string;
  goals?: string;
};

export type SalaryAdvance = {
  id: string;
  employee_id: string;
  employee: string;
  amount: number;
  repaid: number;
  remaining: number;
  reason: string;
  schedule: Array<{ month: string; amount: number; status: "paid" | "pending" }>;
  status: "approved" | "pending";
};

export type SalaryHistory = {
  id: string;
  employee_id: string;
  employee: string;
  previous_salary: number;
  new_salary: number;
  reason: string;
  date: string;
};

export type TrainingRequest = {
  id: string;
  employee_id: string;
  employee: string;
  title: string;
  status: "pending" | "approved" | "rejected";
};

export type OfficeInventoryItem = {
  id: string;
  name: string;
  category: string;
  location: string;
  condition: "good" | "fair" | "damaged";
  purchased: string;
};

export type OfficeMaintenanceItem = {
  id: string;
  issue: string;
  location: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Resolved";
  assigned_to?: string;
  cost?: number;
};

export type VendorItem = {
  id: string;
  name: string;
  service: string;
  contact: string;
  phone: string;
  costs: number[];
};

export type UtilityBill = {
  id: string;
  month: string;
  electricity: number;
  water: number;
  internet: number;
  rent: number;
};

export type ScreenFault = {
  id: string;
  screen_id: string;
  screen: string;
  priority: "URGENT" | "Medium" | "Low";
  issue: string;
  photo: string;
  assigned_to?: string;
  updates: Array<{ time: string; text: string }>;
};

export type ScreenMaintenanceItem = {
  id: string;
  screen_id: string;
  screen: string;
  date: string;
  work: string;
  cost: number;
  done_by: string;
  next: string;
};

export type RegistryAsset = (typeof mockAssets)[number] & {
  status: "assigned" | "available" | "maintenance";
};

export type AssetAssignmentHistory = {
  id: string;
  asset_id: string;
  employee: string;
  date: string;
  notes: string;
  acknowledged?: boolean;
};

export type EngagementAlert = {
  id: string;
  employee: string;
  text: string;
};

const EVENT = "afrah_ops_store_updated";

const keys = {
  employees: "afrah_ops_employees",
  leaveRequests: "afrah_ops_leave_requests",
  attendance: "afrah_ops_attendance",
  reviews: "afrah_ops_reviews",
  payroll: "afrah_ops_payroll",
  advances: "afrah_ops_advances",
  salaryHistory: "afrah_ops_salary_history",
  trainingPrograms: "afrah_ops_training_programs",
  trainingRequests: "afrah_ops_training_requests",
  onboarding: "afrah_ops_onboarding",
  offboarding: "afrah_ops_offboarding",
  officeInventory: "afrah_ops_office_inventory",
  officeMaintenance: "afrah_ops_office_maintenance",
  vendors: "afrah_ops_vendors",
  utilities: "afrah_ops_utilities",
  screenAssets: "afrah_ops_screen_assets",
  screenFaults: "afrah_ops_screen_faults",
  screenMaintenance: "afrah_ops_screen_maintenance",
  assets: "afrah_ops_assets",
  assetHistory: "afrah_ops_asset_history",
  jobPositions: "afrah_ops_job_positions",
  engagementAlerts: "afrah_ops_engagement_alerts",
  leavePolicy: "afrah_ops_leave_policy",
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

function seedEmployees(): OperationsEmployee[] {
  return mockEmployees.map((employee) => ({
    ...employee,
    status: employee.status as EmployeeStatus,
  }));
}

function seedLeaveRequests(): LeaveRequest[] {
  return [
    {
      id: "leave-001",
      employee_id: "emp-001",
      employee: "Brian Kato",
      dept: "Design",
      type: "Annual",
      start: "15/04/2024",
      end: "19/04/2024",
      days: 5,
      reason: "Family travel",
      status: "pending",
    },
    {
      id: "leave-002",
      employee_id: "emp-005",
      employee: "Diana Auma",
      dept: "Customer Service",
      type: "Sick",
      start: "05/04/2024",
      end: "05/04/2024",
      days: 1,
      reason: "Medical review",
      status: "approved",
    },
    {
      id: "leave-003",
      employee_id: "emp-003",
      employee: "Fatuma Namutebi",
      dept: "Finance",
      type: "Annual",
      start: "22/04/2024",
      end: "26/04/2024",
      days: 5,
      reason: "Personal break",
      status: "rejected",
      rejection_reason: "Month-end reporting period",
    },
  ];
}

function seedAttendance(): AttendanceEntry[] {
  return [
    {
      id: "att-001",
      employee_id: "emp-001",
      employee: "Brian Kato",
      date: "04/04/2024",
      check_in: "08:02",
      check_out: "17:47",
      hours: "9h 45m",
      overtime: "1h 45m",
      status: "Early",
      notes: "On time and finished campaign prep.",
    },
    {
      id: "att-002",
      employee_id: "emp-002",
      employee: "Alex Mugisha",
      date: "04/04/2024",
      check_in: "08:45",
      check_out: "17:30",
      hours: "8h 45m",
      status: "Late",
    },
    {
      id: "att-003",
      employee_id: "emp-003",
      employee: "Fatuma Namutebi",
      date: "04/04/2024",
      check_in: "07:58",
      check_out: "18:15",
      hours: "10h 17m",
      status: "Present",
    },
    {
      id: "att-004",
      employee_id: "emp-004",
      employee: "Patrick Oryema",
      date: "04/04/2024",
      check_in: null,
      check_out: null,
      hours: "-",
      status: "Field",
    },
    {
      id: "att-005",
      employee_id: "emp-005",
      employee: "Diana Auma",
      date: "04/04/2024",
      check_in: null,
      check_out: null,
      hours: "-",
      status: "On Leave",
    },
  ];
}

function seedReviews(): ReviewItem[] {
  return [
    {
      id: "rev-001",
      employee_id: "emp-001",
      employee: "Brian Kato",
      type: "Q1 Quarterly",
      period: "Q1 2024",
      status: "completed",
      rating: 4.2,
      recommendation: "Meets Expectations",
      wins: "Delivered key creative campaigns.",
      improvements: "Keep building 3D animation skills.",
      goals: "Own two large motion projects in Q2.",
    },
    {
      id: "rev-002",
      employee_id: "emp-002",
      employee: "Alex Mugisha",
      type: "Probation Review",
      period: "April 2024",
      status: "due_soon",
      due_in_days: 24,
    },
    {
      id: "rev-003",
      employee_id: "emp-004",
      employee: "Patrick Oryema",
      type: "March Monthly",
      period: "March 2024",
      status: "overdue",
    },
  ];
}

function seedAdvances(): SalaryAdvance[] {
  return [
    {
      id: "adv-001",
      employee_id: "emp-004",
      employee: "Patrick Oryema",
      amount: 150000,
      repaid: 50000,
      remaining: 100000,
      reason: "Emergency transport support",
      status: "approved",
      schedule: [
        { month: "April", amount: 50000, status: "paid" },
        { month: "May", amount: 50000, status: "pending" },
        { month: "June", amount: 50000, status: "pending" },
      ],
    },
  ];
}

function seedTrainingRequests(): TrainingRequest[] {
  return [
    {
      id: "tr-req-001",
      employee_id: "emp-001",
      employee: "Brian Kato",
      title: "Adobe After Effects Advanced",
      status: "pending",
    },
  ];
}

function seedOfficeInventory(): OfficeInventoryItem[] {
  return [
    { id: "off-inv-001", name: "HP LaserJet Printer", category: "Electronics", location: "Admin Office", condition: "good", purchased: "04/05/2023" },
    { id: "off-inv-002", name: "Reception Sofa", category: "Furniture", location: "Reception", condition: "good", purchased: "12/01/2024" },
    { id: "off-inv-003", name: "Design AC Unit", category: "Facilities", location: "Design Studio", condition: "damaged", purchased: "08/08/2022" },
    { id: "off-inv-004", name: "Conference TV", category: "Electronics", location: "Board Room", condition: "fair", purchased: "10/02/2023" },
    { id: "off-inv-005", name: "Desk Chair", category: "Furniture", location: "Finance", condition: "damaged", purchased: "07/11/2021" },
  ];
}

function seedOfficeMaintenance(): OfficeMaintenanceItem[] {
  return [
    {
      id: "maint-001",
      issue: "Broken AC",
      location: "Design Studio",
      priority: "Medium",
      status: "In Progress",
      assigned_to: "TechSupport UG",
    },
  ];
}

function seedVendors(): VendorItem[] {
  return [
    { id: "vendor-001", name: "Kampala Electricals", service: "Electrical", contact: "John Ssemanda", phone: "0700123456", costs: [150000, 200000, 120000] },
    { id: "vendor-002", name: "TechSupport UG", service: "Repairs", contact: "Joseph K.", phone: "0770123000", costs: [85000, 150000] },
    { id: "vendor-003", name: "Aqua Utilities", service: "Water", contact: "Sarah N.", phone: "0750000003", costs: [45000, 47000, 42000] },
  ];
}

function seedUtilities(): UtilityBill[] {
  return [
    { id: "util-001", month: "Jan", electricity: 220000, water: 38000, internet: 120000, rent: 1500000 },
    { id: "util-002", month: "Feb", electricity: 240000, water: 40000, internet: 120000, rent: 1500000 },
    { id: "util-003", month: "Mar", electricity: 280000, water: 42000, internet: 120000, rent: 1500000 },
  ];
}

function seedScreenFaults(): ScreenFault[] {
  return [
    {
      id: "fault-001",
      screen_id: "scr-002",
      screen: "Garden City Screen",
      priority: "URGENT",
      issue: "Display controller offline",
      photo: "https://picsum.photos/seed/fault1/640/400",
      updates: [],
    },
  ];
}

function seedScreenMaintenance(): ScreenMaintenanceItem[] {
  return [
    {
      id: "scr-maint-001",
      screen_id: "scr-001",
      screen: "Kampala Road Screen",
      date: "10/04/2024",
      work: "Annual panel cleaning",
      cost: 200000,
      done_by: "TechSupport UG",
      next: "10/10/2024",
    },
  ];
}

function seedAssets(): RegistryAsset[] {
  return [
    ...mockAssets.map((asset) => ({
      ...asset,
      status: asset.status as RegistryAsset["status"],
    })),
    {
      id: "ast-004",
      name: "Canon EOS Camera",
      category: "Cameras",
      serial: "CANON-001",
      photo: "https://picsum.photos/seed/ast4/400/300",
      purchased: "20/02/2024",
      value: 2200000,
      condition: "good",
      assigned_to: "Alex Mugisha",
      assigned_id: "emp-002",
      status: "assigned" as const,
      next_service: null,
    },
  ];
}

function seedAssetHistory(): AssetAssignmentHistory[] {
  return [
    { id: "hist-asset-001", asset_id: "ast-001", employee: "Patrick Oryema", date: "01/06/2023", notes: "Assigned for field operations", acknowledged: false },
    { id: "hist-asset-002", asset_id: "ast-002", employee: "Brian Kato", date: "15/01/2024", notes: "Creative workstation device", acknowledged: true },
    { id: "hist-asset-003", asset_id: "ast-004", employee: "Alex Mugisha", date: "21/02/2024", notes: "Photography and capture device", acknowledged: true },
  ];
}

function seedEngagementAlerts(): EngagementAlert[] {
  return [
    { id: "eng-001", employee: "Patrick Oryema", text: "2 consecutive Below ratings" },
  ];
}

function seedLeavePolicy() {
  return { annual: 21, sick: 10, emergency: 3 };
}

export function seedOperationsStore() {
  if (!window.localStorage.getItem(keys.employees)) {
    writeJSON(keys.employees, seedEmployees());
  }
  if (!window.localStorage.getItem(keys.leaveRequests)) {
    writeJSON(keys.leaveRequests, seedLeaveRequests());
  }
  if (!window.localStorage.getItem(keys.attendance)) {
    writeJSON(keys.attendance, seedAttendance());
  }
  if (!window.localStorage.getItem(keys.reviews)) {
    writeJSON(keys.reviews, seedReviews());
  }
  if (!window.localStorage.getItem(keys.payroll)) {
    writeJSON(keys.payroll, mockPayroll);
  }
  if (!window.localStorage.getItem(keys.advances)) {
    writeJSON(keys.advances, seedAdvances());
  }
  if (!window.localStorage.getItem(keys.salaryHistory)) {
    writeJSON(keys.salaryHistory, [] as SalaryHistory[]);
  }
  if (!window.localStorage.getItem(keys.trainingPrograms)) {
    writeJSON(keys.trainingPrograms, mockTrainingPrograms);
  }
  if (!window.localStorage.getItem(keys.trainingRequests)) {
    writeJSON(keys.trainingRequests, seedTrainingRequests());
  }
  if (!window.localStorage.getItem(keys.onboarding)) {
    writeJSON(keys.onboarding, mockOnboarding);
  }
  if (!window.localStorage.getItem(keys.offboarding)) {
    writeJSON(keys.offboarding, mockOffboarding);
  }
  if (!window.localStorage.getItem(keys.officeInventory)) {
    writeJSON(keys.officeInventory, seedOfficeInventory());
  }
  if (!window.localStorage.getItem(keys.officeMaintenance)) {
    writeJSON(keys.officeMaintenance, seedOfficeMaintenance());
  }
  if (!window.localStorage.getItem(keys.vendors)) {
    writeJSON(keys.vendors, seedVendors());
  }
  if (!window.localStorage.getItem(keys.utilities)) {
    writeJSON(keys.utilities, seedUtilities());
  }
  if (!window.localStorage.getItem(keys.screenAssets)) {
    writeJSON(keys.screenAssets, mockScreenAssets);
  }
  if (!window.localStorage.getItem(keys.screenFaults)) {
    writeJSON(keys.screenFaults, seedScreenFaults());
  }
  if (!window.localStorage.getItem(keys.screenMaintenance)) {
    writeJSON(keys.screenMaintenance, seedScreenMaintenance());
  }
  if (!window.localStorage.getItem(keys.assets)) {
    writeJSON(keys.assets, seedAssets());
  }
  if (!window.localStorage.getItem(keys.assetHistory)) {
    writeJSON(keys.assetHistory, seedAssetHistory());
  }
  if (!window.localStorage.getItem(keys.jobPositions)) {
    writeJSON(keys.jobPositions, mockJobPositions);
  }
  if (!window.localStorage.getItem(keys.engagementAlerts)) {
    writeJSON(keys.engagementAlerts, seedEngagementAlerts());
  }
  if (!window.localStorage.getItem(keys.leavePolicy)) {
    writeJSON(keys.leavePolicy, seedLeavePolicy());
  }
}

export const operationsStore = {
  eventName: EVENT,
  seed: seedOperationsStore,
  readEmployees: () => readJSON<OperationsEmployee[]>(keys.employees, seedEmployees()),
  writeEmployees: (value: OperationsEmployee[]) => writeJSON(keys.employees, value),
  readLeaveRequests: () => readJSON<LeaveRequest[]>(keys.leaveRequests, seedLeaveRequests()),
  writeLeaveRequests: (value: LeaveRequest[]) => writeJSON(keys.leaveRequests, value),
  readAttendance: () => readJSON<AttendanceEntry[]>(keys.attendance, seedAttendance()),
  writeAttendance: (value: AttendanceEntry[]) => writeJSON(keys.attendance, value),
  readReviews: () => readJSON<ReviewItem[]>(keys.reviews, seedReviews()),
  writeReviews: (value: ReviewItem[]) => writeJSON(keys.reviews, value),
  readPayroll: () => readJSON<any[]>(keys.payroll, mockPayroll),
  writePayroll: (value: any[]) => writeJSON(keys.payroll, value),
  readAdvances: () => readJSON<SalaryAdvance[]>(keys.advances, seedAdvances()),
  writeAdvances: (value: SalaryAdvance[]) => writeJSON(keys.advances, value),
  readSalaryHistory: () => readJSON<SalaryHistory[]>(keys.salaryHistory, []),
  writeSalaryHistory: (value: SalaryHistory[]) => writeJSON(keys.salaryHistory, value),
  readTrainingPrograms: () => readJSON<any[]>(keys.trainingPrograms, mockTrainingPrograms),
  writeTrainingPrograms: (value: any[]) => writeJSON(keys.trainingPrograms, value),
  readTrainingRequests: () => readJSON<TrainingRequest[]>(keys.trainingRequests, seedTrainingRequests()),
  writeTrainingRequests: (value: TrainingRequest[]) => writeJSON(keys.trainingRequests, value),
  readOnboarding: () => readJSON<any[]>(keys.onboarding, mockOnboarding),
  writeOnboarding: (value: any[]) => writeJSON(keys.onboarding, value),
  readOffboarding: () => readJSON<any[]>(keys.offboarding, mockOffboarding),
  writeOffboarding: (value: any[]) => writeJSON(keys.offboarding, value),
  readOfficeInventory: () => readJSON<OfficeInventoryItem[]>(keys.officeInventory, seedOfficeInventory()),
  writeOfficeInventory: (value: OfficeInventoryItem[]) => writeJSON(keys.officeInventory, value),
  readOfficeMaintenance: () => readJSON<OfficeMaintenanceItem[]>(keys.officeMaintenance, seedOfficeMaintenance()),
  writeOfficeMaintenance: (value: OfficeMaintenanceItem[]) => writeJSON(keys.officeMaintenance, value),
  readVendors: () => readJSON<VendorItem[]>(keys.vendors, seedVendors()),
  writeVendors: (value: VendorItem[]) => writeJSON(keys.vendors, value),
  readUtilities: () => readJSON<UtilityBill[]>(keys.utilities, seedUtilities()),
  writeUtilities: (value: UtilityBill[]) => writeJSON(keys.utilities, value),
  readScreenAssets: () => readJSON<any[]>(keys.screenAssets, mockScreenAssets),
  writeScreenAssets: (value: any[]) => writeJSON(keys.screenAssets, value),
  readScreenFaults: () => readJSON<ScreenFault[]>(keys.screenFaults, seedScreenFaults()),
  writeScreenFaults: (value: ScreenFault[]) => writeJSON(keys.screenFaults, value),
  readScreenMaintenance: () => readJSON<ScreenMaintenanceItem[]>(keys.screenMaintenance, seedScreenMaintenance()),
  writeScreenMaintenance: (value: ScreenMaintenanceItem[]) => writeJSON(keys.screenMaintenance, value),
  readAssets: () => readJSON<RegistryAsset[]>(keys.assets, seedAssets()),
  writeAssets: (value: RegistryAsset[]) => writeJSON(keys.assets, value),
  readAssetHistory: () => readJSON<AssetAssignmentHistory[]>(keys.assetHistory, seedAssetHistory()),
  writeAssetHistory: (value: AssetAssignmentHistory[]) => writeJSON(keys.assetHistory, value),
  readJobPositions: () => readJSON<any[]>(keys.jobPositions, mockJobPositions),
  writeJobPositions: (value: any[]) => writeJSON(keys.jobPositions, value),
  readEngagementAlerts: () => readJSON<EngagementAlert[]>(keys.engagementAlerts, seedEngagementAlerts()),
  writeEngagementAlerts: (value: EngagementAlert[]) => writeJSON(keys.engagementAlerts, value),
  readLeavePolicy: () => readJSON<{ annual: number; sick: number; emergency: number }>(keys.leavePolicy, seedLeavePolicy()),
  writeLeavePolicy: (value: { annual: number; sick: number; emergency: number }) => writeJSON(keys.leavePolicy, value),
  pulseSurvey: mockPulseSurvey,
  recognition: mockRecognition,
};

export function getOperationsDashboardStats() {
  const employees = operationsStore.readEmployees();
  const leaveRequests = operationsStore.readLeaveRequests();
  const reviews = operationsStore.readReviews();
  const screenFaults = operationsStore.readScreenFaults();
  const assets = operationsStore.readAssets();
  const offboarding = operationsStore.readOffboarding();
  return {
    activeEmployees: employees.filter((employee) => employee.status === "active").length,
    onboarding: employees.filter((employee) => employee.status === "onboarding").length,
    onLeave: employees.filter((employee) => employee.status === "on_leave").length,
    reviewsOverdue: reviews.filter((review) => review.status === "overdue").length,
    leavePending: leaveRequests.filter((request) => request.status === "pending").length,
    officeIssues: operationsStore.readOfficeMaintenance().filter((item) => item.status !== "Resolved").length,
    screensOffline: screenFaults.length,
    assetServiceDue: assets.filter((asset) => asset.next_service === "10/04/2024").length,
    offboardingActive: offboarding.length,
  };
}

export function calculateNetPay(row: any) {
  const gross = row.basic + row.allowances + row.bonuses;
  const deductions = row.nssf_emp + row.paye + row.deductions + row.advances_deduction;
  return gross - deductions;
}

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatBudgetProgress(current: number, total: number) {
  const percent = total ? Math.round((current / total) * 100) : 0;
  return `${percent}%`;
}

export function salaryPreview(row: any) {
  const gross = row.basic + row.allowances + row.bonuses;
  const deductions = row.nssf_emp + row.paye + row.deductions + row.advances_deduction;
  return {
    gross,
    deductions,
    net: calculateNetPay(row),
    summary: `NET PAY: ${formatUGX(calculateNetPay(row))}`,
  };
}
