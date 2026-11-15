"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";

import { ceoStore, makeCeoId } from "@/components/ceo/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

export function CeoAnnouncementsPage() {
  const { showToast } = useToast();
  const [items, setItems] = React.useState<any[]>([]);
  const [detail, setDetail] = React.useState<any | null>(null);
  const [postOpen, setPostOpen] = React.useState(false);

  React.useEffect(() => {
    ceoStore.seed();
    const refresh = () => setItems(ceoStore.readAnnouncements());
    refresh();
    window.addEventListener(ceoStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(ceoStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" subtitle="Publish leadership updates, review urgency styling, and inspect readership." actions={<Button onClick={() => setPostOpen(true)}>Post</Button>} />

      <div className="space-y-4">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => setDetail(item)} className={`w-full rounded-2xl border p-5 text-left ${item.urgency === "important" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">{item.title}</div>
                <div className="mt-2 text-sm text-gray-600">{item.body}</div>
              </div>
              <Badge variant={item.urgency === "important" ? "warning" : "info"}>{item.urgency}</Badge>
            </div>
          </button>
        ))}
      </div>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.title ?? "Announcement"}>
        {detail ? (
          <div className="space-y-4 text-sm text-gray-700">
            <Badge variant={detail.urgency === "important" ? "warning" : "info"}>{detail.urgency}</Badge>
            <div>{detail.body}</div>
            <div>Seen by: {detail.seen_count} staff</div>
          </div>
        ) : null}
      </Modal>

      <Modal open={postOpen} onClose={() => setPostOpen(false)} title="Post Announcement">
        <div className="space-y-4 text-sm text-gray-700">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">Preview: Important announcement with amber urgency border.</div>
          <Button
            onClick={() => {
              ceoStore.writeAnnouncements([
                {
                  id: makeCeoId("ann"),
                  title: "Important: Team meeting Monday 8 AM",
                  body: "All staff must attend the Monday 07 April team meeting at 8:00 AM sharp. Agenda: Q2 targets and new client onboarding.",
                  urgency: "important",
                  posted_by: "Demo Principal",
                  date: "04/04/2024",
                  seen_count: 0,
                  read: false,
                },
                ...items,
              ]);
              setPostOpen(false);
              showToast({ type: "success", title: "Posted", message: "Announcement posted to all staff." });
            }}
          >
            Post Announcement
          </Button>
        </div>
      </Modal>
    </div>
  );
}
