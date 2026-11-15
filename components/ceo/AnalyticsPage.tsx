"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ceoStore } from "@/components/ceo/store";
import { MapboxMap } from "@/components/maps/MapboxMap";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatUGX } from "@/lib/ugx";

const tabs = ["revenue", "screens", "customers", "demand", "forecast"] as const;

export function CeoAnalyticsPage() {
  const [tab, setTab] = React.useState<(typeof tabs)[number]>("revenue");
  const screens = ceoStore.readScreens();
  const markers = ceoStore.screensMeta.map((screen) => ({
    id: screen.id,
    lat: screen.lat,
    lng: screen.lng,
    color: "#2563EB",
    title: screen.name,
    subtitle: formatUGX(screen.price_per_hour * 40),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Explore revenue, screens, customer demand, and forecast views." />
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === item ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}>
              {item}
            </button>
          ))}
        </div>
      </Card>

      {tab === "revenue" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr,1.1fr]">
          <MapboxMap markers={markers} />
          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Revenue vs Expenses</div>
            <div className="mt-5 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ceoStore.revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}M`} />
                  <Tooltip formatter={(value) => formatUGX(Number(value ?? 0))} />
                  <Bar dataKey="revenue" fill="#2563EB" />
                  <Bar dataKey="expenses" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "screens" ? (
        <Card className="overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Screen", "Status", "Uptime", "ROI", "Location"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {screens.map((screen) => (
                <tr key={screen.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{screen.name}</td>
                  <td className="px-4 py-3"><Badge variant={screen.status === "active" ? "success" : screen.status === "offline" ? "error" : "warning"}>{screen.status}</Badge></td>
                  <td className="px-4 py-3 text-sm text-gray-700">{screen.uptime}%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{(screen.uptime > 90 ? 18 : 7)}%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{screen.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {tab === "customers" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">New vs Returning</div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-gray-200 p-5"><div className="text-xs uppercase tracking-wide text-gray-500">New</div><div className="mt-2 text-3xl font-bold text-gray-900">14</div></div>
              <div className="rounded-2xl border border-gray-200 p-5"><div className="text-xs uppercase tracking-wide text-gray-500">Returning</div><div className="mt-2 text-3xl font-bold text-gray-900">9</div></div>
            </div>
          </Card>
          <Card className="overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">Customer</th><th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">Spent</th><th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">CLV</th></tr></thead>
              <tbody>
                {ceoStore.customers.map((customer) => (
                  <tr key={customer.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{customer.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatUGX(customer.total_spent)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatUGX(customer.total_spent * 2.1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ) : null}

      {tab === "demand" ? (
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Demand Heatmap</div>
          <div className="mt-5 grid grid-cols-7 gap-2">
            {Array.from({ length: 7 * 6 }).map((_, index) => {
              const intensity = ((index % 7) + Math.floor(index / 7)) % 5;
              return <div key={index} className={`aspect-square rounded-lg ${["bg-slate-100", "bg-blue-100", "bg-blue-200", "bg-blue-400", "bg-blue-600"][intensity]}`} />;
            })}
          </div>
        </Card>
      ) : null}

      {tab === "forecast" ? (
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Forecast</div>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ceoStore.revenueChart.map((row, index) => ({ ...row, forecast: row.revenue + (index + 1) * 420000 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}M`} />
                <Tooltip formatter={(value) => formatUGX(Number(value ?? 0))} />
                <Bar dataKey="revenue">
                  {ceoStore.revenueChart.map((row) => <Cell key={row.month} fill="#2563EB" />)}
                </Bar>
                <Bar dataKey="forecast" fill="#94A3B8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
