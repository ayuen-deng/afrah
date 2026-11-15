"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CampaignCard } from "@/components/ui/CampaignCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { mockBookings, mockScreens } from "@/lib/mockData";

type Tab = "all" | "active" | "pending" | "completed" | "rejected";

type Campaign = (typeof mockBookings)[number] & {
  _local?: boolean;
  rejection_reason?: string;
  campaign_status: string;
  payment_status: string;
  ad_type?: string;
  duration?: string;
};

function normalizeStatus(status: string): Tab {
  if (status === "live") return "active";
  if (status === "scheduled") return "pending";
  if (status === "completed") return "completed";
  if (status === "rejected") return "rejected";
  return "all";
}

export default function CustomerCampaignsPage() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const initialStatus = (searchParams.get("status") ?? "all").toLowerCase();
  const [tab, setTab] = React.useState<Tab>(
    initialStatus === "active" ||
      initialStatus === "pending" ||
      initialStatus === "completed" ||
      initialStatus === "rejected"
      ? (initialStatus as Tab)
      : "all",
  );
  const [search, setSearch] = React.useState("");
  const [localCampaigns, setLocalCampaigns] = React.useState<Campaign[]>([]);

  React.useEffect(() => {
    const keys = Object.keys(window.localStorage).filter((key) => key.startsWith("afrah_booking_"));
    const list: Campaign[] = [];
    keys.forEach((key) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as {
          screenId: string;
          ref: string;
          total: number;
          status: string;
          date: string;
          start: string;
          end: string;
        };
        const screen = mockScreens.find((item) => item.id === parsed.screenId);
        if (!screen) return;
        list.push({
          id: parsed.screenId,
          ref: parsed.ref,
          customer_name: "Sarah Nakato",
          company: "Personal",
          customer_photo: "https://picsum.photos/seed/cust3/100/100",
          screen: screen.name,
          screen_image: screen.image,
          start: parsed.date,
          end: parsed.date,
          duration: `${parsed.start}-${parsed.end}`,
          amount: Math.round(parsed.total),
          payment_status: parsed.status === "paid" ? "paid" : "pending",
          campaign_status: parsed.status === "paid" ? "scheduled" : "pending",
          ad_type: "pending_upload",
          _local: true,
        } as unknown as Campaign);
      } catch {
        // ignore malformed local bookings
      }
    });
    setLocalCampaigns(list);
  }, []);

  const baseCampaigns = React.useMemo<Campaign[]>(() => {
    const rejected: Campaign = {
      id: "bk-004",
      ref: "BK-2024-0004",
      customer_id: "cust-003",
      customer_name: "Sarah Nakato",
      company: "Personal",
      customer_photo: "https://picsum.photos/seed/cust3/100/100",
      screen: "Garden City Screen",
      screen_image: "https://picsum.photos/seed/scr5/800/450",
      start: "02/04/2024",
      end: "02/04/2024",
      duration: "1 day",
      amount: 192000,
      payment_status: "refunded",
      campaign_status: "rejected",
      ad_type: "image",
      rejection_reason: "Creative violated brand policy.",
    };

    return [...localCampaigns, ...(mockBookings as Campaign[]), rejected];
  }, [localCampaigns]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return baseCampaigns.filter((campaign) => {
      const matchesTab = tab === "all" || normalizeStatus(campaign.campaign_status) === tab;
      const matchesSearch =
        !q ||
        String(campaign.ref).toLowerCase().includes(q) ||
        String(campaign.screen).toLowerCase().includes(q) ||
        String(campaign.customer_name).toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [baseCampaigns, tab, search]);

  const tabItems = React.useMemo(
    () =>
      (
        [
          { key: "all", label: "All" },
          { key: "active", label: "Active" },
          { key: "pending", label: "Pending" },
          { key: "completed", label: "Completed" },
          { key: "rejected", label: "Rejected" },
        ] as const
      ).map((entry) => {
        const count =
          entry.key === "all"
            ? baseCampaigns.length
            : baseCampaigns.filter((campaign) => normalizeStatus(campaign.campaign_status) === entry.key).length;
        return { ...entry, count };
      }),
    [baseCampaigns],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Campaigns"
        subtitle="Filter by status and open any campaign for rich details."
        actions={
          <Link href="/dashboard/customer/screens">
            <Button>Book a Screen</Button>
          </Link>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-row gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {tabItems.map((tabItem) => (
            <button
              key={tabItem.key}
              type="button"
              onClick={() => setTab(tabItem.key)}
              className={
                tab === tabItem.key
                  ? "inline-flex flex-shrink-0 whitespace-nowrap rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors duration-150"
                  : "inline-flex flex-shrink-0 whitespace-nowrap rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-200"
              }
            >
              <span>{tabItem.label}</span>
              <span
                className={
                  tab === tabItem.key
                    ? "ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-700 px-1.5 text-xs text-white"
                    : "ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs text-gray-600"
                }
              >
                {tabItem.count}
              </span>
            </button>
          ))}
        </div>

        <div className="w-full sm:max-w-sm">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by ref, screen, customer..."
              className="w-full text-sm text-gray-900 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((campaign) => {
          const screen = mockScreens.find((item) => item.name === campaign.screen);
          return (
            <CampaignCard
              key={campaign.id}
              image={campaign.screen_image}
              title={campaign.screen}
              location={screen?.location ?? "Kampala, Uganda"}
              startDate={campaign.start.split(" ")[0]}
              endDate={campaign.end.split(" ")[0]}
              status={campaign.campaign_status}
              amount={campaign.amount}
              duration={campaign.duration}
              reference={campaign.ref}
              href={`/dashboard/customer/campaigns/${campaign.id}`}
            />
          );
        })}

        {!filtered.length ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <div className="text-[18px] font-semibold text-gray-800">No campaigns found</div>
            <div className="mt-2 text-sm text-gray-600">
              Try a different filter or clear your search.
            </div>
            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setTab("all");
                  setSearch("");
                  showToast({
                    type: "success",
                    title: "Cleared",
                    message: "Showing all campaigns.",
                  });
                }}
              >
                Clear filters
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
