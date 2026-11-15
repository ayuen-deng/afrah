"use client";
import * as React from "react";
import { CalendarDays, CheckCircle2, Search, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { historyStats, labels, readTech, seedTech, techEvent, type TechTask } from "@/components/technician/store";

const staticDone: TechTask = {
  id: "done-001",
  screenId: "4",
  screen: "Garden City Screen",
  location: "Garden City Mall, Kira Road, Kampala",
  lat: 0.3389,
  lng: 32.5956,
  priority: "urgent",
  status: "resolved",
  title: "Display restored",
  desc: "Display output was restored and verified.",
  photo: "https://picsum.photos/seed/garden-fixed/900/540",
  assigned: "04/04/2024 09:00",
  instructions: "Keep observing the screen.",
  phone: "0773000006",
  timeline: [{ id: "4", label: "Resolved", time: "04/04/2024 13:05", note: "Task completed." }],
  completion: {
    notes: "Replaced faulty HDMI cable between media player and screen. Screen now displaying correctly.",
    parts: "HDMI cable (2m, purchased locally - UGX 15,000)",
    photos: [
      { id: "cp1", name: "one.jpg", url: "https://picsum.photos/seed/garden-fix-1/400/300" },
      { id: "cp2", name: "two.jpg", url: "https://picsum.photos/seed/garden-fix-2/400/300" },
    ],
    duration: "4 hours",
  },
};

const variant = (v: string): "success" | "error" | "info" =>
  v === "resolved" ? "success" : v === "cannot_fix" ? "error" : "info";

export function TechnicianHistoryPage() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [tasks, setTasks] = React.useState<TechTask[]>([staticDone]);
  const [active, setActive] = React.useState<TechTask | null>(null);
  const [lightbox, setLightbox] = React.useState<string | null>(null);

  React.useEffect(() => {
    seedTech();
    const refresh = () => setTasks([staticDone, ...readTech().filter((t) => t.status === "resolved" || t.status === "cannot_fix")]);
    refresh();
    window.addEventListener(techEvent, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(techEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const s = historyStats();
  const filtered = tasks.filter((t) => (status === "all" || t.status === status) && `${t.screen} ${t.title} ${t.location}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="mx-auto max-w-7xl space-y-6"><PageHeader title="Task History" subtitle="Review your completed and escalated field work." /><div className="grid gap-4 md:grid-cols-3"><Card className="p-5"><div className="flex items-center gap-2 text-sm font-semibold text-gray-700"><CheckCircle2 className="h-4 w-4 text-green-600" />Completed</div><div className="mt-3 text-3xl font-bold text-gray-900">{s.completed}</div></Card><Card className="p-5"><div className="flex items-center gap-2 text-sm font-semibold text-gray-700"><CalendarDays className="h-4 w-4 text-blue-600" />Total All Time</div><div className="mt-3 text-3xl font-bold text-gray-900">{s.total}</div></Card><Card className="p-5"><div className="flex items-center gap-2 text-sm font-semibold text-gray-700"><XCircle className="h-4 w-4 text-red-600" />Cannot Fix Rate</div><div className="mt-3 text-3xl font-bold text-gray-900">{s.cannotFixRate}%</div></Card></div><Card className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row"><label className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500"><Search className="h-4 w-4" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search history..." className="w-full bg-transparent text-sm text-gray-700 outline-none" /></label><select className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"><option>April 2024</option></select><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"><option value="all">All Statuses</option><option value="resolved">Resolved</option><option value="cannot_fix">Cannot Fix</option></select></div><div className="overflow-hidden rounded-xl border border-gray-200 bg-white"><table className="min-w-full"><thead className="bg-gray-50"><tr className="text-left"><th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">Screen</th><th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">Status</th><th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">Completed</th><th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">Duration</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id} className="h-12 cursor-pointer border-b border-slate-100 hover:bg-gray-50" onClick={() => setActive(row)}><td className="px-4 py-3"><div className="flex items-center gap-3"><img src={row.photo} alt={row.screen} className="h-10 w-10 rounded-full object-cover" /><div><div className="text-sm font-medium text-gray-900">{row.screen}</div><div className="text-xs text-gray-500">{row.location}</div></div></div></td><td className="px-4 py-3"><Badge variant={variant(row.status)} dot>{labels[row.status]}</Badge></td><td className="px-4 py-3 text-sm text-gray-700">{row.timeline.at(-1)?.time}</td><td className="px-4 py-3 text-sm text-gray-700">{row.completion?.duration ?? "—"}</td></tr>)}</tbody></table></div></Card><Modal open={Boolean(active)} title={active?.screen ?? "Task Details"} onClose={() => setActive(null)} className="max-w-4xl">{active ? <div className="space-y-5"><div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">COMPLETED</div><div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]"><div className="space-y-4"><img src={active.photo} alt={active.screen} className="h-56 w-full rounded-xl object-cover" /><div className="text-sm text-gray-600">{active.desc}</div></div><div className="space-y-4"><div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><div className="text-sm font-semibold text-gray-900">Completion Notes</div><div className="mt-2 text-sm text-gray-600">{active.completion?.notes}</div></div><div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><div className="text-sm font-semibold text-gray-900">Parts Used</div><div className="mt-2 text-sm text-gray-600">{active.completion?.parts}</div></div><div className="grid gap-3 sm:grid-cols-2">{active.completion?.photos.map((photo) => <button key={photo.id} type="button" onClick={() => setLightbox(photo.url)} className="overflow-hidden rounded-xl border border-gray-200"><img src={photo.url} alt={photo.name} className="h-28 w-full object-cover" /></button>)}</div></div></div></div> : null}</Modal><Modal open={Boolean(lightbox)} title="Photo Preview" onClose={() => setLightbox(null)} className="max-w-4xl">{lightbox ? <img src={lightbox} alt="Preview" className="max-h-[70vh] w-full rounded-xl object-contain" /> : null}</Modal></div>;
}

