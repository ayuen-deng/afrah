"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ceoStore, makeCeoId } from "@/components/ceo/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

export function CeoKpisPage() {
  const { showToast } = useToast();
  const [kpis, setKpis] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);

  React.useEffect(() => {
    ceoStore.seed();
    const refresh = () => setKpis(ceoStore.readKpis());
    refresh();
    window.addEventListener(ceoStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(ceoStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const counts = {
    onTrack: kpis.filter((kpi) => (kpi.current / kpi.target) * 100 >= 85).length,
    atRisk: kpis.filter((kpi) => {
      const percent = (kpi.current / kpi.target) * 100;
      return percent >= 65 && percent < 85;
    }).length,
    offTrack: kpis.filter((kpi) => (kpi.current / kpi.target) * 100 < 65).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="KPI Tracker" subtitle="Monitor strategic KPIs, progress against target, and historical trend lines." actions={<Button onClick={() => setAddOpen(true)}>Add KPI</Button>} />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["On Track", counts.onTrack, "success"],
          ["At Risk", counts.atRisk, "warning"],
          ["Off Track", counts.offTrack, "error"],
        ].map(([label, value, variant]) => (
          <Card key={String(label)} className="p-5">
            <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-3xl font-bold text-gray-900">{value}</div>
              <Badge variant={variant as any}>{label}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {["KPI", "Target", "Current", "Progress", "Status", "Actions"].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kpis.map((kpi) => {
              const percent = Math.round((kpi.current / kpi.target) * 100);
              const variant = percent >= 85 ? "success" : percent >= 65 ? "warning" : "error";
              const label = percent >= 85 ? "On Track" : percent >= 65 ? "At Risk" : "Off Track";
              return (
                <tr key={kpi.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{kpi.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{kpi.target}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{kpi.current}</td>
                  <td className="px-4 py-3">
                    <div className="h-2 rounded-full bg-gray-100">
                      <div className={`h-2 rounded-full ${variant === "success" ? "bg-green-500" : variant === "warning" ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant={variant as any}>{label}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setSelected(kpi)}>Edit</Button>
                      <Button variant="danger" onClick={() => { ceoStore.writeKpis(kpis.filter((item) => item.id !== kpi.id)); showToast({ type: "success", title: "Deleted", message: "KPI removed." }); }}>Delete</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card className="p-6">
        <div className="text-[18px] font-semibold text-gray-800">Historical Trend</div>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ceoStore.revenueChart.map((row) => ({ ...row, target: row.revenue * 1.08, actual: row.revenue }))}>
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}M`} />
              <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString("en-US")} />
              <Line dataKey="target" stroke="#94A3B8" strokeWidth={2} strokeDasharray="6 6" />
              <Line dataKey="actual" stroke="#2563EB" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title ?? "Edit KPI"}>
        {selected ? (
          <div className="space-y-4 text-sm text-gray-700">
            <div>Target: {selected.target}</div>
            <div>Current: {selected.current}</div>
            <Button onClick={() => { ceoStore.writeKpis(kpis.map((item) => item.id === selected.id ? { ...item, current: item.current + 1 } : item)); setSelected(null); showToast({ type: "success", title: "Updated", message: "KPI updated." }); }}>Save</Button>
          </div>
        ) : null}
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add KPI">
        <Button
          onClick={() => {
            ceoStore.writeKpis([
              ...kpis,
              { id: makeCeoId("kpi"), title: "Lead Conversion", target: 10, current: 7, unit: "count", period: "monthly" },
            ]);
            setAddOpen(false);
            showToast({ type: "success", title: "Added", message: "KPI added." });
          }}
        >
          Create KPI
        </Button>
      </Modal>
    </div>
  );
}
