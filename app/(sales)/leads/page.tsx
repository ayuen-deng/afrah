"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Phone, Plus, Search } from "lucide-react";

import { mockLeads } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/Toast";

type Stage = "new" | "contacted" | "quoted" | "negotiating" | "won" | "lost";
type Lead = (typeof mockLeads)[number] & { stage: Stage; days_in_stage: number; phone: string; email?: string };

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

function seedLeadsIfMissing() {
  const existing = readLeads();
  if (existing.length) return;
  const seeded = (mockLeads as unknown as Lead[]).map((l) => ({ ...l, phone: l.phone ?? "0771000000", email: l.email ?? undefined }));
  window.localStorage.setItem("afrah_sales_leads", JSON.stringify(seeded));
  window.dispatchEvent(new Event("afrah_sales_leads_updated"));
}

function toWhatsappLink(phone: string) {
  const digits = phone.replace(/\\D/g, "");
  const normalized = digits.startsWith("0") ? `256${digits.slice(1)}` : digits.startsWith("256") ? digits : `256${digits}`;
  return `https://wa.me/${normalized}`;
}

const stageTabs: Array<{ key: "all" | Stage; label: string }> = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "quoted", label: "Quoted" },
  { key: "negotiating", label: "Negotiating" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export default function SalesLeadsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [tab, setTab] = React.useState<"all" | Stage>("all");
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    seedLeadsIfMissing();
    setLeads(readLeads());
    const onUpdate = () => setLeads(readLeads());
    window.addEventListener("afrah_sales_leads_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_sales_leads_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads
      .filter((l) => (tab === "all" ? true : l.stage === tab))
      .filter((l) => {
        if (!q) return true;
        return l.company.toLowerCase().includes(q) || l.contact.toLowerCase().includes(q);
      });
  }, [leads, tab, query]);

  const columns: DataTableColumn<Lead>[] = React.useMemo(
    () => [
      {
        key: "lead",
        header: "Lead",
        cell: (l) => (
          <div className="flex items-center gap-3">
            <img src={l.photo} alt={l.company} className="h-9 w-9 rounded-full object-cover" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-gray-900">{l.company}</div>
              <div className="mt-0.5 truncate text-xs text-gray-500">
                {l.contact} • {l.phone}
              </div>
            </div>
          </div>
        ),
        className: "min-w-[260px]",
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
      { key: "value", header: "Value", cell: (l) => <span className="font-medium text-gray-900">{formatUGX(l.budget)}</span> },
      {
        key: "quick",
        header: "Quick",
        cell: (l) => (
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              window.open(toWhatsappLink(l.phone), "_blank", "noopener,noreferrer");
              showToast({ type: "success", title: "Reach out", message: `Opening WhatsApp chat for ${l.company}.` });
            }}
          >
            <Phone className="h-4 w-4" />
            WhatsApp
          </Button>
        ),
        className: "min-w-[170px]",
      },
    ],
    [showToast],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">My Leads</div>
          <div className="mt-1 text-sm text-gray-600">Real-time search + stage tabs.</div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => showToast({ type: "success", title: "Export ready", message: "Leads export prepared successfully." })}
          >
            Export
          </Button>
          <Button onClick={() => showToast({ type: "info", title: "Add lead", message: "Use Pipeline → Add Lead for now." })}>
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {stageTabs.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={[
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    active ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="mt-6">
          <DataTable
            data={filtered}
            rowKey={(l) => l.id}
            columns={columns}
            onRowClick={(l) => router.push(`/leads/${l.id}`)}
            rowActions={(l) => [{ label: "Open details", onClick: () => router.push(`/leads/${l.id}`) }]}
          />
        </div>
      </Card>
    </div>
  );
}

