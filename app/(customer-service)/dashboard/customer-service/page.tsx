"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, ClipboardList, FileText, MessageCircle, Plus, Users } from "lucide-react";

import { mockQueries, mockReminders, mockVisitors } from "@/lib/mockData";
import { formatDateTimeUG } from "@/lib/dates";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { ReminderCard } from "@/components/ui/ReminderCard";
import { useToast } from "@/components/ui/Toast";

type QuerySource = "online" | "walk_in" | "whatsapp";
type QueryStatus = "new" | "in_progress" | "resolved";

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

type Reminder = {
  id: string;
  contact: string;
  company?: string;
  phone: string;
  note: string;
  due: string;
  urgency?: "high" | "medium" | "low";
  query_id?: string | null;
  done?: boolean;
};

type Visitor = (typeof mockVisitors)[number] & { time_out: string | null };

type VisitorDraft = {
  name: string;
  company: string;
  purpose: string;
  purposeOther: string;
  phone: string;
  time_in: string;
  notes: string;
};

type QueryDraft = {
  customer: string;
  company: string;
  phone: string;
  email: string;
  message: string;
  source: QuerySource;
};

function currentTimeValue() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

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

function readVisitors(): Visitor[] {
  try {
    const raw = window.localStorage.getItem("afrah_cs_visitors");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Visitor[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeVisitors(next: Visitor[]) {
  window.localStorage.setItem("afrah_cs_visitors", JSON.stringify(next));
  window.dispatchEvent(new Event("afrah_cs_visitors_updated"));
}

function readReminders(): Reminder[] {
  try {
    const raw = window.localStorage.getItem("afrah_cs_reminders");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Reminder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeReminders(next: Reminder[]) {
  window.localStorage.setItem("afrah_cs_reminders", JSON.stringify(next));
  window.dispatchEvent(new Event("afrah_cs_reminders_updated"));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CustomerServiceDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [queries, setQueries] = React.useState<Query[]>([]);
  const [visitors, setVisitors] = React.useState<Visitor[]>([]);
  const [reminders, setReminders] = React.useState<Reminder[]>([]);

  const [logVisitorOpen, setLogVisitorOpen] = React.useState(false);
  const [newQueryOpen, setNewQueryOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [visitorDraft, setVisitorDraft] = React.useState<VisitorDraft>({
    name: "",
    company: "",
    purpose: "Advertising Inquiry",
    purposeOther: "",
    phone: "",
    time_in: currentTimeValue(),
    notes: "",
  });

  const [queryDraft, setQueryDraft] = React.useState<QueryDraft>({
    customer: "",
    company: "",
    phone: "",
    email: "",
    message: "",
    source: "online",
  });

  React.useEffect(() => {
    const stored = readQueries();
    if (stored.length) {
      setQueries(stored);
    } else {
      const seed: Query[] = mockQueries.map((query) => ({
        id: query.id,
        customer: query.customer,
        company: query.company,
        phone: query.phone,
        email: query.email,
        message: query.message,
        source: query.source as QuerySource,
        status: query.status as QueryStatus,
        received: query.received,
        notes: (query.notes as unknown as Note[]) ?? [],
        assigned_to: (query as { assigned_to?: string | null }).assigned_to ?? null,
      }));
      writeQueries(seed);
      setQueries(seed);
    }

    const storedVisitors = readVisitors();
    if (storedVisitors.length) {
      setVisitors(storedVisitors);
    } else {
      const seed = (mockVisitors as unknown as Visitor[]).map((visitor) => ({ ...visitor }));
      writeVisitors(seed);
      setVisitors(seed);
    }

    const existingReminders = readReminders();
    if (existingReminders.length) {
      setReminders(existingReminders);
    } else {
      const seed: Reminder[] = mockReminders.map((reminder) => ({
        ...reminder,
        urgency: (reminder.urgency ?? "low") as "high" | "medium" | "low",
        query_id: reminder.id === "rem-001" ? "q-002" : "q-001",
        done: false,
      }));
      writeReminders(seed);
      setReminders(seed);
    }
  }, []);

  React.useEffect(() => {
    const onUpdate = () => {
      setQueries(readQueries());
      setVisitors(readVisitors());
      setReminders(readReminders());
    };
    window.addEventListener("afrah_cs_queries_updated", onUpdate);
    window.addEventListener("afrah_cs_visitors_updated", onUpdate);
    window.addEventListener("afrah_cs_reminders_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_cs_queries_updated", onUpdate);
      window.removeEventListener("afrah_cs_visitors_updated", onUpdate);
      window.removeEventListener("afrah_cs_reminders_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const activeQueries = queries.filter((query) => query.status !== "resolved").length;
  const visitorsToday = visitors.filter((visitor) => visitor.date === "04/04/2024").length;
  const quotesExpiring = 1;
  const campaignsCreated = 7;

  const remindersDue = reminders.filter((reminder) => !reminder.done);
  const currentlyInOffice = visitors.filter((visitor) => visitor.time_out === null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="lg:w-3/5">
          <div className="text-[24px] font-semibold text-gray-900">Good morning, Diana 👋</div>
          <div className="mt-1 text-sm text-gray-600">Today&apos;s queue, reminders, quick actions, and live service activity.</div>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2 lg:w-2/5 lg:justify-end">
          <Button variant="secondary" className="h-9 px-3 text-xs sm:text-sm" onClick={() => setLogVisitorOpen(true)}>
            <Plus className="h-4 w-4" />
            Log a Visitor
          </Button>
          <Button variant="secondary" className="h-9 px-3 text-xs sm:text-sm" onClick={() => setNewQueryOpen(true)}>
            <Plus className="h-4 w-4" />
            New Query
          </Button>
          <Button className="h-9 px-3 text-xs sm:text-sm" onClick={() => router.push("/quotes/new")}>
            <FileText className="h-4 w-4" />
            Create Quote
          </Button>
          <Button variant="secondary" className="h-9 px-3 text-xs sm:text-sm" onClick={() => router.push("/book")}>
            <ClipboardList className="h-4 w-4" />
            Book for Customer
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard icon={MessageCircle} iconColorClassName="bg-blue-100 text-primary" value={activeQueries} label="Active Queries" trend={{ value: "+12.5%", direction: "up" }} />
        <StatCard icon={ClipboardList} iconColorClassName="bg-amber-100 text-warning" value={visitorsToday} label="Today's Visitors" trend={{ value: "+4.1%", direction: "up" }} />
        <StatCard icon={CalendarClock} iconColorClassName="bg-red-100 text-error" value={quotesExpiring} label="Quotes Expiring" trend={{ value: "-1.2%", direction: "down" }} />
        <StatCard icon={Users} iconColorClassName="bg-green-100 text-success" value={campaignsCreated} label="Campaigns Created" trend={{ value: "+9.0%", direction: "up" }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[18px] font-semibold text-gray-800">Follow-up reminders due today</div>
              <div className="mt-1 text-sm text-gray-600">Mark done or snooze — badge count updates instantly.</div>
            </div>
            <Button variant="secondary" onClick={() => router.push("/reminders")}>
              Manage
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            {remindersDue.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                name={reminder.contact}
                company={reminder.company}
                note={reminder.note}
                dueText={reminder.due}
                dueTone={
                  reminder.due.toLowerCase().includes("overdue")
                    ? "overdue"
                    : reminder.due.toLowerCase().includes("due in")
                      ? "soon"
                      : "upcoming"
                }
                urgency={reminder.urgency ?? "low"}
                onDone={() => {
                  const next = reminders.map((item) => (item.id === reminder.id ? { ...item, done: true } : item));
                  setReminders(next);
                  writeReminders(next);
                  showToast({ type: "success", title: "Reminder done", message: `${reminder.contact} updated.` });
                }}
                onSecondary={() => {
                  const next = reminders.map((item) =>
                    item.id === reminder.id ? { ...item, due: "Due tomorrow, 9:00 AM" } : item,
                  );
                  setReminders(next);
                  writeReminders(next);
                  showToast({ type: "success", title: "Snoozed", message: "Reminder snoozed by one day." });
                }}
              />
            ))}

            {!remindersDue.length ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">No reminders due today ✓</div>
            ) : null}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[18px] font-semibold text-gray-800">Currently in Office</div>
            <div className="flex items-center gap-2">
              <Badge variant="info">{currentlyInOffice.length}</Badge>
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                onClick={() => router.push("/visitors")}
              >
                View All →
              </button>
            </div>
          </div>

          {currentlyInOffice.length ? (
            <div className="mt-5 space-y-3">
              {currentlyInOffice.map((visitor) => (
                <ReminderCard
                  key={visitor.id}
                  name={visitor.name}
                  company={visitor.company}
                  note={`Time In: ${visitor.time_in}`}
                  showUrgencyBorder={false}
                  purposeBadge={visitor.purpose}
                  secondaryLabel="Call"
                  onSecondary={() => window.open(`tel:${visitor.phone}`, "_self")}
                  doneLabel="Log Time Out"
                  onDone={() => {
                    const next = visitors.map((entry) => (entry.id === visitor.id ? { ...entry, time_out: "17:30" } : entry));
                    setVisitors(next);
                    writeVisitors(next);
                    showToast({ type: "success", title: "Logged out", message: `${visitor.name} time-out recorded.` });
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">Office is clear ✓</div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[18px] font-semibold text-gray-800">Active service queue</div>
            <div className="mt-1 text-sm text-gray-600">Click a row to open a rich query detail view.</div>
          </div>
          <Button variant="secondary" onClick={() => router.push("/queries")}>
            View all
          </Button>
        </div>
        <div className="mt-6">
          <DataTable
            data={queries.filter((query) => query.status !== "resolved")}
            rowKey={(query) => query.id}
            onRowClick={(query) => router.push(`/queries/${query.id}`)}
            selectable={false}
            columns={[
              {
                key: "customer",
                header: "Customer",
                cell: (query) => (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://picsum.photos/seed/${query.id}/100/100`} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-sm font-medium text-gray-900">{query.customer}</div>
                      <div className="text-xs text-gray-500">{query.company ?? "—"}</div>
                    </div>
                  </div>
                ),
              },
              { key: "source", header: "Source", cell: (query) => <Badge variant="neutral">{query.source.replace("_", " ").toUpperCase()}</Badge> },
              {
                key: "status",
                header: "Status",
                cell: (query) => (
                  <Badge variant={query.status === "new" ? "warning" : "info"} dot>
                    {query.status.replace("_", " ").toUpperCase()}
                  </Badge>
                ),
              },
              {
                key: "received",
                header: "Received",
                cell: (query) => <span className="font-mono text-sm text-gray-700">{query.received}</span>,
                className: "whitespace-nowrap",
              },
            ]}
          />
        </div>
      </Card>

      <Modal
        open={logVisitorOpen}
        title="Log Visitor"
        className="max-w-sm"
        onClose={() => setLogVisitorOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setLogVisitorOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={async () => {
                const finalPurpose =
                  visitorDraft.purpose === "Other" ? visitorDraft.purposeOther.trim() : visitorDraft.purpose;
                if (!visitorDraft.name.trim() || !visitorDraft.company.trim() || !finalPurpose) {
                  showToast({ type: "error", title: "Missing fields", message: "Name, company, and purpose are required." });
                  return;
                }

                setSaving(true);
                try {
                  await new Promise((resolve) => setTimeout(resolve, 900));
                  const nextVisitor: Visitor = {
                    id: `v-${String(Date.now()).slice(-6)}`,
                    name: visitorDraft.name.trim(),
                    company: visitorDraft.company.trim(),
                    purpose: finalPurpose,
                    phone: visitorDraft.phone.trim() || "—",
                    time_in: visitorDraft.time_in,
                    time_out: null,
                    date: "04/04/2024",
                    logged_by: "Diana Auma",
                  };
                  const next = [...readVisitors(), nextVisitor];
                  writeVisitors(next);
                  setVisitors(next);
                  showToast({ type: "success", title: "Visitor logged", message: "Added to today's visitor list." });
                  setLogVisitorOpen(false);
                  setVisitorDraft({
                    name: "",
                    company: "",
                    purpose: "Advertising Inquiry",
                    purposeOther: "",
                    phone: "",
                    time_in: currentTimeValue(),
                    notes: "",
                  });
                } finally {
                  setSaving(false);
                }
              }}
            >
              Log Visitor
            </Button>
          </>
        }
      >
        <div className="max-h-[80vh] space-y-4 overflow-y-auto">
          <div className="text-sm text-gray-600">Record walk-in visitor details</div>
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
              {initials(visitorDraft.name || "Visitor")}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Visitor Name*
              <input
                value={visitorDraft.name}
                onChange={(event) => setVisitorDraft((current) => ({ ...current, name: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Company*
              <input
                value={visitorDraft.company}
                onChange={(event) => setVisitorDraft((current) => ({ ...current, company: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>

            <div>
              <div className="text-sm font-medium text-gray-700">Purpose of Visit</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {["Advertising Inquiry", "Meeting", "Delivery", "Interview", "Other"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setVisitorDraft((current) => ({ ...current, purpose: option }))}
                    className={
                      visitorDraft.purpose === option
                        ? "rounded-full bg-blue-600 px-3 py-2 text-xs font-medium text-white"
                        : "rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
              {visitorDraft.purpose === "Other" ? (
                <input
                  value={visitorDraft.purposeOther}
                  onChange={(event) => setVisitorDraft((current) => ({ ...current, purposeOther: event.target.value }))}
                  placeholder="Describe purpose"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                />
              ) : null}
            </div>

            <label className="block text-sm font-medium text-gray-700">
              Phone Number
              <input
                value={visitorDraft.phone}
                onChange={(event) => setVisitorDraft((current) => ({ ...current, phone: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Time In
              <input
                type="time"
                value={visitorDraft.time_in}
                onChange={(event) => setVisitorDraft((current) => ({ ...current, time_in: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Notes
              <textarea
                value={visitorDraft.notes}
                onChange={(event) => setVisitorDraft((current) => ({ ...current, notes: event.target.value }))}
                className="mt-1.5 h-24 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        open={newQueryOpen}
        title="New Query"
        className="max-w-sm max-h-[80vh]"
        onClose={() => setNewQueryOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewQueryOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={async () => {
                if (!queryDraft.customer.trim() || !queryDraft.message.trim()) {
                  showToast({ type: "error", title: "Missing fields", message: "Customer name and message are required." });
                  return;
                }
                setSaving(true);
                try {
                  await new Promise((resolve) => setTimeout(resolve, 900));
                  const nextQuery: Query = {
                    id: `q-${String(Date.now()).slice(-6)}`,
                    customer: queryDraft.customer.trim(),
                    company: queryDraft.company.trim() || "—",
                    phone: queryDraft.phone.trim() || "—",
                    email: queryDraft.email.trim() || undefined,
                    message: queryDraft.message.trim(),
                    source: queryDraft.source,
                    status: "new",
                    received: formatDateTimeUG(new Date()),
                    notes: [],
                    assigned_to: null,
                  };
                  const next = [...readQueries(), nextQuery];
                  writeQueries(next);
                  setQueries(next);
                  showToast({ type: "success", title: "Query created", message: "Added to active service queue." });
                  setNewQueryOpen(false);
                  setQueryDraft({ customer: "", company: "", phone: "", email: "", message: "", source: "online" });
                } finally {
                  setSaving(false);
                }
              }}
            >
              Save Query
            </Button>
          </>
        }
      >
        <div className="max-h-[80vh] space-y-4 overflow-y-auto">
          <div className="text-sm text-gray-600">Log a customer inquiry</div>

          <label className="block text-sm font-medium text-gray-700">
            Customer Name*
            <input
              value={queryDraft.customer}
              onChange={(event) => setQueryDraft((current) => ({ ...current, customer: event.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Company
            <input
              value={queryDraft.company}
              onChange={(event) => setQueryDraft((current) => ({ ...current, company: event.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Phone
            <input
              value={queryDraft.phone}
              onChange={(event) => setQueryDraft((current) => ({ ...current, phone: event.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Email
            <input
              value={queryDraft.email}
              onChange={(event) => setQueryDraft((current) => ({ ...current, email: event.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <div>
            <div className="text-sm font-medium text-gray-700">Source</div>
            <div className="mt-2 flex items-center gap-2">
              {[
                { label: "Walk-in", value: "walk_in" as const },
                { label: "Online", value: "online" as const },
                { label: "WhatsApp", value: "whatsapp" as const },
              ].map((source) => (
                <button
                  key={source.value}
                  type="button"
                  onClick={() => setQueryDraft((current) => ({ ...current, source: source.value }))}
                  className={
                    queryDraft.source === source.value
                      ? "rounded-full bg-blue-600 px-3 py-2 text-xs font-medium text-white"
                      : "rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  }
                >
                  {source.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700">
            Message*
            <textarea
              value={queryDraft.message}
              onChange={(event) => setQueryDraft((current) => ({ ...current, message: event.target.value }))}
              className="mt-1.5 h-28 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}


