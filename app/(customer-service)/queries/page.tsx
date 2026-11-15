"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { mockQueries } from "@/lib/mockData";
import { formatDateTimeUG } from "@/lib/dates";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type QueryStatus = "new" | "in_progress" | "resolved";
type QuerySource = "online" | "walk_in" | "whatsapp";

type Note = { text: string; author: string; time: string };

type Query = {
  id: string;
  customer: string;
  company?: string;
  phone: string;
  email?: string;
  message: string;
  source: QuerySource;
  status: QueryStatus;
  received: string;
  notes: Note[];
  assigned_to?: string | null;
};

type QueryDraft = {
  customer: string;
  company: string;
  phone: string;
  email: string;
  message: string;
  source: QuerySource;
};

function readQueries(): Query[] {
  try {
    const raw = window.localStorage.getItem("afrah_cs_queries");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Query[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueries(next: Query[]) {
  window.localStorage.setItem("afrah_cs_queries", JSON.stringify(next));
  window.dispatchEvent(new Event("afrah_cs_queries_updated"));
}

export default function CustomerServiceQueriesPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [newQueryOpen, setNewQueryOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [draft, setDraft] = React.useState<QueryDraft>({
    customer: "",
    company: "",
    phone: "",
    email: "",
    message: "",
    source: "online",
  });
  const [draftErrors, setDraftErrors] = React.useState<{
    customer?: string;
    email?: string;
    message?: string;
  }>({});

  const [statusTab, setStatusTab] = React.useState<
    "all" | "new" | "in_progress" | "resolved"
  >("all");
  const [source, setSource] = React.useState<"all" | QuerySource>("all");
  const [search, setSearch] = React.useState("");
  const [queries, setQueries] = React.useState<Query[]>([]);

  React.useEffect(() => {
    const stored = readQueries();
    if (stored.length) {
      setQueries(stored);
      return;
    }
    const base: Query[] = mockQueries.map((q) => ({
      id: q.id,
      customer: q.customer,
      company: q.company,
      phone: q.phone,
      email: q.email,
      message: q.message,
      source: q.source as QuerySource,
      status: q.status as QueryStatus,
      received: q.received,
      notes: (q.notes as unknown as Note[]) ?? [],
      assigned_to: (q as { assigned_to?: string | null }).assigned_to ?? null,
    }));
    const extra: Query = {
      id: "q-003",
      customer: "Moses Kato",
      company: "Kato Traders",
      phone: "0779000003",
      email: "moses@kato.ug",
      message: "Needs rates for a weekend promo near Wandegeya.",
      source: "whatsapp",
      status: "new",
      received: "03/04/2024 17:10",
      notes: [],
      assigned_to: null,
    };
    const seeded = [...base, extra];
    writeQueries(seeded);
    setQueries(seeded);
  }, []);

  React.useEffect(() => {
    const onUpdate = () => setQueries(readQueries());
    window.addEventListener("afrah_cs_queries_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_cs_queries_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return queries.filter((item) => {
      const matchesTab = statusTab === "all" ? true : item.status === statusTab;
      const matchesSource = source === "all" ? true : item.source === source;
      const matchesSearch =
        !q ||
        item.customer.toLowerCase().includes(q) ||
        (item.company ?? "").toLowerCase().includes(q) ||
        (item.message ?? "").toLowerCase().includes(q);
      return matchesTab && matchesSource && matchesSearch;
    });
  }, [queries, search, source, statusTab]);

  const counts = React.useMemo(() => {
    const base = { all: queries.length, new: 0, in_progress: 0, resolved: 0 };
    queries.forEach((q) => {
      if (q.status === "new") base.new += 1;
      if (q.status === "in_progress") base.in_progress += 1;
      if (q.status === "resolved") base.resolved += 1;
    });
    return base;
  }, [queries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Queries</div>
          <div className="mt-1 text-sm text-gray-600">
            Real-time filtering, rich detail views, and internal notes.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setNewQueryOpen(true)}>New Query</Button>
          <Button
            variant="secondary"
            onClick={() =>
              showToast({
                type: "success",
                title: "Export ready",
                message: "Query export prepared successfully.",
              })
            }
          >
            Export
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { k: "all", label: "All", count: counts.all },
                { k: "new", label: "New", count: counts.new },
                { k: "in_progress", label: "In Progress", count: counts.in_progress },
                { k: "resolved", label: "Resolved", count: counts.resolved },
              ] as const
            ).map((t) => {
              const active = statusTab === t.k;
              return (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setStatusTab(t.k)}
                  className={
                    active
                      ? "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                      : "inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  }
                >
                  {t.label}
                  <span
                    className={
                      active
                        ? "rounded-md bg-white/15 px-2 py-0.5 text-xs"
                        : "rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                    }
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label className="text-sm font-medium text-gray-700">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as "all" | QuerySource)}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30 sm:w-52"
              >
                <option value="all">All</option>
                <option value="online">Online</option>
                <option value="walk_in">Walk-in</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div className="sm:w-[360px]">
              <label className="text-sm font-medium text-gray-700">Search</label>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer, company, message…"
                  className="w-full text-sm text-gray-900 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => router.push(`/queries/${q.id}`)}
            className="text-left"
          >
            <Card className="p-6 transition-colors hover:bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-900">
                    {(q.customer?.split(" ").map((p) => p[0]).join("") ?? "Q")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">
                      {q.customer}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {q.company ?? "—"} • {q.received}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="neutral">
                    {q.source.replace("_", " ").toUpperCase()}
                  </Badge>
                  <Badge
                    variant={
                      q.status === "new"
                        ? "warning"
                        : q.status === "in_progress"
                          ? "info"
                          : "success"
                    }
                    dot
                  >
                    {q.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 line-clamp-2 text-sm text-gray-700">
                {q.message}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-gray-500 font-mono">{q.id}</div>
                <span className="text-sm font-medium text-primary">Open detail →</span>
              </div>
            </Card>
          </button>
        ))}

        {!filtered.length ? (
          <Card className="p-6 lg:col-span-2">
            <div className="text-[18px] font-semibold text-gray-800">
              No queries match your filters
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Try clearing the search or switching tabs.
            </div>
            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setSource("all");
                  setStatusTab("all");
                  showToast({
                    type: "success",
                    title: "Filters cleared",
                    message: "Showing all queries.",
                  });
                }}
              >
                Clear filters
              </Button>
            </div>
          </Card>
        ) : null}
      </div>

      <Modal
        open={newQueryOpen}
        title="New Query"
        onClose={() => setNewQueryOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setNewQueryOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={async () => {
                const nextErrors: typeof draftErrors = {};
                if (!draft.customer.trim()) nextErrors.customer = "Customer is required.";
                if (!draft.message.trim()) nextErrors.message = "Message is required.";
                if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
                  nextErrors.email = "Enter a valid email.";
                }
                setDraftErrors(nextErrors);
                if (Object.keys(nextErrors).length) return;

                setSaving(true);
                try {
                  await new Promise((r) => setTimeout(r, 900));
                  const nextQuery: Query = {
                    id: `q-${String(Date.now()).slice(-6)}`,
                    customer: draft.customer.trim(),
                    company: draft.company.trim() || "—",
                    phone: draft.phone.trim() || "—",
                    email: draft.email.trim() || undefined,
                    message: draft.message.trim(),
                    source: draft.source,
                    status: "new",
                    received: formatDateTimeUG(new Date()),
                    notes: [],
                    assigned_to: null,
                  };
                  const next = [...readQueries(), nextQuery];
                  writeQueries(next);
                  setQueries(next);
                  showToast({
                    type: "success",
                    title: "Saved",
                    message: "Query added to the active service queue.",
                  });
                  setNewQueryOpen(false);
                  setDraft({
                    customer: "",
                    company: "",
                    phone: "",
                    email: "",
                    message: "",
                    source: "online",
                  });
                  setDraftErrors({});
                } finally {
                  setSaving(false);
                }
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Customer</label>
            <input
              value={draft.customer}
              onChange={(e) => setDraft((p) => ({ ...p, customer: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {draftErrors.customer ? (
              <div className="mt-1 text-xs text-red-600">{draftErrors.customer}</div>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Company</label>
            <input
              value={draft.company}
              onChange={(e) => setDraft((p) => ({ ...p, company: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input
              value={draft.phone}
              onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              value={draft.email}
              onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {draftErrors.email ? (
              <div className="mt-1 text-xs text-red-600">{draftErrors.email}</div>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Source</label>
            <select
              value={draft.source}
              onChange={(e) => setDraft((p) => ({ ...p, source: e.target.value as QuerySource }))}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="online">Online</option>
              <option value="walk_in">Walk-in</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={draft.message}
              onChange={(e) => setDraft((p) => ({ ...p, message: e.target.value }))}
              className="mt-2 h-28 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {draftErrors.message ? (
              <div className="mt-1 text-xs text-red-600">{draftErrors.message}</div>
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  );
}
