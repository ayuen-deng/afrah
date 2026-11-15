"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatUGX } from "@/lib/ugx";

type CampaignCardStatus =
  | "live"
  | "active"
  | "scheduled"
  | "pending"
  | "completed"
  | "rejected"
  | "draft";

type CampaignCardProps = {
  image: string;
  title: string;
  location: string;
  startDate: string;
  endDate?: string;
  status: CampaignCardStatus | string;
  amount: number;
  duration: string;
  reference: string;
  href?: string;
  onClick?: () => void;
  className?: string;
};

function getStatusStyles(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "live" || normalized === "active") {
    return "bg-green-100 text-green-700";
  }
  if (normalized === "scheduled") {
    return "bg-blue-100 text-blue-700";
  }
  if (normalized === "pending_review" || normalized === "pending" || normalized === "draft") {
    return "bg-amber-100 text-amber-700";
  }
  if (normalized === "completed") {
    return "bg-gray-200 text-gray-700";
  }
  if (normalized === "rejected") {
    return "bg-red-100 text-red-700";
  }
  return "bg-blue-100 text-blue-700";
}

function formatDateLabel(startDate: string, endDate?: string) {
  if (!endDate) return `${startDate} → ${startDate}`;
  return `${startDate} → ${endDate}`;
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "pending_review") return "PENDING REVIEW";
  if (normalized === "active") return "LIVE";
  if (normalized === "scheduled") return "SCHEDULED";
  if (normalized === "completed") return "COMPLETED";
  if (normalized === "rejected") return "REJECTED";
  if (normalized === "pending") return "PENDING REVIEW";
  if (normalized === "live") return "LIVE";
  if (normalized === "draft") return "SCHEDULED";
  return normalized.toUpperCase();
}

function pulsingStatus(status: string) {
  const normalized = status.toLowerCase();
  return normalized === "live" || normalized === "active";
}

function screenReaderText(startDate: string, endDate?: string) {
  if (!endDate || endDate === startDate) {
    return `${startDate} to ${startDate}`;
  }
  return `${startDate} to ${endDate}`;
}

function CampaignCardBody({
  image,
  title,
  location,
  startDate,
  endDate,
  status,
  amount,
  duration,
  reference,
  className,
}: Omit<CampaignCardProps, "href" | "onClick">) {
  const normalizedStatus = status.toLowerCase();
  const badgeLabel = statusLabel(normalizedStatus);

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative h-[120px] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute right-3 top-3">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-sm",
              getStatusStyles(normalizedStatus),
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                pulsingStatus(normalizedStatus) ? "animate-pulse bg-green-500" : "bg-current/80",
              )}
            />
            <span>{badgeLabel}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="text-[15px] font-semibold text-gray-900">{title}</div>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{location}</span>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-sm text-red-800">
          <CalendarDays className="h-4 w-4" />
          <span>{formatDateLabel(startDate, endDate)}</span>
          <span className="sr-only">{screenReaderText(startDate, endDate)}</span>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <div className="text-sm font-semibold text-primary">{formatUGX(amount)}</div>
          <div className="text-xs text-gray-400">{duration}</div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
        <div className="font-mono text-[11px] text-gray-400">{reference}</div>
        <div className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors group-hover:text-blue-700">
          <span>View</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

export function CampaignCard(props: CampaignCardProps) {
  if (props.href) {
    return (
      <Link href={props.href} className="block">
        <CampaignCardBody {...props} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={props.onClick} className="block w-full text-left">
      <CampaignCardBody {...props} />
    </button>
  );
}
