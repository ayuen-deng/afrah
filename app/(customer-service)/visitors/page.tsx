"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { mockVisitors } from "@/lib/mockData";
import { formatDateUG, formatTimeUG } from "@/lib/dates";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type Visitor = (typeof mockVisitors)[number] & {
  id: string;
  time_out: string | null;
};

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

const schema = z.object({
  name: z.string().min(2, "Name is required."),
  company: z.string().min(2, "Company is required."),
  purpose: z.string().min(2, "Purpose is required."),
  phone: z.string().min(7, "Phone is required."),
  time_in: z.string().min(3, "Time in is required."),
});

type FormValues = z.infer<typeof schema>;

export default function CustomerServiceVisitorsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [visitors, setVisitors] = React.useState<Visitor[]>([]);
  const [logOpen, setLogOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<Visitor | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [confirmOut, setConfirmOut] = React.useState<Visitor | null>(null);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      company: "",
      purpose: "",
      phone: "",
      time_in: "10:23",
    },
  });

  React.useEffect(() => {
    const stored = readVisitors();
    if (stored.length) {
      setVisitors(stored);
      return;
    }
    const seeded = (mockVisitors as Visitor[]).map((v) => ({ ...v }));
    writeVisitors(seeded);
    setVisitors(seeded);
  }, []);

  React.useEffect(() => {
    const onUpdate = () => setVisitors(readVisitors());
    window.addEventListener("afrah_cs_visitors_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_cs_visitors_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const currentlyIn = visitors.filter((v) => !v.time_out);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Visitor Log</div>
          <div className="mt-1 text-sm text-gray-600">
            Log walk-ins and track who is currently in the office.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              form.reset({ name: "", company: "", purpose: "", phone: "", time_in: formatTimeUG(new Date()) });
              setLogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Log Visitor
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[18px] font-semibold text-gray-800">
              Currently in office
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Visitors without a time out.
            </div>
          </div>
          <Badge variant={currentlyIn.length ? "warning" : "success"} dot>
            {currentlyIn.length ? `${currentlyIn.length} In Office` : "All Cleared"}
          </Badge>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {currentlyIn.map((v) => (
            <div key={v.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{v.name}</div>
                  <div className="mt-1 text-sm text-gray-600">{v.company}</div>
                  <div className="mt-2 text-xs text-gray-500">{v.purpose}</div>
                  <div className="mt-2 text-xs text-gray-500 font-mono">
                    In: {v.time_in} • {v.date}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" onClick={() => { setDetail(v); setDetailOpen(true); }}>
                    View
                  </Button>
                  <Button variant="primary" onClick={() => setConfirmOut(v)}>
                    Log Time Out
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {!currentlyIn.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 md:col-span-2">
              No visitors currently in office.
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[18px] font-semibold text-gray-800">
              Full history
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Click a row to open visitor detail.
            </div>
          </div>
          <Button variant="secondary" onClick={() => router.push("/dashboard/customer-service")}>
            Back to Dashboard
          </Button>
        </div>

        <div className="mt-6">
          <DataTable
            data={visitors}
            rowKey={(v) => v.id}
            onRowClick={(v) => {
              setDetail(v);
              setDetailOpen(true);
            }}
            columns={[
              {
                key: "visitor",
                header: "Visitor",
                cell: (v) => (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-900">
                      {v.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="leading-tight">
                      <div className="text-sm font-medium text-gray-900">{v.name}</div>
                      <div className="text-xs text-gray-500">{v.company}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: "purpose",
                header: "Purpose",
                cell: (v) => <span className="text-sm text-gray-700">{v.purpose}</span>,
              },
              {
                key: "phone",
                header: "Phone",
                cell: (v) => <span className="font-mono text-sm text-gray-700">{v.phone}</span>,
                className: "whitespace-nowrap",
              },
              {
                key: "times",
                header: "Time",
                cell: (v) => (
                  <div className="text-sm text-gray-700">
                    <span className="font-mono">{v.time_in}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="font-mono">{v.time_out ?? "—"}</span>
                  </div>
                ),
                className: "whitespace-nowrap",
              },
              {
                key: "date",
                header: "Date",
                cell: (v) => <span className="font-mono text-sm">{v.date}</span>,
                className: "whitespace-nowrap",
              },
              {
                key: "status",
                header: "Status",
                cell: (v) => (
                  <Badge variant={v.time_out ? "neutral" : "warning"} dot>
                    {v.time_out ? "OUT" : "IN OFFICE"}
                  </Badge>
                ),
                className: "whitespace-nowrap",
              },
            ]}
            rowActions={(v) => [
              {
                label: "View",
                onClick: () => {
                  setDetail(v);
                  setDetailOpen(true);
                },
              },
              ...(v.time_out
                ? []
                : [
                    {
                      label: "Log Time Out",
                      onClick: () => setConfirmOut(v),
                    },
                  ]),
            ]}
          />
        </div>
      </Card>

      <Modal
        open={logOpen}
        title="Log Visitor"
        onClose={() => setLogOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setLogOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={form.handleSubmit(async (values) => {
                setSaving(true);
                try {
                  await new Promise((r) => setTimeout(r, 900));
                  const next: Visitor = {
                    id: `v-${String(Math.floor(Math.random() * 900) + 100)}`,
                    name: values.name,
                    company: values.company,
                    purpose: values.purpose,
                    phone: values.phone,
                    time_in: values.time_in,
                    time_out: null,
                    date: formatDateUG(new Date()),
                    logged_by: "Diana Auma",
                  };
                  const updated = [next, ...visitors];
                  setVisitors(updated);
                  writeVisitors(updated);
                  showToast({
                    type: "success",
                    title: "Visitor logged",
                    message: "Added to today’s list.",
                  });
                  setLogOpen(false);
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
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              {...form.register("name")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.name ? (
              <div className="mt-1 text-xs text-red-600">
                {form.formState.errors.name.message}
              </div>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Company</label>
            <input
              {...form.register("company")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.company ? (
              <div className="mt-1 text-xs text-red-600">
                {form.formState.errors.company.message}
              </div>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Purpose</label>
            <input
              {...form.register("purpose")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.purpose ? (
              <div className="mt-1 text-xs text-red-600">
                {form.formState.errors.purpose.message}
              </div>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input
              {...form.register("phone")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.phone ? (
              <div className="mt-1 text-xs text-red-600">
                {form.formState.errors.phone.message}
              </div>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Time In</label>
            <input
              {...form.register("time_in")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.time_in ? (
              <div className="mt-1 text-xs text-red-600">
                {form.formState.errors.time_in.message}
              </div>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmOut)}
        title="Log time out?"
        onClose={() => setConfirmOut(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOut(null)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={async () => {
                if (!confirmOut) return;
                setSaving(true);
                try {
                  await new Promise((r) => setTimeout(r, 700));
                  const updated = visitors.map((v) =>
                    v.id === confirmOut.id
                      ? { ...v, time_out: formatTimeUG(new Date()) }
                      : v,
                  );
                  setVisitors(updated);
                  writeVisitors(updated);
                  showToast({
                    type: "success",
                    title: "Time out logged",
                    message: `${confirmOut.name} checked out successfully.`,
                  });
                  setConfirmOut(null);
                } finally {
                  setSaving(false);
                }
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="text-sm text-gray-700">
          This will set <span className="font-semibold">{confirmOut?.name}</span>’s time out to the current time.
        </div>
      </Modal>

      <Modal
        open={detailOpen}
        title="Visitor detail"
        onClose={() => setDetailOpen(false)}
        footer={
          detail ? (
            <>
              <Button variant="secondary" onClick={() => setDetailOpen(false)}>
                Close
              </Button>
              {!detail.time_out ? (
                <Button
                  onClick={() => {
                    setDetailOpen(false);
                    setConfirmOut(detail);
                  }}
                >
                  Log Time Out
                </Button>
              ) : null}
            </>
          ) : null
        }
      >
        {detail ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Name</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{detail.name}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Company</div>
              <div className="mt-1 text-sm text-gray-700">{detail.company}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Purpose</div>
              <div className="mt-1 text-sm text-gray-700">{detail.purpose}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Phone</div>
              <a href={`tel:${detail.phone}`} className="mt-1 inline-block text-sm font-medium text-primary hover:underline">
                {detail.phone}
              </a>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Date</div>
              <div className="mt-1 text-sm font-mono text-gray-700">{detail.date}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Time In</div>
              <div className="mt-1 text-sm font-mono text-gray-700">{detail.time_in}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Time Out</div>
              <div className="mt-1 text-sm font-mono text-gray-700">{detail.time_out ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Logged By</div>
              <div className="mt-1 text-sm text-gray-700">{detail.logged_by}</div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

