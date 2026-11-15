"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Crown, MessageCircle, Search, Sparkles } from "lucide-react";

import { mockCustomers } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type RenewalStatus = "active" | "renewal_due" | "inactive";
type Client = (typeof mockCustomers)[number] & {
  renewal_status: RenewalStatus;
  activities: Array<{ id: string; type: string; note: string; time: string }>;
};

function readClients(): Client[] {
  try {
    const raw = window.localStorage.getItem("afrah_sales_clients");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Client[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeClients(next: Client[]) {
  window.localStorage.setItem("afrah_sales_clients", JSON.stringify(next));
  window.dispatchEvent(new Event("afrah_sales_clients_updated"));
}

function seedClientsIfMissing() {
  const existing = readClients();
  if (existing.length) return;
  const base: Client[] = (mockCustomers as unknown as Client[]).map((c, idx) => ({
    ...c,
    renewal_status: (idx === 0 ? "active" : idx === 1 ? "renewal_due" : "inactive") as RenewalStatus,
    activities: [
      { id: `act-${c.id}-001`, type: "Reach out", note: "Initial check-in on latest campaign performance.", time: "04/04/2024 10:10" },
    ],
  }));
  const extras: Client[] = [
    {
      id: "cust-004",
      name: "Moses Kato",
      company: "Roofings Group",
      phone: "0771800009",
      email: "moses@roofings.co.ug",
      initials: "MK",
      color: "bg-amber-500",
      photo: "https://picsum.photos/seed/roofings/100/100",
      total_campaigns: 1,
      total_spent: 6350400,
      last_campaign: "15/03/2024",
      status: "active",
      renewal_status: "renewal_due",
      activities: [],
    },
  ];
  const seeded: Client[] = [...extras, ...base];
  window.localStorage.setItem("afrah_sales_clients", JSON.stringify(seeded));
  window.dispatchEvent(new Event("afrah_sales_clients_updated"));
}

function renewalVariant(status: RenewalStatus) {
  if (status === "active") return "success" as const;
  if (status === "renewal_due") return "warning" as const;
  return "neutral" as const;
}

function renewalLabel(status: RenewalStatus) {
  if (status === "active") return "Active";
  if (status === "renewal_due") return "Renewal Due";
  return "Inactive";
}

function toWhatsappLink(phone: string) {
  const digits = phone.replace(/\\D/g, "");
  const normalized = digits.startsWith("0") ? `256${digits.slice(1)}` : digits.startsWith("256") ? digits : `256${digits}`;
  return `https://wa.me/${normalized}`;
}

export default function SalesClientsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [clients, setClients] = React.useState<Client[]>([]);
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Client | null>(null);

  React.useEffect(() => {
    seedClientsIfMissing();
    setClients(readClients());
    const onUpdate = () => setClients(readClients());
    window.addEventListener("afrah_sales_clients_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_sales_clients_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  React.useEffect(() => {
    const focusCompany = window.localStorage.getItem("afrah_sales_client_focus_company");
    if (!focusCompany) return;
    window.localStorage.removeItem("afrah_sales_client_focus_company");
    const found = clients.find((c) => c.company.toLowerCase() === focusCompany.toLowerCase()) ?? null;
    if (found) setSelected(found);
  }, [clients]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      );
    });
  }, [clients, query]);

  const oneScreenUpsell = React.useMemo(() => clients.filter((c) => (c.total_campaigns ?? 0) === 1), [clients]);
  const inactive60 = React.useMemo(() => clients.filter((c) => c.renewal_status === "inactive"), [clients]);

  const columns: DataTableColumn<Client>[] = React.useMemo(
    () => [
      {
        key: "client",
        header: "Client",
        cell: (c) => (
          <div className="flex items-center gap-3">
            <img src={c.photo} alt={c.name} className="h-9 w-9 rounded-full object-cover" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-semibold text-gray-900">{c.name}</div>
                {c.status === "vip" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    <Crown className="h-3.5 w-3.5" />
                    VIP
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 truncate text-xs text-gray-500">{c.company}</div>
            </div>
          </div>
        ),
        className: "min-w-[260px]",
      },
      {
        key: "spent",
        header: "Spent",
        cell: (c) => <span className="font-medium text-gray-900">{formatUGX(c.total_spent)}</span>,
      },
      {
        key: "renewal",
        header: "Renewal",
        cell: (c) => (
          <Badge variant={renewalVariant(c.renewal_status)} dot>
            {renewalLabel(c.renewal_status)}
          </Badge>
        ),
      },
      {
        key: "reachout",
        header: "Reach Out",
        cell: (c) => (
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              const next = readClients().map((x) =>
                x.id !== c.id
                  ? x
                  : {
                      ...x,
                      activities: [{ id: `act-${Date.now()}`, type: "Reach out", note: "Sent WhatsApp follow-up.", time: "04/04/2024 16:10" }, ...x.activities],
                    },
              );
              writeClients(next);
              window.open(toWhatsappLink(c.phone), "_blank", "noopener,noreferrer");
              showToast({ type: "success", title: "Reach out", message: `Opening WhatsApp chat for ${c.company}.` });
            }}
          >
            <MessageCircle className="h-4 w-4" />
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
          <div className="text-[24px] font-semibold text-gray-900">My Clients</div>
          <div className="mt-1 text-sm text-gray-600">Renewal status + upsell panels.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Export ready", message: "Clients export prepared successfully." })}>
            Export
          </Button>
          <Button onClick={() => router.push("/pipeline")}>Open Pipeline</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[18px] font-semibold text-gray-800">Clients</div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="mt-6">
            <DataTable
              data={filtered}
              columns={columns}
              rowKey={(c) => c.id}
              onRowClick={(c) => setSelected(c)}
              rowActions={(c) => [
                { label: "Open details", onClick: () => setSelected(c) },
                { label: "Create quote", onClick: () => router.push("/quotes/new") },
              ]}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Upsell</div>
          <div className="mt-1 text-sm text-gray-600">Quick opportunities.</div>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Using 1 screen — suggest more</div>
                  <div className="mt-1 text-sm text-gray-600">{oneScreenUpsell.length} client(s) have only used one campaign so far.</div>
                </div>
                <Sparkles className="h-5 w-5 text-warning" />
              </div>
              <div className="mt-3 space-y-2">
                {oneScreenUpsell.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:bg-gray-50"
                    onClick={() => showToast({ type: "info", title: "Upsell", message: `Drafting upsell suggestion for ${c.company}.` })}
                  >
                    <div className="truncate text-sm font-medium text-gray-900">{c.company}</div>
                    <Badge variant="info">1 campaign</Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Inactive 60+ days</div>
                  <div className="mt-1 text-sm text-gray-600">{inactive60.length} client(s) are flagged as inactive.</div>
                </div>
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3 space-y-2">
                {inactive60.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:bg-gray-50"
                    onClick={() => {
                      window.open(toWhatsappLink(c.phone), "_blank", "noopener,noreferrer");
                      showToast({ type: "success", title: "Reach out", message: `Opening WhatsApp chat for ${c.company}.` });
                    }}
                  >
                    <div className="truncate text-sm font-medium text-gray-900">{c.company}</div>
                    <Badge variant="warning">Follow up</Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Client Profile"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (!selected) return;
                window.open(toWhatsappLink(selected.phone), "_blank", "noopener,noreferrer");
                showToast({ type: "success", title: "Reach out", message: `Opening WhatsApp chat for ${selected.company}.` });
              }}
            >
              WhatsApp
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-4">
          <img src={selected?.photo ?? ""} alt={selected?.name ?? "Client"} className="h-16 w-16 rounded-2xl object-cover" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-lg font-semibold text-gray-900">{selected?.name}</div>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 font-mono">{selected?.id}</span>
              {selected ? <Badge variant={renewalVariant(selected.renewal_status)} dot>{renewalLabel(selected.renewal_status)}</Badge> : null}
            </div>
            <div className="mt-1 text-sm text-gray-600">{selected?.company}</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Spent</div>
                <div className="mt-2 text-lg font-bold text-gray-900">{selected ? formatUGX(selected.total_spent) : "—"}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Campaigns</div>
                <div className="mt-2 text-lg font-bold text-gray-900">{selected?.total_campaigns ?? 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-gray-900">Recent activity</div>
          <div className="mt-3 space-y-2">
            {(selected?.activities ?? []).slice(0, 5).map((a) => (
              <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{a.type}</div>
                    <div className="mt-1 text-sm text-gray-600">{a.note}</div>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">{a.time}</div>
                </div>
              </div>
            ))}
            {selected?.activities?.length ? null : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No activity yet.</div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
