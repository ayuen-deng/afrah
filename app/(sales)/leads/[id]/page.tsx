"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, FileText, Mail, MessageCircle, Phone, Skull, Trophy } from "lucide-react";

import { mockLeads } from "@/lib/mockData";
import { formatUGX } from "@/lib/ugx";
import { BackButton } from "@/components/ui/BackButton";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type Stage = "new" | "contacted" | "quoted" | "negotiating" | "won" | "lost";
type Lead = (typeof mockLeads)[number] & {
  stage: Stage;
  days_in_stage: number;
  phone: string;
  email?: string;
  notes?: Array<{ id: string; text: string; time: string }>;
  next_follow_up?: string | null;
};

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

function writeLeads(next: Lead[]) {
  window.localStorage.setItem("afrah_sales_leads", JSON.stringify(next));
  window.dispatchEvent(new Event("afrah_sales_leads_updated"));
}

function toWhatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("0")
    ? `256${digits.slice(1)}`
    : digits.startsWith("256")
      ? digits
      : `256${digits}`;
  return `https://wa.me/${normalized}`;
}

type Client = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  initials: string;
  color: string;
  photo: string;
  total_campaigns: number;
  total_spent: number;
  last_campaign: string;
  status: "vip" | "active";
  renewal_status: "active" | "renewal_due" | "inactive";
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

const activitySchema = z.object({
  type: z.string().min(2, "Type is required."),
  notes: z.string().min(5, "Notes are required."),
  outcome: z.string().min(2, "Outcome is required."),
  next_follow_up: z.string().optional(),
});
type ActivityValues = z.infer<typeof activitySchema>;

