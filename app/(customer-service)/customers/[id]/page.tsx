"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

import { mockBookings, mockCustomers, mockInvoices } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";
import { BackButton } from "@/components/ui/BackButton";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/Toast";

type Customer = (typeof mockCustomers)[number] & { vip?: boolean; notes?: string[] };
type Invoice = (typeof mockInvoices)[number];

type QuoteStatus = "sent" | "accepted" | "draft" | "expired";

type QuoteItem = {
  id: string;
  screenId: string;
  screen: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  amount: number;
};

type Quote = {
  id: string;
  number: string;
  customer: string;
  company: string;
  valid_until: string;
  total: number;
  status: QuoteStatus;
  items: QuoteItem[];
};

function readQuotes(): Quote[] {
  try {
    const raw = window.localStorage.getItem("afrah_cs_quotes");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Quote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readCustomers(): Customer[] {
  try {
    const raw = window.localStorage.getItem("afrah_cs_customers");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Customer[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCustomers(next: Customer[]) {
  window.localStorage.setItem("afrah_cs_customers", JSON.stringify(next));
  window.dispatchEvent(new Event("afrah_cs_customers_updated"));
}

export default function CustomerProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [tab, setTab] = React.useState<
    "overview" | "campaigns" | "quotes" | "invoices" | "notes"
  >("overview");
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    const stored = readCustomers();
    if (stored.length) {
      setCustomers(stored);
      return;
    }
    const seeded = (mockCustomers as Customer[]).map((c) => ({
      ...c,
      vip: c.status === "vip",
      notes: [],
    }));
    writeCustomers(seeded);
    setCustomers(seeded);
  }, []);

  React.useEffect(() => {
    setQuotes(readQuotes());
    const onUpdate = () => setQuotes(readQuotes());
    window.addEventListener("afrah_cs_quotes_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_cs_quotes_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const customer = customers.find((c) => c.id === params.id) ?? null;
  const campaigns = mockBookings.filter((b) => b.customer_id === params.id);
  const invoices = mockInvoices.filter((i) => i.customer === customer?.name);
  const customerQuotes = quotes.filter(
    (q) => q.customer === customer?.name || q.company === customer?.company,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <BackButton className="mt-1" />
          <div>
            <div className="text-[24px] font-semibold text-gray-900">
              Customer Profile
            </div>
            <div className="mt-1 text-sm text-gray-600">
              ID: <span className="font-mono">{params.id}</span>
            </div>
          </div>
        </div>

        {customer ? (
          <Button
            variant={customer.vip ? "secondary" : "primary"}
            onClick={() => {
              const next = customers.map((c) =>
                c.id === customer.id ? { ...c, vip: !c.vip } : c,
              );
              setCustomers(next);
              writeCustomers(next);
              showToast({
                type: "success",
                title: "Updated",
                message: `${customer.name} is now ${customer.vip ? "not VIP" : "VIP"}.`,
              });
            }}
          >
            <Star className="h-4 w-4" />
            {customer.vip ? "Remove VIP" : "Mark VIP"}
          </Button>
        ) : null}
      </div>

      {customer ? (
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={customer.photo} alt="" className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="text-[18px] font-semibold text-gray-800">
                  {customer.name}
                </div>
                <div className="mt-1 text-sm text-gray-600">{customer.company}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{customer.phone}</Badge>
                  <Badge variant="neutral">{customer.email}</Badge>
                  {customer.vip ? (
                    <Badge variant="success" dot>
                      VIP
                    </Badge>
                  ) : (
                    <Badge variant="info" dot>
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-2 text-right">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Total spent
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatUGX(customer.total_spent)}
              </div>
              <div className="text-xs text-gray-500">
                Campaigns: <span className="font-semibold">{customer.total_campaigns}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {(
              [
                { k: "overview", label: "Overview" },
                { k: "campaigns", label: "Campaigns" },
                { k: "quotes", label: "Quotes" },
                { k: "invoices", label: "Invoices" },
                { k: "notes", label: "Notes" },
              ] as const
            ).map((t) => {
              const active = tab === t.k;
              return (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setTab(t.k)}
                  className={
                    active
                      ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                      : "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Loading…</div>
        </Card>
      )}

      {customer ? (
        <>
          {tab === "overview" ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="p-6">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Quick actions
                </div>
                <div className="mt-4 grid gap-2">
                  <Button onClick={() => router.push("/quotes/new")}>Create Quote</Button>
                  <Button variant="secondary" onClick={() => router.push("/book")}>
                    Book for Customer
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      showToast({
                        type: "success",
                        title: "Saved",
                        message: "Reach-out activity logged (demo).",
                      })
                    }
                  >
                    Log Reach Out
                  </Button>
                </div>
              </Card>

              <Card className="p-6 lg:col-span-2">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Summary
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Last campaign
                    </div>
                    <div className="mt-2 text-sm font-mono text-gray-900">
                      {customer.last_campaign}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Status
                    </div>
                    <div className="mt-2">
                      <Badge variant={customer.vip ? "success" : "info"} dot>
                        {customer.vip ? "VIP" : "ACTIVE"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : null}

          {tab === "campaigns" ? (
            <Card className="p-6">
              <div className="text-[18px] font-semibold text-gray-800">Campaigns</div>
              <div className="mt-1 text-sm text-gray-600">
                Click a row to open booking details in the customer portal.
              </div>
              <div className="mt-6">
                <DataTable
                  data={campaigns}
                  rowKey={(b) => b.id}
                  onRowClick={(b) => router.push(`/dashboard/customer/campaigns/${b.id}`)}
                  columns={[
                    { key: "ref", header: "Ref", cell: (b) => <span className="font-mono">{b.ref}</span> },
                    { key: "screen", header: "Screen", cell: (b) => b.screen },
                    { key: "duration", header: "Duration", cell: (b) => b.duration, className: "whitespace-nowrap" },
                    { key: "amount", header: "Amount", cell: (b) => <span className="font-medium">{formatUGX(b.amount)}</span>, className: "whitespace-nowrap" },
                    { key: "status", header: "Status", cell: (b) => <Badge variant={b.campaign_status === "live" ? "success" : b.campaign_status === "scheduled" ? "info" : "neutral"} dot>{b.campaign_status.toUpperCase()}</Badge> },
                  ]}
                />
              </div>
            </Card>
          ) : null}

          {tab === "invoices" ? (
            <Card className="p-6">
              <div className="text-[18px] font-semibold text-gray-800">Invoices</div>
              <div className="mt-6">
                <DataTable<Invoice>
                  data={invoices}
                  rowKey={(i) => i.id}
                  columns={[
                    {
                      key: "number",
                      header: "Number",
                      cell: (i) => <span className="font-mono">{i.number}</span>,
                    },
                    { key: "screen", header: "Screen", cell: (i) => i.screen },
                    {
                      key: "total",
                      header: "Total",
                      cell: (i) => (
                        <span className="font-medium">{formatUGX(i.total)}</span>
                      ),
                      className: "whitespace-nowrap",
                    },
                    {
                      key: "status",
                      header: "Status",
                      cell: (i) => (
                        <Badge
                          variant={
                            i.status === "paid"
                              ? "success"
                              : i.status === "unpaid"
                                ? "warning"
                                : "error"
                          }
                          dot
                        >
                          {String(i.status).toUpperCase()}
                        </Badge>
                      ),
                    },
                  ]}
                />
              </div>
            </Card>
          ) : null}

          {tab === "quotes" ? (
            <Card className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-[18px] font-semibold text-gray-800">Quotes</div>
                  <div className="mt-1 text-sm text-gray-600">
                    Quotes for {customer?.name ?? "this customer"}.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => router.push("/quotes")}>
                    Open Quotations
                  </Button>
                  <Button onClick={() => router.push("/quotes/new")}>Create Quote</Button>
                </div>
              </div>

              <div className="mt-6">
                <DataTable<Quote>
                  data={customerQuotes}
                  rowKey={(q) => q.id}
                  onRowClick={(q) => {
                    window.localStorage.setItem("afrah_cs_quote_focus", q.id);
                    router.push("/quotes");
                  }}
                  columns={[
                    { key: "number", header: "Number", cell: (q) => <span className="font-mono">{q.number}</span> },
                    {
                      key: "screens",
                      header: "Screens",
                      cell: (q) => (
                        <span className="text-sm text-gray-700">
                          {q.items.length} screen{q.items.length === 1 ? "" : "s"}
                        </span>
                      ),
                    },
                    {
                      key: "total",
                      header: "Total",
                      cell: (q) => <span className="font-medium">{formatUGX(q.total)}</span>,
                      className: "whitespace-nowrap",
                    },
                    {
                      key: "status",
                      header: "Status",
                      cell: (q) => (
                        <Badge
                          variant={
                            q.status === "accepted"
                              ? "success"
                              : q.status === "sent"
                                ? "info"
                                : q.status === "draft"
                                  ? "warning"
                                  : "error"
                          }
                          dot
                        >
                          {q.status.toUpperCase()}
                        </Badge>
                      ),
                      className: "whitespace-nowrap",
                    },
                    {
                      key: "valid",
                      header: "Valid Until",
                      cell: (q) => <span className="font-mono text-sm">{q.valid_until}</span>,
                      className: "whitespace-nowrap",
                    },
                  ]}
                />
                {!customerQuotes.length ? (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                    No quotes yet for this customer.
                  </div>
                ) : null}
              </div>
            </Card>
          ) : null}

          {tab === "notes" ? (
            <Card className="p-6">
              <div className="text-[18px] font-semibold text-gray-800">Notes</div>
              <div className="mt-2 text-sm text-gray-600">
                Internal-only notes about the customer.
              </div>
              <div className="mt-6 space-y-3">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-24 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Write a note…"
                />
                <div className="flex items-center justify-end">
                  <Button
                    onClick={() => {
                      const text = note.trim();
                      if (!text) {
                        showToast({ type: "error", title: "Empty note", message: "Type a note first." });
                        return;
                      }
                      const next = customers.map((c) =>
                        c.id === customer.id
                          ? { ...c, notes: [...(c.notes ?? []), text] }
                          : c,
                      );
                      setCustomers(next);
                      writeCustomers(next);
                      setNote("");
                      showToast({ type: "success", title: "Saved", message: "Note added." });
                    }}
                  >
                    Add Note
                  </Button>
                </div>
                {(customer.notes ?? []).length ? (
                  <div className="space-y-2">
                    {(customer.notes ?? []).map((n, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                        {n}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                    No notes yet.
                  </div>
                )}
              </div>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
