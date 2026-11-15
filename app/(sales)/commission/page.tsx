"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { BarChart3, Download, MessageSquarePlus } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { mockCommissions } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type Commission = (typeof mockCommissions)[number];

function commissionVariant(status: Commission["status"]) {
  return status === "paid" ? ("success" as const) : ("warning" as const);
}

function parseDDMMYYYY(value: string) {
  const [dd, mm, yyyy] = value.split("/").map((p) => Number(p));
  if (!dd || !mm || !yyyy) return null;
  const dt = new Date(yyyy, mm - 1, dd);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function safeMonthLabel(d: Date) {
  try {
    return format(d, "MMM");
  } catch {
    return "—";
  }
}

const messageSchema = z.object({
  message: z.string().min(10, "Please enter a short message (min 10 chars)."),
});
type MessageValues = z.infer<typeof messageSchema>;

export default function SalesCommissionPage() {
  const { showToast } = useToast();

  const [selected, setSelected] = React.useState<Commission | null>(null);
  const [messageOpen, setMessageOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const messageForm = useForm<MessageValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: "Hello Finance team, kindly clarify my pending commission for BK-2024-0002.",
    },
  });

  const totals = React.useMemo(() => {
    const today = new Date(2024, 3, 4); // Friday, 04 April 2024 (walkthrough context)
    const monthKey = `${today.getFullYear()}-${today.getMonth()}`;
    const last3Keys = new Set<string>();
    for (let i = 0; i < 3; i += 1) {
      const dt = new Date(today.getFullYear(), today.getMonth() - i, 1);
      last3Keys.add(`${dt.getFullYear()}-${dt.getMonth()}`);
    }

    const monthItems = mockCommissions.filter((c) => {
      const dt = parseDDMMYYYY(c.date);
      if (!dt) return false;
      return `${dt.getFullYear()}-${dt.getMonth()}` === monthKey;
    });
    const last3Items = mockCommissions.filter((c) => {
      const dt = parseDDMMYYYY(c.date);
      if (!dt) return false;
      return last3Keys.has(`${dt.getFullYear()}-${dt.getMonth()}`);
    });
    const yearItems = mockCommissions.filter((c) => {
      const dt = parseDDMMYYYY(c.date);
      if (!dt) return false;
      return dt.getFullYear() === today.getFullYear();
    });

    const monthTotal = monthItems.reduce((a, c) => a + c.amount, 0);
    const monthPaid = monthItems.filter((c) => c.status === "paid").reduce((a, c) => a + c.amount, 0);
    const last3Total = last3Items.reduce((a, c) => a + c.amount, 0);
    const yearTotal = yearItems.reduce((a, c) => a + c.amount, 0);

    return { month: monthTotal, paid: monthPaid, quarter: last3Total, year: yearTotal };
  }, []);

  const chartData = React.useMemo(() => {
    const base = new Map<string, { month: string; paid: number; pending: number }>();
    mockCommissions.forEach((c) => {
      const dt = parseDDMMYYYY(c.date);
      const key = dt ? `${dt.getFullYear()}-${dt.getMonth()}` : `unknown-${c.date}`;
      const label = dt ? safeMonthLabel(dt) : "—";
      const current = base.get(key) ?? { month: label, paid: 0, pending: 0 };
      if (c.status === "paid") current.paid += c.amount;
      else current.pending += c.amount;
      base.set(key, current);
    });
    return Array.from(base.values()).slice(-6);
  }, []);

  const columns: DataTableColumn<Commission>[] = React.useMemo(
    () => [
      { key: "date", header: "Date", cell: (c) => <span className="font-mono text-sm text-gray-700">{c.date}</span> },
      {
        key: "customer",
        header: "Customer",
        cell: (c) => (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900">{c.customer}</div>
            <div className="mt-0.5 truncate text-xs text-gray-500 font-mono">{c.booking_ref}</div>
          </div>
        ),
        className: "min-w-[260px]",
      },
      { key: "deal", header: "Deal Value", cell: (c) => <span className="font-medium text-gray-900">{formatUGX(c.deal_value)}</span> },
      { key: "rate", header: "Rate", cell: (c) => <span className="text-sm text-gray-700">{c.rate}%</span> },
      { key: "amount", header: "Amount", cell: (c) => <span className="font-medium text-gray-900">{formatUGX(c.amount)}</span> },
      {
        key: "status",
        header: "Status",
        cell: (c) => (
          <Badge variant={commissionVariant(c.status)} dot>
            {c.status === "paid" ? "Paid" : "Pending"}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Commission</div>
          <div className="mt-1 text-sm text-gray-600">Track your earnings and query pending commission.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => showToast({ type: "success", title: "Export ready", message: "Commission export prepared successfully." })}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setMessageOpen(true)}>
            <MessageSquarePlus className="h-4 w-4" />
            Query Commission
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">This Month</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{formatUGX(totals.month)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Paid</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{formatUGX(totals.paid)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Quarter</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{formatUGX(totals.quarter)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Year</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{formatUGX(totals.year)}</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_520px]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[18px] font-semibold text-gray-800">Commission ledger</div>
              <div className="mt-1 text-sm text-gray-600">Click any row for a commission detail modal.</div>
            </div>
            <Badge variant="info" className="px-2 py-1">
              {mockCommissions.length} records
            </Badge>
          </div>
          <div className="mt-6">
            <DataTable
              data={mockCommissions}
              columns={columns}
              rowKey={(c) => c.id}
              onRowClick={(c) => setSelected(c)}
              rowActions={(c) => [{ label: "Open details", onClick: () => setSelected(c) }]}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[18px] font-semibold text-gray-800">Last 6 months</div>
              <div className="mt-1 text-sm text-gray-600">Paid vs pending amounts.</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 4, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={44} />
                <Tooltip
                  cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
                  formatter={(value) =>
                    formatUGX(typeof value === "number" ? value : Number(value ?? 0))
                  }
                />
                <Bar dataKey="paid" stackId="a" fill="#10B981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="pending" stackId="a" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center gap-3 text-sm text-gray-600">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-success" /> Paid</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-warning" /> Pending</span>
          </div>
        </Card>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Commission Detail"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (!selected) return;
                showToast({ type: "success", title: "Requested", message: "Finance has been notified to confirm this commission entry." });
                setSelected(null);
              }}
            >
              Request Confirmation
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Customer</div>
            <div className="mt-2 text-sm font-semibold text-gray-900">{selected?.customer}</div>
            <div className="mt-1 text-xs text-gray-500 font-mono">{selected?.booking_ref}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</div>
            <div className="mt-2">
              {selected ? (
                <Badge variant={commissionVariant(selected.status)} dot>
                  {selected.status === "paid" ? "Paid" : "Pending"}
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Deal Value</div>
            <div className="mt-2 text-lg font-bold text-gray-900">{selected ? formatUGX(selected.deal_value) : "—"}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Commission</div>
            <div className="mt-2 text-lg font-bold text-gray-900">{selected ? formatUGX(selected.amount) : "—"}</div>
            <div className="mt-1 text-xs text-gray-500">{selected?.rate}% rate</div>
          </div>
        </div>
      </Modal>

      <Modal
        open={messageOpen}
        onClose={() => {
          if (sending) return;
          setMessageOpen(false);
        }}
        title="Query Finance"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMessageOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button
              onClick={messageForm.handleSubmit(async () => {
                setSending(true);
                try {
                  await new Promise((r) => setTimeout(r, 900));
                  showToast({ type: "success", title: "Sent", message: "Your commission query was sent to Finance." });
                  setMessageOpen(false);
                  messageForm.reset();
                } finally {
                  setSending(false);
                }
              })}
              loading={sending}
            >
              Send
            </Button>
          </>
        }
      >
        <div>
          <label className="text-sm font-medium text-gray-700">Message</label>
          <textarea
            rows={5}
            {...messageForm.register("message")}
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
          />
          {messageForm.formState.errors.message ? <div className="mt-1 text-xs text-red-600">{messageForm.formState.errors.message.message}</div> : null}
        </div>
      </Modal>
    </div>
  );
}
