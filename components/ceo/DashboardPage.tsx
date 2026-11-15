"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ceoStore, getCeoDashboardStats, makeCeoId } from "@/components/ceo/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";
import { BellRing, CreditCard, MapPinned, TrendingUp, Users, WalletCards } from "lucide-react";

export function CeoDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [stats, setStats] = React.useState(() => getCeoDashboardStats());
  const [announcements, setAnnouncements] = React.useState<any[]>([]);

  React.useEffect(() => {
    ceoStore.seed();
    const refresh = () => {
      setStats(getCeoDashboardStats());
      setAnnouncements(ceoStore.readAnnouncements());
    };
    refresh();
    window.addEventListener(ceoStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(ceoStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const kpis = ceoStore.readKpis();
  const topAnnouncement = announcements[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Executive Overview" subtitle="Real-time commercial, operational, and leadership visibility for Afrah Media." />

      <button type="button" onClick={() => router.push("/approvals")} className="flex w-full items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-left text-amber-900">
        <div className="flex items-center gap-3">
          <BellRing className="h-5 w-5" />
          <span className="font-medium">You have {stats.pendingApprovals} items requiring your approval</span>
        </div>
        <span className="text-sm font-semibold">Review Approvals</span>
      </button>

      <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
        <button type="button" onClick={() => router.push("/analytics")} className="text-left"><StatCard icon={TrendingUp} value={formatUGX(stats.revenueToday)} label="Revenue Today" iconColorClassName="bg-green-100 text-green-700" trend={{ value: "+12%", direction: "up" }} /></button>
        <button type="button" onClick={() => router.push("/analytics")} className="text-left"><StatCard icon={WalletCards} value={formatUGX(stats.revenueMonth)} label="Revenue Month" iconColorClassName="bg-blue-100 text-primary" trend={{ value: "+8.6%", direction: "up" }} /></button>
        <button type="button" onClick={() => router.push("/map")} className="text-left"><StatCard icon={MapPinned} value={stats.activeCampaigns} label="Active Campaigns" iconColorClassName="bg-indigo-100 text-indigo-700" trend={{ value: "+4%", direction: "up" }} /></button>
        <button type="button" onClick={() => router.push("/map")} className="text-left"><StatCard icon={MapPinned} value={`${stats.screensOnline} / 5`} label="Screens Online" iconColorClassName="bg-amber-100 text-amber-700" trend={{ value: "-1%", direction: "down" }} /></button>
        <button type="button" onClick={() => router.push("/analytics")} className="text-left"><StatCard icon={Users} value={stats.newCustomers} label="New Customers" iconColorClassName="bg-emerald-100 text-emerald-700" trend={{ value: "+3%", direction: "up" }} /></button>
        <button type="button" onClick={() => router.push("/invoices")} className="text-left"><StatCard icon={CreditCard} value={formatUGX(stats.outstandingInvoices)} label="Outstanding Invoices" iconColorClassName="bg-red-100 text-red-700" trend={{ value: "+2%", direction: "up" }} /></button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-[18px] font-semibold text-gray-800">Announcement Composer</div>
            <Button variant="secondary" onClick={() => router.push("/announcements")}>Open All</Button>
          </div>
          <div className="mt-4 rounded-2xl border border-gray-200 p-4">
            <div className="text-sm font-semibold text-gray-900">Important: Team meeting Monday 8 AM</div>
            <div className="mt-2 text-sm text-gray-600">All staff must attend the Monday 07 April team meeting at 8:00 AM sharp. Agenda: Q2 targets and new client onboarding.</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="warning">Important</Badge>
              <Button
                onClick={() => {
                  ceoStore.writeAnnouncements([
                    {
                      id: makeCeoId("ann"),
                      title: "Important: Team meeting Monday 8 AM",
                      body: "All staff must attend the Monday 07 April team meeting at 8:00 AM sharp. Agenda: Q2 targets and new client onboarding.",
                      urgency: "important",
                      posted_by: "Demo Principal",
                      date: "04/04/2024",
                      seen_count: 0,
                      read: false,
                    },
                    ...announcements,
                  ]);
                  showToast({ type: "success", title: "Posted", message: "Announcement posted to all staff." });
                }}
              >
                Post Announcement
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">KPI Tracker</div>
          <div className="mt-5 space-y-4">
            {kpis.map((kpi) => {
              const percent = kpi.unit === "UGX" ? Math.round((kpi.current / kpi.target) * 100) : Math.round((kpi.current / kpi.target) * 100);
              const variant = percent >= 85 ? "success" : percent >= 65 ? "warning" : "error";
              const label = percent >= 85 ? "On Track" : percent >= 65 ? "At Risk" : "Off Track";
              return (
                <div key={kpi.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{kpi.title}</span>
                    <Badge variant={variant as any}>{label}</Badge>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-100">
                    <div className={`h-2 rounded-full ${variant === "success" ? "bg-green-500" : variant === "warning" ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Revenue Trend</div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ceoStore.revenueChart}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}M`} />
                <Tooltip formatter={(value) => formatUGX(Number(value ?? 0))} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="#93C5FD" fillOpacity={0.35} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Team Snapshot</div>
          <div className="mt-5 grid gap-4">
            {[
              ["Design", "2 active tasks", "2 designers available"],
              ["Sales", "4 leads active", "1 deal negotiating"],
              ["Operations", "1 screen offline", "1 leave request pending"],
            ].map(([team, line1, line2]) => (
              <button key={team} type="button" onClick={() => showToast({ type: "info", title: team, message: `${line1} - ${line2}` })} className="rounded-2xl border border-gray-200 p-4 text-left">
                <div className="font-semibold text-gray-900">{team}</div>
                <div className="mt-1 text-sm text-gray-600">{line1}</div>
                <div className="text-sm text-gray-500">{line2}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {topAnnouncement ? (
        <Card className="p-5">
          <div className="text-sm font-semibold text-gray-900">Latest Announcement</div>
          <div className="mt-2 text-sm text-gray-600">{topAnnouncement.title}</div>
        </Card>
      ) : null}
    </div>
  );
}
