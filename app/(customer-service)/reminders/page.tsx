"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type Reminder = {
  id: string;
  contact: string;
  phone: string;
  note: string;
  due: string; // DD/MM/YYYY HH:mm
  done?: boolean;
};

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

function writeReminders(reminders: Reminder[]) {
  window.localStorage.setItem("afrah_cs_reminders", JSON.stringify(reminders));
  window.dispatchEvent(new Event("afrah_cs_reminders_updated"));
}

const schema = z.object({
  contact: z.string().min(2, "Contact is required."),
  phone: z.string().min(7, "Phone is required."),
  note: z.string().min(3, "Note is required."),
  date: z.string().min(1, "Due date is required."), // DD/MM/YYYY
  time: z.string().min(1, "Due time is required."), // HH:mm
});

type FormValues = z.infer<typeof schema>;

function toKeyDate(due: string) {
  const [datePart, timePart] = due.split(" ");
  const [dd, mm, yyyy] = (datePart ?? "").split("/").map(Number);
  const [hh, min] = (timePart ?? "00:00").split(":").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateKey = `${pad(yyyy || 0)}-${pad(mm || 0)}-${pad(dd || 0)}`;
  const timeKey = `${pad(hh || 0)}:${pad(min || 0)}`;
  return `${dateKey} ${timeKey}`;
}

const DEMO_TODAY = "04/04/2024";

function dateKey(ddmmyyyy: string) {
  const [dd, mm, yyyy] = (ddmmyyyy ?? "").split("/").map(Number);
  return (yyyy || 0) * 10000 + (mm || 0) * 100 + (dd || 0);
}

