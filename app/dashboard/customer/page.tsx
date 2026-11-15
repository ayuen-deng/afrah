"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MonitorPlay } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CampaignCard } from "@/components/ui/CampaignCard";
import { StatCardSparkline } from "@/components/ui/StatCardSparkline";
import { mockBookings, mockScreens } from "@/lib/mockData";

export default function CustomerHomePage() {
  const router = useRouter();
  const [campaigns] = React.useState(mockBookings);

  const activeCount = campaigns.filter((c) => c.campaign_status === "live").length;
  const pendingCount = campaigns.filter((c) => c.campaign_status === "scheduled").length;
  const completedCount = campaigns.filter((c) => c.campaign_status === "completed").length;

  const recentCampaigns = campaigns.slice(0, 3);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome back, Sarah"
        subtitle="Your campaigns, invoices, and creative uploads in one place."
        actions={
          <Link href="/dashboard/customer/screens">
            <Button>Book a Screen</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCardSparkline
          className="h-full"
          label="ACTIVE CAMPAIGNS"
          value={activeCount}
          trendText={activeCount > 0 ? `+${activeCount} this month` : "No change"}
          trendDirection={activeCount > 0 ? "up" : "neutral"}
          lineColor="#2563EB"
          points={[{ value: 1 }, { value: 2 }, { value: 2 }, { value: 3 }, { value: 3 }]}
          onClick={() => router.push("/dashboard/customer/campaigns?status=active")}
        />
        <StatCardSparkline
          className="h-full"
          label="PENDING CAMPAIGNS"
          value={pendingCount}
          trendText={pendingCount > 0 ? `+${pendingCount} this month` : "No change"}
          trendDirection={pendingCount > 0 ? "up" : "neutral"}
          lineColor="#F59E0B"
          trendDotColorClassName="bg-amber-500"
          points={[{ value: 3 }, { value: 2 }, { value: 2 }, { value: 1 }, { value: 1 }]}
          onClick={() => router.push("/dashboard/customer/campaigns?status=pending")}
        />
        <StatCardSparkline
          className="h-full"
          label="COMPLETED CAMPAIGNS"
          value={completedCount}
          trendText={completedCount > 0 ? `+${completedCount} this month` : "No change"}
          trendDirection={completedCount > 0 ? "up" : "neutral"}
          lineColor="#10B981"
          trendDotColorClassName="bg-green-500"
          points={[{ value: 1 }, { value: 1 }, { value: 2 }, { value: 2 }, { value: 3 }]}
          onClick={() => router.push("/dashboard/customer/campaigns?status=completed")}
        />
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="text-[18px] font-semibold text-gray-800">Recent Campaigns</div>
        <Link
          href="/dashboard/customer/campaigns"
          className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
        >
          View All {"->"}
        </Link>
      </div>

      {recentCampaigns.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentCampaigns.map((campaign) => {
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
        </div>
      ) : (
        <EmptyState
          icon={MonitorPlay}
          title="No campaigns yet"
          description="Browse screens and launch your first campaign."
          action={{
            label: "Browse Screens",
            onClick: () => router.push("/dashboard/customer/screens"),
          }}
        />
      )}
    </div>
  );
}
