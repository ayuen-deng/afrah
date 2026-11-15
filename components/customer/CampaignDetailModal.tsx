"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatUGX } from "@/lib/ugx";

type CampaignLike = {
  id: string;
  ref: string;
  customer_name: string;
  company: string;
  customer_photo: string;
  screen: string;
  screen_image: string;
  start: string;
  end: string;
  amount: number;
  payment_status: string;
  campaign_status: string;
  ad_type?: string;
};

const tabs = ["Overview", "Ad Creative", "Analytics", "Invoice"] as const;
type Tab = (typeof tabs)[number];

export function CampaignDetailModal({
  open,
  campaign,
  onClose,
  onExport,
}: {
  open: boolean;
  campaign: CampaignLike | null;
  onClose: () => void;
  onExport: () => void;
}) {
  const [tab, setTab] = React.useState<Tab>("Overview");

  React.useEffect(() => {
    if (open) setTab("Overview");
  }, [open]);

  if (!campaign) return null;

  return (
    <Modal
      open={open}
      title="Campaign Details"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onExport}>
            Export
          </Button>
          <Link href={`/dashboard/customer/campaigns/${campaign.id}`}>
            <Button>View Full Details</Button>
          </Link>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
            <Image
              src={campaign.customer_photo}
              alt={campaign.customer_name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info" className="font-mono">
              {campaign.ref}
            </Badge>
            <Badge
              variant={
                campaign.campaign_status === "live"
                  ? "success"
                  : campaign.campaign_status === "scheduled"
                    ? "info"
                    : campaign.campaign_status === "completed"
                      ? "neutral"
                      : "warning"
              }
              dot
            >
              {String(campaign.campaign_status).toUpperCase()}
            </Badge>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {campaign.customer_name}
          </div>
          <div className="text-xs text-gray-500">{campaign.company}</div>
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={
                  t === tab
                    ? "rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
                    : "rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                }
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Overview" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Screen
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-900">
                  {campaign.screen}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {campaign.start} → {campaign.end}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Amount
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-900">
                  {formatUGX(campaign.amount)}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Payment: {String(campaign.payment_status).toUpperCase()}
                </div>
              </div>
            </div>
          ) : tab === "Ad Creative" ? (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Creative Status
              </div>
              <div className="mt-2 text-sm text-gray-700">
                {campaign.ad_type === "pending_upload"
                  ? "Ad not uploaded yet."
                  : "Ad uploaded and approved."}
              </div>
              <div className="mt-4">
                <Link href={`/dashboard/customer/campaigns/${campaign.id}/upload`}>
                  <Button>Upload / Manage Creative</Button>
                </Link>
              </div>
            </div>
          ) : tab === "Analytics" ? (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Highlights
              </div>
              <div className="mt-2 text-sm text-gray-700">
                Plays and impressions will appear here once the campaign is live.
              </div>
              <div className="mt-4">
                <Button variant="secondary" onClick={onExport}>
                  Download Report
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Invoice
              </div>
              <div className="mt-2 text-sm text-gray-700">
                Invoice preview and downloads will appear on the full campaign
                page.
              </div>
              <div className="mt-4">
                <Link href={`/dashboard/customer/invoices`}>
                  <Button variant="secondary">View Invoices</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