const lostSchema = z.object({
  reason: z.string().min(2, "Please select a reason."),
});
type LostValues = z.infer<typeof lostSchema>;

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [lead, setLead] = React.useState<Lead | null>(null);
  const [activityOpen, setActivityOpen] = React.useState(false);
  const [lostOpen, setLostOpen] = React.useState(false);
  const [convertOpen, setConvertOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [savingLost, setSavingLost] = React.useState(false);
  const [converting, setConverting] = React.useState(false);

  const activityForm = useForm<ActivityValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: "Call",
      notes: "",
      outcome: "Positive",
      next_follow_up: "05/04/2024 10:00",
    },
  });

  const lostForm = useForm<LostValues>({
    resolver: zodResolver(lostSchema),
    defaultValues: { reason: "No budget" },
  });

  const refresh = React.useCallback(() => {
    const current = readLeads().find((l) => l.id === params.id) ?? null;
    setLead(current);
  }, [params.id]);

  React.useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("afrah_sales_leads_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_sales_leads_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  const quotesForLead = React.useMemo(() => {
    try {
      const raw = window.localStorage.getItem("afrah_cs_quotes");
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Array<{
        id: string;
        number: string;
        company: string;
        total: number;
        status: string;
      }>;
      const arr = Array.isArray(parsed) ? parsed : [];
      return arr.filter(
        (q) =>
          (q.company ?? "").toLowerCase() === (lead?.company ?? "").toLowerCase(),
      );
    } catch {
      return [];
    }
  }, [lead?.company]);

  if (!lead) {
    return (
      <Card className="p-6">
        <div className="text-[18px] font-semibold text-gray-800">Lead not found</div>
        <div className="mt-2 text-sm text-gray-600">This lead may have been removed.</div>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => router.push("/leads")}>
            Back to leads
          </Button>
        </div>
      </Card>
    );
  }

  const stage = lead.stage;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <BackButton className="mt-2" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[24px] font-semibold text-gray-900">{lead.company}</div>
              <Badge variant={stageVariant(stage)} dot>
                {stageLabel[stage]}
              </Badge>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 font-mono">
                {lead.id}
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Value: <span className="font-semibold text-gray-900">{formatUGX(lead.budget)}</span> •{" "}
              {lead.days_in_stage} days in stage
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              window.localStorage.setItem(
                "afrah_quote_builder_prefill",
                JSON.stringify({
                  customer: lead.contact,
                  company: lead.company,
                  phone: lead.phone,
                  email: lead.email ?? "",
                }),
              );
              router.push("/quotes/new");
              showToast({
                type: "info",
                title: "Quote builder",
                message: "Opening quotation builder (prefilled).",
              });
            }}
          >
            <FileText className="h-4 w-4" />
            Create Quote
          </Button>
          <Button variant="secondary" onClick={() => setActivityOpen(true)}>
            <CheckCircle2 className="h-4 w-4" />
            Log Activity
          </Button>
          <Button variant="danger" onClick={() => setLostOpen(true)}>
            <Skull className="h-4 w-4" />
            Mark as Lost
          </Button>
          {stage === "won" ? (
            <Button onClick={() => setConvertOpen(true)}>
              <Trophy className="h-4 w-4" />
              Convert to Customer
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Contact</div>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="flex items-center justify-between gap-3">
              <div className="text-gray-600">Contact person</div>
              <div className="font-medium text-gray-900">{lead.contact}</div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-gray-600">Phone</div>
              <a className="font-medium text-primary hover:underline" href={`tel:${lead.phone}`}>
                {lead.phone}
              </a>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-gray-600">Email</div>
              {lead.email ? (
                <a className="font-medium text-primary hover:underline" href={`mailto:${lead.email}`}>
                  {lead.email}
                </a>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                window.open(toWhatsappLink(lead.phone), "_blank", "noopener,noreferrer");
                showToast({ type: "success", title: "WhatsApp", message: "Opening chat…" });
              }}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = `tel:${lead.phone}`;
              }}
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
            {lead.email ? (
              <Button
                variant="secondary"
                onClick={() => {
                  window.location.href = `mailto:${lead.email}`;
                }}
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            ) : null}
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-gray-900">Stage</div>
            <select
              value={lead.stage}
              onChange={(e) => {
                const nextStage = e.target.value as Stage;
                const next = readLeads().map((l) => (l.id === lead.id ? { ...l, stage: nextStage } : l));
                writeLeads(next);
                showToast({ type: "success", title: "Updated", message: `Stage set to ${stageLabel[nextStage]}.` });
              }}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            >
              {Object.keys(stageLabel).map((k) => (
                <option key={k} value={k}>
                  {stageLabel[k as Stage]}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[18px] font-semibold text-gray-800">Quotes</div>
                <div className="mt-1 text-sm text-gray-600">Linked quotations for this lead.</div>
              </div>
              <Button
                onClick={() => {
                  window.localStorage.setItem(
                    "afrah_quote_builder_prefill",
                    JSON.stringify({
                      customer: lead.contact,
                      company: lead.company,
                      phone: lead.phone,
                      email: lead.email ?? "",
                    }),
                  );
                  router.push("/quotes/new");
                  showToast({ type: "info", title: "Quote builder", message: "Opening quotation builder (prefilled)." });
                }}
              >
                Create New Quote
              </Button>
            </div>

            <div className="mt-6 space-y-2">
              {quotesForLead.length ? (
                quotesForLead.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      window.localStorage.setItem("afrah_cs_quote_focus", q.id);
                      router.push("/quotes");
                      showToast({ type: "info", title: "Quote", message: "Opening quote detail…" });
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left hover:bg-gray-50"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900 font-mono">{q.number}</div>
                      <div className="mt-1 text-xs text-gray-500">{q.status}</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{formatUGX(q.total)}</div>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  No quotes linked yet.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[18px] font-semibold text-gray-800">Activity timeline</div>
                <div className="mt-1 text-sm text-gray-600">Log every interaction — updates instantly.</div>
              </div>
              <Button variant="secondary" onClick={() => setActivityOpen(true)}>
                Log Activity
              </Button>
            </div>

            <div className="mt-6 space-y-3">
              {(lead.activities ?? []).map((a, idx) => (
                <div key={`${a.type}-${a.date}-${idx}`} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{a.type}</div>
                      <div className="mt-1 text-sm text-gray-600">{a.notes}</div>
                      <div className="mt-2 text-xs text-gray-500">Outcome: {a.outcome}</div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{a.date}</div>
                  </div>
                </div>
              ))}
              {lead.activities?.length ? null : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  No activities logged yet.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[18px] font-semibold text-gray-800">Notes</div>
                <div className="mt-1 text-sm text-gray-600">Internal notes for this lead.</div>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  const nextNote = { id: `note-${Date.now()}`, text: "Follow up scheduled.", time: "04/04/2024 16:20" };
                  const next = readLeads().map((l) =>
                    l.id !== lead.id ? l : { ...l, notes: [nextNote, ...(l.notes ?? [])] },
                  );
                  writeLeads(next);
                  showToast({ type: "success", title: "Saved", message: "Note added." });
                }}
              >
                Add quick note
              </Button>
            </div>

            <div className="mt-6 space-y-2">
              {(lead.notes ?? []).map((n) => (
                <div key={n.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm text-gray-700">{n.text}</div>
                    <div className="text-xs text-gray-500 font-mono">{n.time}</div>
                  </div>
                </div>
              ))}
              {lead.notes?.length ? null : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  No notes yet.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={activityOpen}
        onClose={() => {
          if (saving) return;
          setActivityOpen(false);
        }}
        title="Log Activity"
        footer={
          <>
            <Button variant="secondary" onClick={() => setActivityOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={activityForm.handleSubmit(async (values) => {
                setSaving(true);
                try {
                  await new Promise((r) => setTimeout(r, 800));
                  const next = readLeads().map((l) => {
                    if (l.id !== lead.id) return l;
                    return {
                      ...l,
                      next_follow_up: values.next_follow_up || null,
                      activities: [
                        {
                          type: values.type,
                          notes: values.notes,
                          outcome: values.outcome,
                          date: "04/04/2024",
                        },
                        ...(l.activities ?? []),
                      ],
                    };
                  });
                  writeLeads(next);
                  showToast({ type: "success", title: "Logged", message: "Activity saved to timeline." });
                  setActivityOpen(false);
                  activityForm.reset({ ...activityForm.getValues(), notes: "" });
                } finally {
                  setSaving(false);
                }
              })}
              loading={saving}
            >
              Save Activity
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Type</label>
            <input
              {...activityForm.register("type")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {activityForm.formState.errors.type ? (
              <div className="mt-1 text-xs text-red-600">{activityForm.formState.errors.type.message}</div>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Outcome</label>
            <input
              {...activityForm.register("outcome")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {activityForm.formState.errors.outcome ? (
              <div className="mt-1 text-xs text-red-600">{activityForm.formState.errors.outcome.message}</div>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea
              rows={4}
              {...activityForm.register("notes")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {activityForm.formState.errors.notes ? (
              <div className="mt-1 text-xs text-red-600">{activityForm.formState.errors.notes.message}</div>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Next follow-up (optional)</label>
            <input
              {...activityForm.register("next_follow_up")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={lostOpen}
        onClose={() => {
          if (savingLost) return;
          setLostOpen(false);
        }}
        title="Mark as Lost"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLostOpen(false)} disabled={savingLost}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={lostForm.handleSubmit(async (values) => {
                setSavingLost(true);
                try {
                  await new Promise((r) => setTimeout(r, 800));
                  const next = readLeads().map((l) =>
                    l.id !== lead.id
                      ? l
                      : {
                          ...l,
                          stage: "lost" as const,
                          notes: [
                            { id: `note-${Date.now()}`, text: `Lost reason: ${values.reason}`, time: "04/04/2024 16:30" },
                            ...(l.notes ?? []),
                          ],
                        },
                  );
                  writeLeads(next);
                  showToast({ type: "success", title: "Updated", message: "Lead marked as Lost." });
                  setLostOpen(false);
                } finally {
                  setSavingLost(false);
                }
              })}
              loading={savingLost}
            >
              Confirm Lost
            </Button>
          </>
        }
      >
        <div>
          <div className="text-sm text-gray-700">
            You are marking <span className="font-semibold text-gray-900">{lead.company}</span> as lost. Select a reason.
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700">Reason</label>
            <select
              {...lostForm.register("reason")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            >
              {["No budget", "Chose competitor", "No response", "Timing not right", "Other"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {lostForm.formState.errors.reason ? (
              <div className="mt-1 text-xs text-red-600">{lostForm.formState.errors.reason.message}</div>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        open={convertOpen}
        onClose={() => {
          if (converting) return;
          setConvertOpen(false);
        }}
        title="Convert to Customer"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConvertOpen(false)} disabled={converting}>
              Cancel
            </Button>
            <Button
              loading={converting}
              onClick={async () => {
                setConverting(true);
                try {
                  await new Promise((r) => setTimeout(r, 2000));
                  const nextClient: Client = {
                    id: `cust-${String(Date.now()).slice(-6)}`,
                    name: lead.contact,
                    company: lead.company,
                    phone: lead.phone,
                    email: lead.email ?? `${lead.contact.split(" ")[0]?.toLowerCase() ?? "client"}@example.com`,
                    initials: lead.contact
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join(""),
                    color: "bg-blue-500",
                    photo: lead.photo,
                    total_campaigns: 0,
                    total_spent: 0,
                    last_campaign: "—",
                    status: "active",
                    renewal_status: "active",
                    activities: [
                      {
                        id: `act-${Date.now()}`,
                        type: "Converted",
                        note: "Converted from Sales pipeline lead.",
                        time: "04/04/2024 16:40",
                      },
                    ],
                  };
                  const existing = readClients();
                  if (!existing.some((c) => c.company.toLowerCase() === lead.company.toLowerCase())) {
                    writeClients([nextClient, ...existing]);
                  }
                  window.localStorage.setItem("afrah_sales_client_focus_company", lead.company);
                  confetti({ particleCount: 140, spread: 80, origin: { y: 0.7 } });
                  showToast({
                    type: "success",
                    title: "Deal won!",
                    message: `Deal Won! Commission earned: ${formatUGX(424510)}`,
                  });
                  setConvertOpen(false);
                  router.push("/clients");
                } finally {
                  setConverting(false);
                }
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="text-sm text-gray-700">
          Convert <span className="font-semibold text-gray-900">{lead.company}</span> to a customer account? This will add the client to{" "}
          <span className="font-semibold text-gray-900">My Clients</span>.
        </div>
      </Modal>
    </div>
  );
}
