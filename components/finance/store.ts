"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  mockExpenses,
  mockFeatureFlags,
  mockInvoices,
  mockPayments,
  mockPayroll,
  mockPettyCash,
  mockRevenueChart,
} from "@/lib/mockData";

export type FinanceInvoice = (typeof mockInvoices)[number] & {
  status: "paid" | "unpaid" | "overdue" | "void";
  notes?: string;
};

export type FinancePayment = (typeof mockPayments)[number] & {
  matched?: boolean;
  gateway_status?: "completed" | "pending" | "failed";
};

export type FinanceExpense = (typeof mockExpenses)[number] & {
  status?: "logged" | "approved";
};

export type PettyCashTransaction = (typeof mockPettyCash.transactions)[number] & {
  type: "withdrawal" | "replenishment";
  status?: "completed" | "pending";
};

export type QuickbooksQueueItem = {
  id: string;
  type: string;
  label: string;
  status: "pending" | "syncing" | "synced";
};

export type QuickbooksLogItem = {
  id: string;
  date: string;
  label: string;
  result: "success" | "warning";
};

const EVENT = "afrah_finance_store_updated";

const keys = {
  invoices: "afrah_finance_invoices",
  payments: "afrah_finance_payments",
  expenses: "afrah_finance_expenses",
  pettyCash: "afrah_finance_petty_cash",
  payroll: "afrah_finance_payroll",
  quickbooks: "afrah_finance_quickbooks",
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

function seedInvoices(): FinanceInvoice[] {
  return [
    ...mockInvoices.map((invoice) => ({
      ...invoice,
      status: invoice.status as FinanceInvoice["status"],
    })),
    {
      id: "inv-005",
      number: "INV-2024-0005",
      customer: "Roofings Group",
      company: "Roofings Group",
      customer_photo: "https://picsum.photos/seed/roofings/100/100",
      booking_ref: "BK-2024-0005",
      screen: "Kampala Road Screen",
      subtotal: 1542373,
      vat: 277627,
      total: 1820000,
      status: "paid",
      due_date: "04/04/2024",
      paid_at: "04/04/2024",
      method: "Airtel Money",
      reference: "AIR-442901",
    },
  ];
}

function seedPayments(): FinancePayment[] {
  return [
    ...mockPayments.map((payment) => ({
      ...payment,
      matched: true,
      gateway_status: "completed" as const,
    })),
    {
      id: "pay-003",
      date: "04/04/2024",
      customer: "Roofings Group",
      booking_ref: "BK-2024-0005",
      method: "Airtel Money",
      amount: 1820000,
      reference: "AIR-442901",
      status: "completed",
      matched: false,
      gateway_status: "pending",
    },
  ];
}

function seedExpenses(): FinanceExpense[] {
  return [
    ...mockExpenses.map((expense) => ({ ...expense, status: "approved" as const })),
    {
      id: "exp-004",
      date: "03/04/2024",
      category: "Fuel",
      dept: "Operations",
      description: "Toyota Hiace field visit fuel",
      amount: 165000,
      receipt: true,
      synced: false,
      status: "logged",
    },
    {
      id: "exp-005",
      date: "04/04/2024",
      category: "Internet",
      dept: "Operations",
      description: "Monthly fiber subscription",
      amount: 220000,
      receipt: true,
      synced: true,
      status: "approved",
    },
  ];
}

function seedPettyCash() {
  return {
    balance: mockPettyCash.balance,
    transactions: mockPettyCash.transactions.map((transaction) => ({
      ...transaction,
      type: "withdrawal" as const,
      status: "completed" as const,
    })) as PettyCashTransaction[],
    replenishments: [
      {
        id: "rep-001",
        date: "01/03/2024",
        amount: 500000,
        reason: "Monthly restock",
        status: "approved",
      },
    ],
  };
}

function seedQuickbooks() {
  return {
    connected: false,
    queue: [
      { id: "qbq-001", type: "Invoice", label: "INV-2024-0003", status: "pending" as const },
      { id: "qbq-002", type: "Expense", label: "April office rent", status: "pending" as const },
      { id: "qbq-003", type: "Payroll", label: "April payroll draft", status: "pending" as const },
    ] as QuickbooksQueueItem[],
    logs: [
      { id: "qbl-001", date: "04/04/2024 00:00", label: "Nightly sync", result: "success" as const },
      { id: "qbl-002", date: "03/04/2024 18:30", label: "Invoice export", result: "warning" as const },
    ] as QuickbooksLogItem[],
    mappings: [
      { id: "map-001", label: "Rent", mappedTo: "Office Rent" },
      { id: "map-002", label: "Utilities", mappedTo: "Utilities Expense" },
      { id: "map-003", label: "Payroll", mappedTo: "Salaries & Wages" },
    ],
    autoSync: {
      invoices: true,
      expenses: true,
      payroll: false,
    },
    featureEnabled: mockFeatureFlags.find((flag) => flag.name === "quickbooks_sync")?.enabled ?? true,
  };
}

export function seedFinanceStore() {
  if (!window.localStorage.getItem(keys.invoices)) {
    writeJSON(keys.invoices, seedInvoices());
  }
  if (!window.localStorage.getItem(keys.payments)) {
    writeJSON(keys.payments, seedPayments());
  }
  if (!window.localStorage.getItem(keys.expenses)) {
    writeJSON(keys.expenses, seedExpenses());
  }
  if (!window.localStorage.getItem(keys.pettyCash)) {
    writeJSON(keys.pettyCash, seedPettyCash());
  }
  if (!window.localStorage.getItem(keys.payroll)) {
    writeJSON(keys.payroll, mockPayroll);
  }
  if (!window.localStorage.getItem(keys.quickbooks)) {
    writeJSON(keys.quickbooks, seedQuickbooks());
  }
}

export const financeStore = {
  eventName: EVENT,
  seed: seedFinanceStore,
  readInvoices: () => readJSON<FinanceInvoice[]>(keys.invoices, seedInvoices()),
  writeInvoices: (value: FinanceInvoice[]) => writeJSON(keys.invoices, value),
  readPayments: () => readJSON<FinancePayment[]>(keys.payments, seedPayments()),
  writePayments: (value: FinancePayment[]) => writeJSON(keys.payments, value),
  readExpenses: () => readJSON<FinanceExpense[]>(keys.expenses, seedExpenses()),
  writeExpenses: (value: FinanceExpense[]) => writeJSON(keys.expenses, value),
  readPettyCash: () => readJSON<any>(keys.pettyCash, seedPettyCash()),
  writePettyCash: (value: any) => writeJSON(keys.pettyCash, value),
  readPayroll: () => readJSON<any[]>(keys.payroll, mockPayroll),
  writePayroll: (value: any[]) => writeJSON(keys.payroll, value),
  readQuickbooks: () => readJSON<any>(keys.quickbooks, seedQuickbooks()),
  writeQuickbooks: (value: any) => writeJSON(keys.quickbooks, value),
  revenueChart: mockRevenueChart,
};

export function makeFinanceId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function calculatePayrollNet(row: any) {
  return row.basic + row.allowances + row.bonuses - row.nssf_emp - row.paye - row.deductions - row.advances_deduction;
}

export function getFinanceDashboardStats() {
  const invoices = financeStore.readInvoices();
  const expenses = financeStore.readExpenses();
  const pettyCash = financeStore.readPettyCash();
  const payments = financeStore.readPayments();

  return {
    revenueMonth: 9260000,
    estVat: 1666800,
    pendingReceivables: invoices.filter((invoice) => invoice.status === "unpaid" || invoice.status === "overdue").reduce((sum, invoice) => sum + invoice.total, 0),
    pettyCashBalance: pettyCash.balance,
    unpaidCount: invoices.filter((invoice) => invoice.status === "unpaid" || invoice.status === "overdue").length,
    paidCount: invoices.filter((invoice) => invoice.status === "paid").length,
    expenseMonth: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    paymentCount: payments.length,
  };
}
