"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, HeartHandshake, MonitorCog, Package, UserCheck, UserMinus, Users, WalletCards } from "lucide-react";

import { getOperationsDashboardStats, operationsStore } from "@/components/operations/store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";

type AlertItem = {
  id: string;
  tone: "red" | "amber";
  text: string;
  href: string;
};

export function OperationsDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = React.useState(() => getOperationsDashboardStats());
  const [alerts, setAlerts] = React.useState<AlertItem[]>([
    { id: "al-001", tone: "red", text: "Garden City Screen offline - immediate action needed", href: "/screens?tab=health" },
    { id: "al-002", tone: "amber", text: "1 leave request awaiting approval", href: "/people?tab=leave" },
    { id: "al-003", tone: "amber", text: "Alex Mugisha probation review due in 24 days", href: "/people?tab=performance" },
    { id: "al-004", tone: "amber", text: "Toyota Hiace service due in 6 days", href: "/assets?tab=maintenance" },
    { id: "al-005", tone: "amber", text: "Patrick Oryema offboarding in progress", href: "/people?tab=offboarding" },
  ]);

  React.useEffect(() => {
    operationsStore.seed();
    const refresh = () => setStats(getOperationsDashboardStats());
    refresh();
    window.addEventListener(operationsStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(operationsStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const statCards = [
    { icon: Users, value: stats.activeEmployees, label: "Active Employees", href: "/people?tab=employees", iconColorClassName: "text-primary bg-blue-100" },
    { icon: UserCheck, value: stats.onboarding, label: "Onboarding", href: "/people?tab=onboarding", iconColorClassName: "text-info bg-blue-100" },
    { icon: HeartHandshake, value: stats.leavePending, label: "Leave Pending", href: "/people?tab=leave", iconColorClassName: "text-warning bg-amber-100" },
    { icon: WalletCards, value: stats.reviewsOverdue, label: "Reviews Overdue", href: "/people?tab=performance", iconColorClassName: "text-error bg-red-100" },
    { icon: Package, value: stats.officeIssues, label: "Office Issues", href: "/office?tab=maintenance", iconColorClassName: "text-warning bg-amber-100" },
    { icon: MonitorCog, value: stats.screensOffline, label: "Screens Offline", href: "/screens?tab=health", iconColorClassName: "text-error bg-red-100" },
    { icon: AlertTriangle, value: stats.assetServiceDue, label: "Asset Service Due", href: "/assets?tab=maintenance", iconColorClassName: "text-warning bg-amber-100" },
    { icon: UserMinus, value: stats.offboardingActive, label: "Offboarding", href: "/people?tab=offboarding", iconColorClassName: "text-orange-600 bg-orange-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Operations Overview</div>
          <div className="mt-1 text-sm text-gray-600">People operations, office systems, and physical assets in one place.</div>
        </div>
        <Button onClick={() => router.push("/people?tab=employees")}>Open People Section</Button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <button
            key={alert.id}
            type="button"
            onClick={() => router.push(alert.href)}
            className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left ${
              alert.tone === "red"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <span className="text-sm font-medium">{alert.text}</span>
            <span
              className="rounded-lg bg-white/80 px-3 py-1 text-xs font-semibold"
              onClick={(event) => {
                event.stopPropagation();
                setAlerts((current) => current.filter((item) => item.id !== alert.id));
              }}
            >
              Dismiss
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {statCards.map((item) => (
          <button key={item.label} type="button" onClick={() => router.push(item.href)} className="text-left">
            <StatCard
              icon={item.icon}
              value={item.value}
              label={item.label}
              iconColorClassName={item.iconColorClassName}
              trend={{ value: "+4.0%", direction: "up" }}
            />
          </button>
        ))}
      </div>

      <Card className="p-6">
        <div className="text-[18px] font-semibold text-gray-800">Engagement snapshot</div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="text-xs uppercase tracking-wide text-gray-500">Team Pulse</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{operationsStore.pulseSurvey.avg_satisfaction}/5</div>
            <div className="mt-1 text-sm text-gray-600">{operationsStore.pulseSurvey.responses}/{operationsStore.pulseSurvey.total_staff} responses</div>
          </div>
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="text-xs uppercase tracking-wide text-gray-500">NPS</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{operationsStore.pulseSurvey.avg_nps}</div>
            <div className="mt-1 text-sm text-gray-600">Satisfaction up from 3.8 last month</div>
          </div>
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="text-xs uppercase tracking-wide text-gray-500">Employee of the Month</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{operationsStore.recognition.employee}</div>
            <div className="mt-1 text-sm text-gray-600">{operationsStore.recognition.reason}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
