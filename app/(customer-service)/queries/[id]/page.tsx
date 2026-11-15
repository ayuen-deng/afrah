"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Pencil, Phone, Send, UserRound, UserSquare2 } from "lucide-react";

import { mockQueries } from "@/lib/mockData";
import { formatDateTimeUG } from "@/lib/dates";
import { BackButton } from "@/components/ui/BackButton";
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

function statusVariant(status: QueryStatus) {
  if (status === "new") return "warning" as const;
  if (status === "in_progress") return "info" as const;
  return "success" as const;
}

export default function CustomerServiceQueryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const [queries, setQueries] = React.useState<Query[]>([]);
  const [activeTab, setActiveTab] = React.useState<"details" | "notes">("details");
  const [noteText, setNoteText] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [editingMessage, setEditingMessage] = React.useState(false);
  const [messageDraft, setMessageDraft] = React.useState("");

  const [convertOpen, setConvertOpen] = React.useState(false);
  const [bookOpen, setBookOpen] = React.useState(false);

  React.useEffect(() => {
    const stored = readQueries();
    if (stored.length) {
      setQueries(stored);
      return;
    }
    const seeded: Query[] = mockQueries.map((q) => ({
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

  const query = React.useMemo(
    () => queries.find((q) => q.id === params.id) ?? null,
    [queries, params.id],
  );

  React.useEffect(() => {
    if (query && !editingMessage) {
      setMessageDraft(query.message ?? "");
    }
  }, [editingMessage, query]);

  if (!query && queries.length) {
    return (
      <Card>
        <div className="text-[18px] font-semibold text-gray-800">Query not found</div>
        <div className="mt-2 text-sm text-gray-600">
          The query ID <span className="font-mono">{params.id}</span> does not exist.
        </div>
        <div className="mt-6">
          <Link href="/queries">
            <Button variant="secondary">Back to Queries</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const initials = (query?.customer ?? "Q")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sourceLabel = query?.source ? query.source.replace("_", " ").toUpperCase() : "—";
  const statusLabel = query?.status ? query.status.replace("_", " ").toUpperCase() : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <BackButton className="mt-1" />
          <div>
            <div className="text-[24px] font-semibold text-gray-900">
              Query Detail
            </div>
            <div className="mt-1 text-sm text-gray-600">
              ID: <span className="font-mono">{params.id}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {query ? (
            <>
              <Badge variant={statusVariant(query.status)} dot>
                {statusLabel}
              </Badge>
              <Badge variant="neutral">{sourceLabel}</Badge>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-900">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-[18px] font-semibold text-gray-800">
                  {query?.customer ?? "Loading..."}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {query?.company ?? "—"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Received
              </div>
              <div className="mt-1 text-sm font-mono text-gray-900">
                {query?.received ?? "—"}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={
                activeTab === "details"
                  ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                  : "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              }
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className={
                activeTab === "notes"
                  ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                  : "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              }
            >
              Internal Notes
              <span className="ml-2 rounded-md bg-white/15 px-2 py-0.5 text-xs">
                {query?.notes?.length ?? 0}
              </span>
            </button>
          </div>

          {activeTab === "details" ? (
            <div className="mt-6 space-y-4">
              <Card className="p-5">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Contact
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Phone
                    </div>
                    <a
                      href={query?.phone ? `tel:${query.phone}` : "#"}
                      className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      onClick={(e) => {
                        if (!query?.phone) e.preventDefault();
                      }}
                    >
                      <Phone className="h-4 w-4" />
                      {query?.phone ?? "—"}
                    </a>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Email
                    </div>
                    <a
                      href={query?.email ? `mailto:${query.email}` : "#"}
                      className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      onClick={(e) => {
                        if (!query?.email) e.preventDefault();
                      }}
                    >
                      <Send className="h-4 w-4" />
                      {query?.email ?? "—"}
                    </a>
                  </div>
                </div>
              </Card>

                            <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Message
                  </div>
                  {!editingMessage ? (
                    <Button
                      variant="ghost"
                      className="h-8 px-2 text-xs text-gray-600"
                      onClick={() => {
                        setMessageDraft(query?.message ?? "");
                        setEditingMessage(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  ) : null}
                </div>
                {!editingMessage ? (
                  <div className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                    {query?.message ?? "—"}
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <textarea
                      value={messageDraft}
                      onChange={(event) => setMessageDraft(event.target.value)}
                      className="min-h-[110px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="secondary" onClick={() => setEditingMessage(false)}>
                        Cancel
                      </Button>
                      <Button
                        loading={saving}
                        onClick={async () => {
                          if (!query) return;
                          const updatedMessage = messageDraft.trim();
                          if (!updatedMessage) {
                            showToast({
                              type: "error",
                              title: "Message is empty",
                              message: "Enter a message before saving.",
                            });
                            return;
                          }
                          setSaving(true);
                          try {
                            await new Promise((resolve) => setTimeout(resolve, 700));
                            const next = queries.map((item) =>
                              item.id === query.id ? { ...item, message: updatedMessage } : item,
                            );
                            setQueries(next);
                            writeQueries(next);
                            setEditingMessage(false);
                            showToast({
                              type: "success",
                              title: "Message updated",
                              message: "Message updated.",
                            });
                          } finally {
                            setSaving(false);
                          }
                        }}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <Card className="p-5">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Add note
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="mt-3 h-24 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Write an internal note..."
                />
                <div className="mt-3 flex items-center justify-end">
                  <Button
                    loading={saving}
                    onClick={async () => {
                      if (!query) return;
                      const text = noteText.trim();
                      if (!text) {
                        showToast({
                          type: "error",
                          title: "Note is empty",
                          message: "Type a note before saving.",
                        });
                        return;
                      }
                      setSaving(true);
                      try {
                        await new Promise((r) => setTimeout(r, 600));
                        const nextNote: Note = {
                          text,
                          author: "Diana Auma",
                          time: formatDateTimeUG(new Date()),
                        };
                        const next = queries.map((q) =>
                          q.id === query.id
                            ? { ...q, notes: [...(q.notes ?? []), nextNote] }
                            : q,
                        );
                        setQueries(next);
                        writeQueries(next);
                        setNoteText("");
                        showToast({
                          type: "success",
                          title: "Saved",
                          message: "Internal note added.",
                        });
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Save Note
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Notes history
                </div>
                <div className="mt-3 space-y-3">
                  {(query?.notes ?? []).map((n, idx) => (
                    <div key={`${n.time}_${idx}`} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-gray-900">{n.author}</div>
                        <div className="text-xs text-gray-500 font-mono">{n.time}</div>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">{n.text}</div>
                    </div>
                  ))}
                  {!(query?.notes ?? []).length ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                      No notes yet. Add the first note above.
                    </div>
                  ) : null}
                </div>
              </Card>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Status
            </div>
            <select
              value={query?.status ?? "new"}
              onChange={(e) => {
                if (!query) return;
                const nextStatus = e.target.value as QueryStatus;
                const next = queries.map((q) =>
                  q.id === query.id ? { ...q, status: nextStatus } : q,
                );
                setQueries(next);
                writeQueries(next);
                showToast({
                  type: "success",
                  title: "Status updated",
                  message: `Marked as ${nextStatus.replace("_", " ")}.`,
                });
              }}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </Card>

          <Card className="p-6">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Assign to Sales
            </div>
            <select
              value={query?.assigned_to ?? ""}
              onChange={(e) => {
                if (!query) return;
                const val = e.target.value || null;
                const next = queries.map((q) =>
                  q.id === query.id ? { ...q, assigned_to: val } : q,
                );
                setQueries(next);
                writeQueries(next);
                showToast({
                  type: "success",
                  title: "Assigned",
                  message: val ? `Assigned to ${val}.` : "Assignment cleared.",
                });
              }}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Unassigned</option>
              <option value="Demo Principal">Demo Principal</option>
              <option value="Sales Executive (Vacant)">Sales Executive (Vacant)</option>
            </select>
          </Card>

          <Card className="p-6">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Actions
            </div>
            <div className="mt-3 grid gap-2">
              <Button onClick={() => setConvertOpen(true)}>
                <FileText className="h-4 w-4" />
                Convert to Quotation
              </Button>
              <Button variant="secondary" onClick={() => setBookOpen(true)}>
                <UserSquare2 className="h-4 w-4" />
                Book for this Customer
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  showToast({
                    type: "info",
                    title: "Assigned",
                    message: "Use the Assign dropdown to route to Sales.",
                  })
                }
              >
                <UserRound className="h-4 w-4" />
                Assign to Sales
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={convertOpen}
        title="Convert to quotation?"
        onClose={() => setConvertOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConvertOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={async () => {
                if (!query) return;
                setSaving(true);
                try {
                  await new Promise((r) => setTimeout(r, 700));
                  window.localStorage.setItem(
                    "afrah_quote_builder_prefill",
                    JSON.stringify({
                      customer: query.customer,
                      company: query.company ?? "",
                      phone: query.phone ?? "",
                      email: query.email ?? "",
                      source: query.source,
                      query_id: query.id,
                    }),
                  );
                  showToast({
                    type: "success",
                    title: "Quotation started",
                    message: "Opening quotation builder...",
                  });
                  setConvertOpen(false);
                  router.push("/quotes/new");
                } finally {
                  setSaving(false);
                }
              }}
            >
              Continue
            </Button>
          </>
        }
      >
        <div className="text-sm text-gray-700">
          This will pre-fill the quotation builder with this query&apos;s contact details.
        </div>
      </Modal>

      <Modal
        open={bookOpen}
        title="Book for customer?"
        onClose={() => setBookOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setBookOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={async () => {
                if (!query) return;
                setSaving(true);
                try {
                  await new Promise((r) => setTimeout(r, 700));
                  window.localStorage.setItem(
                    "afrah_cs_book_prefill",
                    JSON.stringify({
                      customer: query.customer,
                      company: query.company ?? "",
                      phone: query.phone ?? "",
                      email: query.email ?? "",
                      query_id: query.id,
                    }),
                  );
                  showToast({
                    type: "success",
                    title: "Booking started",
                    message: "Opening booking tool...",
                  });
                  setBookOpen(false);
                  router.push("/book");
                } finally {
                  setSaving(false);
                }
              }}
            >
              Continue
            </Button>
          </>
        }
      >
        <div className="text-sm text-gray-700">
          This opens the &quot;Book for Customer&quot; tool with this customer pre-filled.
        </div>
      </Modal>
    </div>
  );
}



