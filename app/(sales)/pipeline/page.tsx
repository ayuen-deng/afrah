"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, SlidersHorizontal, ArrowUpDown } from "lucide-react";

import { mockLeads } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type Stage = "new" | "contacted" | "quoted" | "negotiating" | "won" | "lost";

type Lead = (typeof mockLeads)[number] & {
  stage: Stage;
  days_in_stage: number;
  phone: string;
  email?: string;
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

function writeLeads(next: Lead[]) {
  window.localStorage.setItem("afrah_sales_leads", JSON.stringify(next));
  window.dispatchEvent(new Event("afrah_sales_leads_updated"));
}

const stageOrder: Stage[] = ["new", "contacted", "quoted", "negotiating", "won", "lost"];

const stageLabel: Record<Stage, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost",
};

function stageVariant(stage: Stage) {
  if (stage === "won") return "success" as const;
  if (stage === "lost") return "error" as const;
  if (stage === "quoted") return "info" as const;
  if (stage === "negotiating") return "warning" as const;
  return "neutral" as const;
}

function DroppableColumn({
  id,
  title,
  count,
  children,
}: {
  id: Stage;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="min-w-[280px]">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <Badge variant="neutral">{count}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={[
          "mt-3 min-h-[140px] rounded-xl border border-gray-200 bg-white p-3",
          isOver ? "ring-2 ring-primary/20" : "",
        ].join(" ")}
      >
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const draggableId = `lead:${lead.id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
  });

  const style: React.CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : {};

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={[
        "w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm",
        "hover:bg-gray-50",
        isDragging ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-900">{lead.company}</div>
          <div className="mt-1 text-xs text-gray-500">
            {lead.contact} • {lead.phone}
          </div>
        </div>
        {lead.days_in_stage > 7 ? (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
            {lead.days_in_stage}d ⚠
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            {lead.days_in_stage}d
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">{formatUGX(lead.budget)}</div>
        <Badge variant={stageVariant(lead.stage)} dot>
          {stageLabel[lead.stage]}
        </Badge>
      </div>
    </button>
  );
}

const addSchema = z.object({
  company: z.string().min(2, "Company is required."),
  contact: z.string().min(2, "Contact is required."),
  phone: z.string().min(7, "Phone is required."),
  email: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  industry: z.string().min(2, "Industry is required."),
  source: z.string().min(2, "Source is required."),
  budget: z.number().refine((n) => Number.isFinite(n), "Enter a valid number.").min(0),
});

type AddValues = z.infer<typeof addSchema>;

export default function SalesPipelinePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [view, setView] = React.useState<"kanban" | "list">("kanban");
  const [sort, setSort] = React.useState<{
    key: "company" | "budget" | "days_in_stage";
    dir: "asc" | "desc";
  }>({ key: "company", dir: "asc" });
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [search, setSearch] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      company: "",
      contact: "",
      phone: "",
      email: "",
      industry: "FMCG",
      source: "Referral",
      budget: 12000000,
    },
  });

  React.useEffect(() => {
    const stored = readLeads();
    if (stored.length) {
      setLeads(stored);
      return;
    }
    const seeded = (mockLeads as unknown as Lead[]).map((l) => ({ ...l }));
    writeLeads(seeded);
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

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.company.toLowerCase().includes(q) ||
        l.contact.toLowerCase().includes(q) ||
        String(l.budget).includes(q),
    );
  }, [leads, search]);

  const listData = React.useMemo(() => {
    if (view !== "list") return filtered;
    const next = [...filtered];
    next.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "company") return a.company.localeCompare(b.company) * dir;
      if (sort.key === "budget") return (a.budget - b.budget) * dir;
      return (a.days_in_stage - b.days_in_stage) * dir;
    });
    return next;
  }, [filtered, sort.dir, sort.key, view]);

  function toggleSort(key: "company" | "budget" | "days_in_stage") {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  }

  const byStage = React.useMemo(() => {
    const grouped: Record<Stage, Lead[]> = {
      new: [],
      contacted: [],
      quoted: [],
      negotiating: [],
      won: [],
      lost: [],
    };
    filtered.forEach((l) => grouped[l.stage].push(l));
    return grouped;
  }, [filtered]);

  function moveLead(leadId: string, nextStage: Stage) {
    const lead = leads.find((l) => l.id === leadId) ?? null;
    if (!lead) return;
    if (lead.stage === nextStage) return;
    const next = leads.map((l) => (l.id === leadId ? { ...l, stage: nextStage, days_in_stage: 1 } : l));
    setLeads(next);
    writeLeads(next);
    showToast({
      type: "success",
      title: "Updated",
      message: `${lead.company} moved to ${stageLabel[nextStage]}.`,
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;
    const activeId = String(event.active.id);
    if (!activeId.startsWith("lead:")) return;
    const leadId = activeId.slice("lead:".length);
    if (!stageOrder.includes(overId as Stage)) return;
    moveLead(leadId, overId as Stage);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Pipeline</div>
          <div className="mt-1 text-sm text-gray-600">
            Kanban + list view. Drag cards between stages (dnd-kit).
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setView("kanban")}
              className={[
                "rounded-md px-3 py-1.5 text-sm font-medium",
                view === "kanban" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={[
                "rounded-md px-3 py-1.5 text-sm font-medium",
                view === "list" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              List
            </button>
          </div>
          <Button variant="secondary" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, contact, budget…"
              className="w-full text-sm text-gray-900 outline-none"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              showToast({
                type: "info",
                title: "Sort",
                message: "Sorting controls are available in list view.",
              })
            }
          >
            <ArrowUpDown className="h-4 w-4" />
            Sort
          </Button>
        </div>
      </Card>

      {view === "kanban" ? (
        <DndContext onDragEnd={onDragEnd}>
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-2">
              {stageOrder.map((s) => (
                <DroppableColumn
                  key={s}
                  id={s}
                  title={stageLabel[s]}
                  count={byStage[s].length}
                >
                  {byStage[s].map((l) => (
                    <LeadCard key={l.id} lead={l} onClick={() => router.push(`/leads/${l.id}`)} />
                  ))}
                </DroppableColumn>
              ))}
            </div>
          </div>
        </DndContext>
      ) : (
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Leads List</div>
          <div className="mt-6">
            <DataTable<Lead>
              data={listData}
              rowKey={(l) => l.id}
              onRowClick={(l) => router.push(`/leads/${l.id}`)}
              columns={[
                {
                  key: "company",
                  header: (
                    <button
                      type="button"
                      onClick={() => toggleSort("company")}
                      className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-gray-700"
                    >
                      Company <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  ),
                  cell: (l) => l.company,
                },
                { key: "contact", header: "Contact", cell: (l) => l.contact },
                {
                  key: "budget",
                  header: (
                    <button
                      type="button"
                      onClick={() => toggleSort("budget")}
                      className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-gray-700"
                    >
                      Budget <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  ),
                  cell: (l) => <span className="font-medium">{formatUGX(l.budget)}</span>,
                  className: "whitespace-nowrap",
                },
                {
                  key: "stage",
                  header: "Stage",
                  cell: (l) => (
                    <Badge variant={stageVariant(l.stage)} dot>
                      {stageLabel[l.stage]}
                    </Badge>
                  ),
                },
                {
                  key: "days",
                  header: (
                    <button
                      type="button"
                      onClick={() => toggleSort("days_in_stage")}
                      className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-gray-700"
                    >
                      Days <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  ),
                  cell: (l) => <span className="font-mono">{l.days_in_stage}</span>,
                },
              ]}
            />
          </div>
        </Card>
      )}

      <Modal
        open={addOpen}
        title="Add Lead"
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={form.handleSubmit(async (values) => {
                setSaving(true);
                try {
                  await new Promise((r) => setTimeout(r, 900));
                  const nextLead: Lead = {
                    id: `lead-${String(Date.now()).slice(-6)}`,
                    company: values.company,
                    contact: values.contact,
                    phone: values.phone,
                    email: values.email || undefined,
                    photo: `https://picsum.photos/seed/lead${Math.floor(Math.random() * 1000)}/100/100`,
                    initials: values.contact
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join(""),
                    color: "bg-blue-500",
                    industry: values.industry,
                    source: values.source,
                    budget: values.budget,
                    stage: "new",
                    days_in_stage: 1,
                    activities: [],
                  };
                  const next = [nextLead, ...leads];
                  setLeads(next);
                  writeLeads(next);
                  showToast({
                    type: "success",
                    title: "Added",
                    message: `${nextLead.company} added to New.`,
                  });
                  setAddOpen(false);
                  form.reset();
                } finally {
                  setSaving(false);
                }
              })}
            >
              Add Lead
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Company</label>
            <input
              {...form.register("company")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.company ? (
              <div className="mt-1 text-xs text-red-600">{form.formState.errors.company.message}</div>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Contact</label>
            <input
              {...form.register("contact")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.contact ? (
              <div className="mt-1 text-xs text-red-600">{form.formState.errors.contact.message}</div>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input
              {...form.register("phone")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.phone ? (
              <div className="mt-1 text-xs text-red-600">{form.formState.errors.phone.message}</div>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Email (optional)</label>
            <input
              {...form.register("email")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.email ? (
              <div className="mt-1 text-xs text-red-600">{form.formState.errors.email.message as string}</div>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Industry</label>
            <input
              {...form.register("industry")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.industry ? (
              <div className="mt-1 text-xs text-red-600">{form.formState.errors.industry.message}</div>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Source</label>
            <input
              {...form.register("source")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.source ? (
              <div className="mt-1 text-xs text-red-600">{form.formState.errors.source.message}</div>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Budget (UGX)</label>
            <input
              type="number"
              {...form.register("budget", { valueAsNumber: true })}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.budget ? (
              <div className="mt-1 text-xs text-red-600">{form.formState.errors.budget.message}</div>
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  );
}
