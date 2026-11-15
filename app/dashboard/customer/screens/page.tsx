"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  DollarSign,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Search,
} from "lucide-react";

import { mockScreens } from "@/lib/mockData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MapboxMap } from "@/components/maps/MapboxMap";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";

type ViewMode = "map" | "grid";
type PriceFilter = "any" | "under_30" | "between_30_50" | "above_50";

function matchesPriceFilter(price: number, filter: PriceFilter) {
  if (filter === "any") return true;
  if (filter === "under_30") return price < 30000;
  if (filter === "between_30_50") return price >= 30000 && price <= 50000;
  return price > 50000;
}

function getPriceLabel(filter: PriceFilter) {
  if (filter === "under_30") return "Under UGX 30,000/hr";
  if (filter === "between_30_50") return "UGX 30-50,000/hr";
  if (filter === "above_50") return "Above UGX 50,000/hr";
  return "Any Price";
}

export default function CustomerScreensPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [view, setView] = React.useState<ViewMode>("grid");
  const [search, setSearch] = React.useState("");
  const [city, setCity] = React.useState("All Cities");
  const [priceFilter, setPriceFilter] = React.useState<PriceFilter>("any");
  const [date, setDate] = React.useState("");
  const [showCityMenu, setShowCityMenu] = React.useState(false);
  const [showPriceMenu, setShowPriceMenu] = React.useState(false);
  const [showDateMenu, setShowDateMenu] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockScreens.filter((screen) => {
      const matchesText =
        !q ||
        screen.name.toLowerCase().includes(q) ||
        screen.location.toLowerCase().includes(q) ||
        screen.city.toLowerCase().includes(q);
      const matchesCity = city === "All Cities" || screen.city === city;
      const matchesPrice = matchesPriceFilter(screen.price_per_hour, priceFilter);
      const matchesDate =
        !date ||
        (screen.status !== "booked" && screen.status !== "offline") ||
        (screen.status === "booked" && false);

      return matchesText && matchesCity && matchesPrice && matchesDate;
    });
  }, [search, city, priceFilter, date]);

  const markers = React.useMemo(
    () =>
      filtered.map((screen) => ({
        id: screen.id,
        lat: screen.lat,
        lng: screen.lng,
        title: screen.name,
        subtitle: `${formatUGX(screen.price_per_hour)} / hour`,
        color:
          screen.status === "available"
            ? "#10B981"
            : screen.status === "booked"
              ? "#F59E0B"
              : "#EF4444",
        onViewDetails: () => router.push(`/dashboard/customer/screens/${screen.id}`),
      })),
    [filtered, router],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Browse Screens</div>
          <div className="mt-1 text-sm text-gray-600">
            Map view for Kampala pins or grid view for quick comparison.
          </div>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search screens by name or location..."
                className="w-full text-sm text-gray-900 outline-none"
              />
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowCityMenu((open) => !open);
                setShowPriceMenu(false);
                setShowDateMenu(false);
              }}
              className="flex h-10 w-[140px] items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="truncate">{city}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {showCityMenu ? (
              <div className="absolute left-0 top-11 z-20 w-[200px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                {["All Cities", "Kampala"].map((option) => (
                  <label key={option} className="flex items-center gap-2 py-1 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={city === option}
                      onChange={() => {
                        setCity(option);
                        setShowCityMenu(false);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowPriceMenu((open) => !open);
                setShowCityMenu(false);
                setShowDateMenu(false);
              }}
              className="flex h-10 w-[140px] items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="truncate">{getPriceLabel(priceFilter)}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {showPriceMenu ? (
              <div className="absolute left-0 top-11 z-20 w-[220px] rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                {(
                  [
                    { key: "any", label: "Any Price" },
                    { key: "under_30", label: "Under UGX 30,000/hr" },
                    { key: "between_30_50", label: "UGX 30-50,000/hr" },
                    { key: "above_50", label: "Above UGX 50,000/hr" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setPriceFilter(option.key);
                      setShowPriceMenu(false);
                    }}
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowDateMenu((open) => !open);
                setShowCityMenu(false);
                setShowPriceMenu(false);
              }}
              className="flex h-10 w-[140px] items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="truncate">{date || "Any Date"}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {showDateMenu ? (
              <div className="absolute left-0 top-11 z-20 w-[220px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                <input
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setShowDateMenu(false);
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-200"
                />
                {date ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDate("");
                      setShowDateMenu(false);
                    }}
                    className="mt-2 text-xs font-medium text-blue-600"
                  >
                    Clear date
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="ml-auto inline-flex rounded-full bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setView("map")}
              className={
                view === "map"
                  ? "inline-flex h-8 w-9 items-center justify-center rounded-full bg-blue-600 text-white"
                  : "inline-flex h-8 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200"
              }
            >
              <MapIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              className={
                view === "grid"
                  ? "inline-flex h-8 w-9 items-center justify-center rounded-full bg-blue-600 text-white"
                  : "inline-flex h-8 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200"
              }
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {view === "map" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="success" dot>
              Live/Available
            </Badge>
            <Badge variant="warning" dot>
              Booked
            </Badge>
            <Badge variant="error" dot>
              Offline
            </Badge>
          </div>
          <MapboxMap markers={markers} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((screen) => (
            <Card
              key={screen.id}
              className="group overflow-hidden p-0 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
            >
              <button
                type="button"
                onClick={() => router.push(`/dashboard/customer/screens/${screen.id}`)}
                className="block w-full text-left"
              >
                <div className="relative aspect-[16/10] bg-gray-100">
                  <Image src={screen.image} alt={screen.name} fill className="object-cover" />
                  <div className="absolute left-3 top-3">
                    <Badge
                      variant={
                        screen.status === "available"
                          ? "success"
                          : screen.status === "booked"
                            ? "warning"
                            : "error"
                      }
                      dot
                      className="bg-white/95"
                    >
                      {String(screen.status).toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-sm font-semibold text-gray-900">{screen.name}</div>
                  <div className="mt-1 text-xs text-gray-500">{screen.location}</div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="font-semibold text-blue-600">
                      {formatUGX(screen.price_per_hour)}
                      <span className="ml-1 text-xs font-medium text-gray-400">/hour</span>
                    </div>
                    <div className="text-xs text-gray-500">{screen.traffic.toLocaleString("en-US")} traffic</div>
                  </div>
                  <div className="mt-3 overflow-hidden">
                    <div className="translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                      <span className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white">
                        View Details
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </Card>
          ))}

          {!filtered.length ? (
            <Card className="sm:col-span-2 lg:col-span-3">
              <div className="text-[18px] font-semibold text-gray-800">No screens match your filters</div>
              <div className="mt-2 text-sm text-gray-600">
                Try clearing your search or expanding the price range.
              </div>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setCity("All Cities");
                    setPriceFilter("any");
                    setDate("");
                    showToast({
                      type: "success",
                      title: "Filters cleared",
                      message: "Showing all screens.",
                    });
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      )}

      <div className="flex items-center justify-end">
        <Link href="/dashboard/customer">
          <Button variant="ghost">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
