"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";

import { ceoStore } from "@/components/ceo/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";

const tabs = ["pending", "approved", "rejected"] as const;

export function CeoApprovalsPage() {
  const { showToast } = useToast();
  const [items, setItems] = React.useState<any[]>([]);
  const [tab, setTab] = React.useState<(typeof tabs)[number]>("pending");
  const [detail, setDetail] = React.useState<any | null>(null);

  React.useEffect(() => {
    ceoStore.seed();
    const refresh = () => setItems(ceoStore.readApprovals());
    refresh();
    window.addEventListener(ceoStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(ceoStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const filtered = items.filter((item) => item.status === tab);

  return (
    <div className="space-y-6">
      <PageHeader title="Approvals" subtitle="Review pending hire, expense, and petty cash requests in one inbox." />

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === item ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}>
              {item} {item === "pending" ? `(${items.filter((approval) => approval.status === "pending").length})` : ""}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <button key={item.id} type="button" onClick={() => setDetail(item)} className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">{item.type}</div>
                <div className="mt-1 text-sm text-gray-600">{item.requested_by}</div>
              </div>
              <Badge variant={item.status === "approved" ? "success" : item.status === "rejected" ? "error" : "warning"}>{item.status}</Badge>
            </div>
            <div className="mt-4 text-sm text-gray-700">{formatUGX(item.amount)}</div>
          </button>
        ))}
      </div>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.type ?? "Approval Detail"}>
        {detail ? (
          <div className="space-y-4 text-sm text-gray-700">
            <div>Requester: {detail.requested_by}</div>
            <div>Role: {detail.requester_role}</div>
            <div>Date: {detail.date}</div>
            <div>Amount: {formatUGX(detail.amount)}</div>
            <div className="rounded-2xl border border-gray-200 p-4">
              {Object.entries(detail.details).map(([key, value]) => (
                <div key={key} className="mb-2 flex justify-between gap-4 last:mb-0">
                  <span className="capitalize text-gray-500">{key.replaceAll("_", " ")}</span>
                  <span className="text-right text-gray-900">{String(value)}</span>
                </div>
              ))}
            </div>
            {detail.status === "pending" ? (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    ceoStore.writeApprovals(items.map((item) => item.id === detail.id ? { ...item, status: "approved" } : item));
                    setDetail(null);
                    showToast({ type: "success", title: "Approved", message: "Approval request approved." });
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    ceoStore.writeApprovals(items.map((item) => item.id === detail.id ? { ...item, status: "rejected", notes: "Balance still adequate. Review end of month." } : item));
                    setDetail(null);
                    showToast({ type: "success", title: "Rejected", message: "Approval request rejected." });
                  }}
                >
                  Reject
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
