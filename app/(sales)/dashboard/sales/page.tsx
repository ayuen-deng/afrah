"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  FileText,
  Handshake,
  TrendingUp,
  UserPlus,
} from "lucide-react";

import { mockCommissions, mockLeads } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type Stage = "new" | "contacted" | "quoted" | "negotiating" | "won" | "lost";

type Lead = (typeof mockLeads)[number] & {
  stage: Stage;
  days_in_stage: number;
};

function readLeads(): Lead[] {
  try {
    const raw = window.localStorage.getItem("afrah_sales_leads");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Lead[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function SalesDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [leads, setLeads] = React.useState<Lead[]>([]);

  React.useEffect(() => {
    const stored = readLeads();
    if (stored.length) {
      setLeads(stored);
      return;
    }
    const seeded = (mockLeads as unknown as Lead[]).map((l) => ({ ...l }));
    window.localStorage.setItem("afrah_sales_leads", JSON.stringify(seeded));
    window.dispatchEvent(new Event("afrah_sales_leads_updated"));
    setLeads(seeded);
  }, []);

  React.useEffect(() => {
    const onUpdate = () => setLeads(readLeads());
    window.addEventListener("afrah_sales_leads_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_sales_leads_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const stageCounts = React.useMemo(() => {
    const base: Record<Stage, number> = {
      new: 0,
      contacted: 0,
      quoted: 0,
      negotiating: 0,
      won: 0,
      lost: 0,
    };
    leads.forEach((l) => {
      base[l.stage] += 1;
    });
    return base;
  }, [leads]);

  const commissionEarned = mockCommissions.reduce(
    (acc, c) => (c.status === "paid" ? acc + c.amount : acc),
    0,
  );
  const commissionPending = mockCommissions.reduce(
    (acc, c) => (c.status === "pending" ? acc + c.amount : acc),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Sales Dashboard</div>
          <div className="mt-1 text-sm text-gray-600">
            Pipeline performance, reminders, and commissions.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              showToast({
                type: "success",
                title: "Export ready",
                message: "Sales dashboard export prepared successfully.",
              })
            }
          >
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <StatCard
          icon={UserPlus}
          iconColorClassName="text-primary bg-blue-100"
          value={4}
          label="Leads Added"
          trend={{ value: "+12.5%", direction: "up" }}
        />
        <StatCard
          icon={FileText}
          iconColorClassName="text-warning bg-amber-100"
          value={3}
          label="Quotes Sent"
          trend={{ value: "+4.1%", direction: "up" }}
        />
        <StatCard
          icon={Handshake}
          iconColorClassName="text-success bg-green-100"
          value={1}
          label="Deals Closed"
          trend={{ value: "+1.0%", direction: "up" }}
        />
        <button
          type="button"
          onClick={() => router.push("/clients")}
          className="text-left"
        >
          <StatCard
            icon={TrendingUp}
            iconColorClassName="text-primary bg-blue-100"
            value={formatUGX(8490199)}
            label="Revenue Generated"
            trend={{ value: "+9.0%", direction: "up" }}
          />
        </button>
        <button
          type="button"
          onClick={() => router.push("/commission")}
          className="text-left"
        >
          <StatCard
            icon={BadgeDollarSign}
            iconColorClassName="text-success bg-green-100"
            value={formatUGX(424510)}
            label="Commission Earned"
            trend={{ value: "+6.2%", direction: "up" }}
          />
        </button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[18px] font-semibold text-gray-800">Pipeline summary</div>
            <div className="mt-1 text-sm text-gray-600">
              6-stage pipeline — counts update live as leads move.
            </div>
          </div>
          <Button variant="secondary" onClick={() => router.push("/pipeline")}>
            Open Pipeline
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {(
            [
              { k: "new", label: "New" },
              { k: "contacted", label: "Contacted" },
              { k: "quoted", label: "Quoted" },
              { k: "negotiating", label: "Negotiating" },
              { k: "won", label: "Won" },
              { k: "lost", label: "Lost" },
            ] as const
          ).map((s) => (
            <div
              key={s.k}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {s.label}
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {stageCounts[s.k]}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Follow-up reminders</div>
          <div className="mt-1 text-sm text-gray-600">
            Due today — keep the pipeline moving.
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Follow up: Movit Products
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  Day 7 in stage — send reminder and book meeting.
                </div>
              </div>
              <Badge variant="warning" dot>
                Due Today
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => router.push("/pipeline")}>Start</Button>
              <Button
                variant="secondary"
                onClick={() =>
                  showToast({
                    type: "success",
                    title: "Postponed",
                    message: "Snoozed reminder by 30 minutes.",
                  })
                }
              >
                Postpone
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Commission this month</div>
          <div className="mt-1 text-sm text-gray-600">Earned + pending.</div>
          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Earned</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{formatUGX(commissionEarned)}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Pending</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{formatUGX(commissionPending)}</div>
            </div>
            <Button onClick={() => router.push("/commission")}>Open Commission</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