export default function CustomerServiceRemindersPage() {
  const { showToast } = useToast();

  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const [search, setSearch] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<Reminder | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contact: "",
      phone: "",
      note: "",
      date: DEMO_TODAY,
      time: "11:00",
    },
  });

  React.useEffect(() => {
    setReminders(readReminders());
    const onUpdate = () => setReminders(readReminders());
    window.addEventListener("afrah_cs_reminders_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_cs_reminders_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return reminders
      .filter((r) => !q || r.contact.toLowerCase().includes(q) || r.note.toLowerCase().includes(q))
      .sort((a, b) => toKeyDate(a.due).localeCompare(toKeyDate(b.due)));
  }, [reminders, search]);

  const todayKey = dateKey(DEMO_TODAY);
  const overdue = filtered.filter((r) => !r.done && dateKey(r.due.split(" ")[0] ?? "") < todayKey);
  const dueToday = filtered.filter((r) => !r.done && dateKey(r.due.split(" ")[0] ?? "") === todayKey);
  const upcoming = filtered.filter((r) => !r.done && dateKey(r.due.split(" ")[0] ?? "") > todayKey);

  function update(next: Reminder[]) {
    setReminders(next);
    writeReminders(next);
  }

  function markDone(id: string) {
    update(reminders.map((r) => (r.id === id ? { ...r, done: true } : r)));
    showToast({ type: "success", title: "Done", message: "Reminder completed." });
  }

  function snooze(id: string, label: string, hours: number) {
    const next = reminders.map((r) => {
      if (r.id !== id) return r;
      const [datePart, timePart] = r.due.split(" ");
      const [dd, mm, yyyy] = (datePart ?? "").split("/").map(Number);
      const [hh, min] = (timePart ?? "00:00").split(":").map(Number);
      const d = new Date(yyyy || 2024, (mm || 1) - 1, dd || 1, hh || 0, min || 0);
      const moved = new Date(d.getTime() + hours * 60 * 60 * 1000);
      const pad = (n: number) => String(n).padStart(2, "0");
      const due = `${pad(moved.getDate())}/${pad(moved.getMonth() + 1)}/${moved.getFullYear()} ${pad(
        moved.getHours(),
      )}:${pad(moved.getMinutes())}`;
      return { ...r, due };
    });
    update(next);
    showToast({ type: "success", title: "Snoozed", message: `Moved by ${label}.` });
  }

  function remove(id: string) {
    update(reminders.filter((r) => r.id !== id));
    showToast({ type: "success", title: "Deleted", message: "Reminder removed." });
  }

  function Section({
    title,
    variant,
    items,
  }: {
    title: string;
    variant: "error" | "warning" | "info" | "neutral" | "success";
    items: Reminder[];
  }) {
    return (
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[18px] font-semibold text-gray-800">{title}</div>
            <div className="mt-1 text-sm text-gray-600">
              {items.length ? `${items.length} reminder(s)` : "No items"}
            </div>
          </div>
          <Badge variant={variant} dot>
            {items.length}
          </Badge>
        </div>

        <div className="mt-6 space-y-3">
          {items.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-gray-900">{r.contact}</div>
                    <Badge variant={variant} dot>
                      {title}
                    </Badge>
                    <span className="font-mono text-xs text-gray-500">{r.due}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">{r.note}</div>
                  <a
                    href={`tel:${r.phone}`}
                    className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    Call {r.phone}
                  </a>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => markDone(r.id)}>
                    Mark Done
                  </Button>
                  <Button variant="secondary" onClick={() => snooze(r.id, "1 day", 24)}>
                    Snooze 1 Day
                  </Button>
                  <Button variant="secondary" onClick={() => snooze(r.id, "1 week", 24 * 7)}>
                    Snooze 1 Week
                  </Button>
                  <Button variant="danger" onClick={() => setConfirmDelete(r)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {!items.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              Nothing here.
            </div>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Reminders</div>
          <div className="mt-1 text-sm text-gray-600">
            Overdue, due today, and upcoming follow-ups — all live updating.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              form.reset({
                contact: "",
                phone: "",
                note: "",
                date: DEMO_TODAY,
                time: "11:00",
              });
              setAddOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Reminder
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <label className="text-sm font-medium text-gray-700">Search</label>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reminders…"
            className="w-full text-sm text-gray-900 outline-none"
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Overdue" variant="error" items={overdue} />
        <Section title="Due Today" variant="warning" items={dueToday} />
      </div>

      <Section title="Upcoming" variant="info" items={upcoming} />

      <Modal
        open={addOpen}
        title="Add Reminder"
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
                  const next: Reminder = {
                    id: `rem-${String(Math.floor(Math.random() * 900) + 100)}`,
                    contact: values.contact,
                    phone: values.phone,
                    note: values.note,
                    due: `${values.date} ${values.time}`,
                    done: false,
                  };
                  update([next, ...reminders]);
                  showToast({ type: "success", title: "Saved", message: "Reminder added." });
                  setAddOpen(false);
                } finally {
                  setSaving(false);
                }
              })}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Contact</label>
            <input
              {...form.register("contact")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.contact ? (
              <div className="mt-1 text-xs text-red-600">{form.formState.errors.contact.message}</div>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Note</label>
            <input
              {...form.register("note")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.note ? (
              <div className="mt-1 text-xs text-red-600">{form.formState.errors.note.message}</div>
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
          <div>
            <label className="text-sm font-medium text-gray-700">Due date (DD/MM/YYYY)</label>
            <input
              {...form.register("date")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.date ? (
              <div className="mt-1 text-xs text-red-600">{form.formState.errors.date.message}</div>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Due time (HH:mm)</label>
            <input
              {...form.register("time")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.time ? (
              <div className="mt-1 text-xs text-red-600">{form.formState.errors.time.message}</div>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        title="Delete reminder?"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={saving}
              onClick={async () => {
                if (!confirmDelete) return;
                setSaving(true);
                try {
                  await new Promise((r) => setTimeout(r, 600));
                  remove(confirmDelete.id);
                  setConfirmDelete(null);
                } finally {
                  setSaving(false);
                }
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="text-sm text-gray-700">
          This will permanently remove{" "}
          <span className="font-semibold">{confirmDelete?.contact}</span>’s reminder.
        </div>
      </Modal>
    </div>
  );
}
