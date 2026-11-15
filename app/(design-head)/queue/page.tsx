"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, ThumbsDown, ThumbsUp } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { hodStore, type HODAd } from "@/components/layouts/DesignHeadShell";

type TabKey = "pending" | "flagged" | "approved" | "rejected" | "auto_rejected";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "flagged", label: "AI Flagged ⚠️" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "auto_rejected", label: "Auto-Rejected" },
];

function statusVariant(ad: HODAd) {
  if (ad.status === "approved") return "success" as const;
  if (ad.status === "rejected" || ad.status === "auto_rejected") return "error" as const;
  if (ad.ai_status === "flagged") return "warning" as const;
  return "info" as const;
}

function statusLabel(ad: HODAd) {
  if (ad.status === "approved") return "Approved";
  if (ad.status === "rejected") return "Rejected";
  if (ad.status === "auto_rejected") return "Auto-Rejected";
  if (ad.ai_status === "flagged") return "AI Flagged";
  return "Pending Review";
}

export default function ReviewQueuePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [tab, setTab] = React.useState<TabKey>("pending");
  const [ads, setAds] = React.useState<HODAd[]>([]);

  const [active, setActive] = React.useState<HODAd | null>(null);
  const [confirmApprove, setConfirmApprove] = React.useState<HODAd | null>(null);
  const [followUp, setFollowUp] = React.useState<HODAd | null>(null);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState<string>("Low quality");
  const [rejectNotes, setRejectNotes] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    hodStore.seedIfMissing();
    setAds(hodStore.readAds());
    const onUpdate = () => setAds(hodStore.readAds());
    window.addEventListener("afrah_hod_ads_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_hod_ads_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const filtered = React.useMemo(() => {
    if (tab === "pending") return ads.filter((a) => a.status === "pending_review" && a.ai_status !== "flagged");
    if (tab === "flagged") return ads.filter((a) => a.status === "pending_review" && a.ai_status === "flagged");
    if (tab === "approved") return ads.filter((a) => a.status === "approved");
    if (tab === "rejected") return ads.filter((a) => a.status === "rejected");
    return ads.filter((a) => a.status === "auto_rejected");
  }, [ads, tab]);

  const counts = React.useMemo(() => {
    const base = { pending: 0, flagged: 0, approved: 0, rejected: 0, auto_rejected: 0 };
    ads.forEach((a) => {
      if (a.status === "approved") base.approved += 1;
      else if (a.status === "rejected") base.rejected += 1;
      else if (a.status === "auto_rejected") base.auto_rejected += 1;
      else if (a.ai_status === "flagged") base.flagged += 1;
      else base.pending += 1;
    });
    return base;
  }, [ads]);

  function setAdStatus(adId: string, nextStatus: HODAd["status"]) {
    const next = hodStore.readAds().map((a) => (a.id === adId ? { ...a, status: nextStatus } : a));
    hodStore.writeAds(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Ad Review Queue</div>
          <div className="mt-1 text-sm text-gray-600">
            Pending approvals, AI flags, and quality checks.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              showToast({
                type: "success",
                title: "Export ready",
                message: "Review queue export prepared successfully.",
              })
            }
          >
            Export
          </Button>
          <Button onClick={() => router.push("/tasks")}>Open Task Board</Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const activeTab = tab === t.key;
            const c =
              t.key === "pending"
                ? counts.pending
                : t.key === "flagged"
                  ? counts.flagged
                  : t.key === "approved"
                    ? counts.approved
                    : t.key === "rejected"
                      ? counts.rejected
                      : counts.auto_rejected;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={[
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  activeTab ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                <span>{t.label}</span>
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    activeTab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700",
                  ].join(" ")}
                >
                  {c}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ad) => (
            <button
              key={ad.id}
              type="button"
              onClick={() => setActive(ad)}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-card hover:bg-gray-50"
            >
              <div className="relative">
                <img src={ad.preview} alt={ad.customer} className="h-40 w-full object-cover" />
                <div className="absolute left-3 top-3 flex items-center gap-2">
                  {ad.ai_status === "passed" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                      <ShieldCheck className="h-3.5 w-3.5" /> AI Passed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                      <ShieldAlert className="h-3.5 w-3.5" /> AI Flagged
                    </span>
                  )}
                  {typeof ad.quality_score === "number" ? (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                      {ad.quality_score}/100
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="p-4">
                <div className="text-sm font-semibold text-gray-900">
                  {ad.customer} / {ad.company}
                </div>
                <div className="mt-1 text-xs text-gray-500">{ad.screen}</div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant={statusVariant(ad)} dot>
                    {statusLabel(ad)}
                  </Badge>
                  <span className="text-xs text-gray-500 font-mono">{ad.submitted}</span>
                </div>
              </div>
            </button>
          ))}
          {filtered.length ? null : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
              No ads in this tab.
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={Boolean(active)}
        onClose={() => {
          if (saving) return;
          setActive(null);
        }}
        title="Full Review"
        footer={
          active ? (
            <>
              <Button variant="secondary" onClick={() => setActive(null)} disabled={saving}>
                Close
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setRejectOpen(true);
                  setRejectReason(active.ai_status === "flagged" ? "AI Flag" : "Low quality");
                  setRejectNotes("");
                }}
              >
                <ThumbsDown className="h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => setConfirmApprove(active)}
                disabled={active.status === "approved"}
              >
                <ThumbsUp className="h-4 w-4" />
                Approve
              </Button>
            </>
          ) : null
        }
      >
        {active ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <img
                src={active.preview}
                alt="Preview"
                className="w-full rounded-xl border border-gray-200 object-cover"
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    File Type
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">{active.file_type}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Resolution
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">{active.resolution ?? "—"}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">AI moderation</div>
                <div className="mt-2 text-sm text-gray-600">
                  {active.ai_status === "passed"
                    ? "Content check passed — no issues detected."
                    : "Flagged — verify brand/logo permissions before approval."}
                </div>
                {active.ai_flags?.length ? (
                  <div className="mt-3 space-y-2">
                    {active.ai_flags.map((f, idx) => (
                      <div key={idx} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                        {f.label} ({f.confidence}%)
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Quality report</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-gray-600">Score</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {typeof active.quality_score === "number" ? `${active.quality_score}/100` : "—"}
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {(active.quality_report ?? []).map((q, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{q.check}</div>
                        <div className="mt-1 text-sm text-gray-600">{q.note}</div>
                      </div>
                      <Badge
                        variant={q.status === "good" ? "success" : q.status === "warning" ? "warning" : "error"}
                      >
                        {q.status}
                      </Badge>
                    </div>
                  ))}
                  {(active.quality_report ?? []).length ? null : (
                    <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">No report provided.</div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Booking details</div>
                <div className="mt-2 grid gap-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-gray-600">Screen</div>
                    <div className="font-medium text-gray-900">{active.screen}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-gray-600">Dates</div>
                    <div className="font-mono text-gray-900">{active.campaign_dates}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-gray-600">Customer</div>
                    <div className="font-medium text-gray-900">{active.customer}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(confirmApprove)}
        onClose={() => setConfirmApprove(null)}
        title="Confirm Approval"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmApprove(null)} disabled={saving}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={async () => {
                if (!confirmApprove) return;
                setSaving(true);
                try {
                  await new Promise((r) => setTimeout(r, 900));
                  setAdStatus(confirmApprove.id, "approved");
                  showToast({
                    type: "success",
                    title: "Approved",
                    message: `${confirmApprove.customer} notified. Ad moved to Approved.`,
                  });
                  setConfirmApprove(null);
                  setActive(null);
                  setFollowUp(confirmApprove);
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
          Approve this ad for <span className="font-semibold text-gray-900">{confirmApprove?.customer}</span>?
        </div>
      </Modal>

      <Modal
        open={Boolean(followUp)}
        onClose={() => setFollowUp(null)}
        title="Next step"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFollowUp(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (!followUp) return;
                showToast({ type: "success", title: "Scheduled", message: "Scheduling confirmed successfully." });
                setFollowUp(null);
              }}
            >
              Schedule Now
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (!followUp) return;
                window.localStorage.setItem("afrah_hod_create_task_prefill_ad_id", followUp.id);
                showToast({ type: "info", title: "Create task", message: "Opening Task Board…" });
                setFollowUp(null);
                router.push("/tasks");
              }}
            >
              Create Design Task
            </Button>
          </>
        }
      >
        <div className="text-sm text-gray-700">
          Ad approved for <span className="font-semibold text-gray-900">{followUp?.customer}</span>. What would you like to do next?
        </div>
      </Modal>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject Ad"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={saving}
              onClick={async () => {
                if (!active) return;
                setSaving(true);
                try {
                  await new Promise((r) => setTimeout(r, 900));
                  setAdStatus(active.id, "rejected");
                  showToast({
                    type: "success",
                    title: "Rejected",
                    message: `Rejected: ${rejectReason}. ${rejectNotes ? "Notes saved." : ""}`,
                  });
                  setRejectOpen(false);
                  setActive(null);
                } finally {
                  setSaving(false);
                }
              }}
            >
              Reject
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-700">
            Select a reason and add optional notes. This updates the UI immediately.
          </div>
          <div className="flex flex-wrap gap-2">
            {["Low quality", "Wrong resolution", "AI Flag", "Brand violation", "Other"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRejectReason(r)}
                className={[
                  "rounded-full px-3 py-2 text-sm font-medium",
                  rejectReason === r ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                ].join(" ")}
              >
                {r}
              </button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              rows={4}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            Customer will be notified and can resubmit. (Simulation)
          </div>
        </div>
      </Modal>
    </div>
  );
}
