"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  mockAnnouncements,
  mockApprovals,
  mockBookings,
  mockCustomers,
  mockFeatureFlags,
  mockKPIs,
  mockRevenueChart,
  mockScreenAssets,
  mockScreens,
} from "@/lib/mockData";

const EVENT = "afrah_ceo_store_updated";

const keys = {
  approvals: "afrah_ceo_approvals",
  kpis: "afrah_ceo_kpis",
  announcements: "afrah_ceo_announcements",
  pricing: "afrah_ceo_pricing",
  thresholds: "afrah_ceo_thresholds",
  discounts: "afrah_ceo_discounts",
  company: "afrah_ceo_company",
  screens: "afrah_ceo_screens",
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

function seedPricing() {
  return [
    { id: "rule-001", label: "CBD Multiplier", value: 1.5 },
    { id: "rule-002", label: "Prime Time", value: 1.8 },
    { id: "rule-003", label: "Weekend", value: 1.25 },
    { id: "rule-004", label: "Outskirts", value: 0.9 },
    { id: "rule-005", label: "Suburban", value: 1.1 },
    { id: "rule-006", label: "Duration 24h+", value: 0.92 },
    { id: "rule-007", label: "Duration 7d+", value: 0.85 },
    { id: "rule-008", label: "Political Review", value: 1.4 },
    { id: "rule-009", label: "Holiday Surge", value: 1.35 },
    { id: "rule-010", label: "Bulk Booking", value: 0.88 },
  ];
}

function seedThresholds() {
  return {
    offline_alert_minutes: 15,
    failed_payments_alert: 2,
    screen_uptime_target: 99,
    invoice_overdue_days: 7,
  };
}

function seedDiscounts() {
  return [
    { id: "disc-001", name: "VIP Client", percent: 10, active: true },
    { id: "disc-002", name: "First Booking", percent: 5, active: true },
    { id: "disc-003", name: "NGO Rate", percent: 12, active: false },
  ];
}

function seedCompany() {
  return {
    name: "Afrah Media",
    vat_rate: 18,
    contact: "demo@afrahmedia.ug",
    address: "Nakasero, Kampala",
    maintenance_mode: false,
  };
}

function seedAnnouncements() {
  return mockAnnouncements.map((item) => ({ ...item, read: false }));
}

function seedCeoStore() {
  if (!window.localStorage.getItem(keys.approvals)) writeJSON(keys.approvals, mockApprovals);
  if (!window.localStorage.getItem(keys.kpis)) writeJSON(keys.kpis, mockKPIs);
  if (!window.localStorage.getItem(keys.announcements)) writeJSON(keys.announcements, seedAnnouncements());
  if (!window.localStorage.getItem(keys.pricing)) writeJSON(keys.pricing, seedPricing());
  if (!window.localStorage.getItem(keys.thresholds)) writeJSON(keys.thresholds, seedThresholds());
  if (!window.localStorage.getItem(keys.discounts)) writeJSON(keys.discounts, seedDiscounts());
  if (!window.localStorage.getItem(keys.company)) writeJSON(keys.company, seedCompany());
  if (!window.localStorage.getItem(keys.screens)) writeJSON(keys.screens, mockScreenAssets);
}

export const ceoStore = {
  eventName: EVENT,
  seed: seedCeoStore,
  readApprovals: () => readJSON<any[]>(keys.approvals, mockApprovals),
  writeApprovals: (value: any[]) => writeJSON(keys.approvals, value),
  readKpis: () => readJSON<any[]>(keys.kpis, mockKPIs),
  writeKpis: (value: any[]) => writeJSON(keys.kpis, value),
  readAnnouncements: () => readJSON<any[]>(keys.announcements, seedAnnouncements()),
  writeAnnouncements: (value: any[]) => writeJSON(keys.announcements, value),
  readPricing: () => readJSON<any[]>(keys.pricing, seedPricing()),
  writePricing: (value: any[]) => writeJSON(keys.pricing, value),
  readThresholds: () => readJSON<any>(keys.thresholds, seedThresholds()),
  writeThresholds: (value: any) => writeJSON(keys.thresholds, value),
  readDiscounts: () => readJSON<any[]>(keys.discounts, seedDiscounts()),
  writeDiscounts: (value: any[]) => writeJSON(keys.discounts, value),
  readCompany: () => readJSON<any>(keys.company, seedCompany()),
  writeCompany: (value: any) => writeJSON(keys.company, value),
  readScreens: () => readJSON<any[]>(keys.screens, mockScreenAssets),
  writeScreens: (value: any[]) => writeJSON(keys.screens, value),
  bookings: mockBookings,
  customers: mockCustomers,
  revenueChart: mockRevenueChart,
  featureFlags: mockFeatureFlags,
  screensMeta: mockScreens,
};

export function makeCeoId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getCeoDashboardStats() {
  const approvals = ceoStore.readApprovals();
  const announcements = ceoStore.readAnnouncements();
  const screens = ceoStore.readScreens();
  return {
    pendingApprovals: approvals.filter((item) => item.status === "pending").length,
    revenueToday: 297000,
    revenueMonth: 9260000,
    activeCampaigns: 3,
    screensOnline: screens.filter((screen) => screen.status === "active").length,
    newCustomers: 14,
    outstandingInvoices: 1274400,
    unreadAnnouncements: announcements.filter((item) => !item.read).length,
  };
}
