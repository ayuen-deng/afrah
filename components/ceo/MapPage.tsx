"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { useRouter } from "next/navigation";

import { ceoStore } from "@/components/ceo/store";
import { MapboxMap } from "@/components/maps/MapboxMap";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

export function CeoMapPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [detail, setDetail] = React.useState<any | null>(null);
  const screens = ceoStore.readScreens();
  const screenMeta = ceoStore.screensMeta;

  const merged = screens.map((screen) => {
    const meta = screenMeta.find((item) => item.name === screen.name);
    return {
      ...screen,
      lat: meta?.lat ?? 0.3163,
      lng: meta?.lng ?? 32.5822,
      location_type: meta?.location_type ?? "suburban",
    };
  });

  const filtered = merged.filter((screen) => statusFilter === "all" ? true : screen.status === statusFilter);
  const markers = filtered.map((screen) => ({
    id: screen.id,
    lat: screen.lat,
    lng: screen.lng,
    color: screen.status === "active" ? "#10B981" : screen.status === "offline" ? "#EF4444" : screen.status === "maintenance" ? "#F59E0B" : "#94A3B8",
    title: screen.name,
    subtitle: `${screen.status} • uptime ${screen.uptime}%`,
    actions: [
      { label: "View Details", onClick: () => setDetail(screen), tone: "primary" as const },
      { label: "View Schedule", onClick: () => showToast({ type: "info", title: "Schedule opened", message: `${screen.name} weekly schedule loaded.` }), tone: "secondary" as const },
    ],
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Live Map" subtitle="Monitor live screen status, current playback, and quick operational context across Kampala." />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {["all", "active", "offline", "maintenance"].map((status) => (
            <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-lg px-4 py-2 text-sm font-medium ${statusFilter === status ? "bg-primary text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}>
              {status}
            </button>
          ))}
          <div className="ml-auto flex flex-wrap gap-2 text-sm">
            <Badge variant="success" dot>Live</Badge>
            <Badge variant="neutral" dot>Available</Badge>
            <Badge variant="error" dot>Offline</Badge>
            <Badge variant="warning" dot>Maintenance</Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-4">
        {[
          ["Live Screens", merged.filter((screen) => screen.status === "active").length],
          ["Offline", merged.filter((screen) => screen.status === "offline").length],
          ["Maintenance", merged.filter((screen) => screen.status === "maintenance").length],
          ["Campaigns Now", 3],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-5">
            <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
          </Card>
        ))}
      </div>

      <MapboxMap markers={markers} />

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.name ?? "Screen Detail"} className="max-w-3xl">
        {detail ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 p-4 text-sm text-gray-700">
                <div>Status: <span className="font-semibold text-gray-900">{detail.status}</span></div>
                <div className="mt-2">Now Playing: Pearl Dairy Yoghurt Launch</div>
                <div className="mt-2">Location: {detail.location}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Uptime", `${detail.uptime}%`],
                  ["Heartbeat", detail.last_heartbeat],
                  ["Install Cost", detail.install_cost ? detail.install_cost.toLocaleString("en-US") : "-"],
                  ["Maintenance", detail.maintenance_total?.toLocaleString("en-US") ?? "-"],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl border border-gray-200 p-4 text-sm">
                    <div className="text-gray-500">{label}</div>
                    <div className="mt-2 font-semibold text-gray-900">{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => router.push("/analytics")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">View Details</button>
              <button type="button" onClick={() => showToast({ type: "info", title: "Schedule opened", message: `${detail.name} schedule opened.` })} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">View Schedule</button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
