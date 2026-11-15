"use client";

import * as React from "react";
import { CalendarDays, Zap } from "lucide-react";
import { eachDayOfInterval, isValid, parse, format } from "date-fns";

import { mockBookings, mockScreens } from "@/lib/mockData";
import { BookingCalendar } from "@/components/ui/BookingCalendar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type Block = {
  id: string;
  ref: string;
  screen: string;
  company: string;
  customer_name: string;
  start: string;
  end: string;
  status: "live" | "scheduled" | "completed";
};

function parseBlockDate(value: string) {
  const clean = value.split(" ")[0];
  const parsed = parse(clean, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? parsed : null;
}

function seedBlocks(screenName: string): Block[] {
  const base = mockBookings
    .filter((b) => b.screen === screenName)
    .map((b) => ({
      id: b.id,
      ref: b.ref,
      screen: b.screen,
      company: b.company,
      customer_name: b.customer_name,
      start: b.start,
      end: b.end,
      status:
        b.campaign_status === "live"
          ? ("live" as const)
          : b.campaign_status === "scheduled"
            ? ("scheduled" as const)
            : ("completed" as const),
    }));
  if (!base.length) {
    return [
      {
        id: `blk-${screenName}-001`,
        ref: "BK-2024-0099",
        screen: screenName,
        company: "Demo Retail",
        customer_name: "Rebecca Tumwine",
        start: "04/04/2024 12:00",
        end: "04/04/2024 18:00",
        status: "scheduled",
      },
    ];
  }
  return base;
}

function readPlaylist(screenId: string) {
  try {
    const raw = window.localStorage.getItem(`afrah_hod_playlist_${screenId}`);
    if (!raw) return null;
    return JSON.parse(raw) as Block[];
  } catch {
    return null;
  }
}

function writePlaylist(screenId: string, blocks: Block[]) {
  window.localStorage.setItem(`afrah_hod_playlist_${screenId}`, JSON.stringify(blocks));
  window.dispatchEvent(new Event("afrah_hod_playlists_updated"));
}

export default function ScreenPlaylistsPage() {
  const { showToast } = useToast();

  const [screenId, setScreenId] = React.useState(mockScreens[0]?.id ?? "1");
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const [active, setActive] = React.useState<Block | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [confirmEmergency, setConfirmEmergency] = React.useState(false);

  const screen = React.useMemo(() => mockScreens.find((s) => s.id === screenId) ?? mockScreens[0], [screenId]);

  React.useEffect(() => {
    const current = mockScreens.find((s) => s.id === screenId) ?? null;
    if (!current) return;
    const existing = readPlaylist(current.id);
    if (existing) {
      setBlocks(existing);
      return;
    }
    const seeded = seedBlocks(current.name);
    writePlaylist(current.id, seeded);
    setBlocks(seeded);
  }, [screenId]);

  React.useEffect(() => {
    const onUpdate = () => {
      const current = mockScreens.find((s) => s.id === screenId) ?? null;
      if (!current) return;
      const existing = readPlaylist(current.id);
      if (existing) setBlocks(existing);
    };
    window.addEventListener("afrah_hod_playlists_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_hod_playlists_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [screenId]);

  const currentlyPlaying = React.useMemo(
    () => blocks.find((b) => b.status === "live") ?? blocks[0] ?? null,
    [blocks],
  );
  const bookedDates = React.useMemo(() => {
    const collected: Date[] = [];
    blocks.forEach((block) => {
      const start = parseBlockDate(block.start);
      const end = parseBlockDate(block.end) ?? start;
      if (!start || !end) return;
      const range =
        end.getTime() >= start.getTime() ? eachDayOfInterval({ start, end }) : [start];
      collected.push(...range);
    });
    return collected;
  }, [blocks]);
  const activeDates = React.useMemo(() => {
    const collected: Date[] = [];
    blocks
      .filter((block) => block.status === "live")
      .forEach((block) => {
        const start = parseBlockDate(block.start);
        const end = parseBlockDate(block.end) ?? start;
        if (!start || !end) return;
        const range =
          end.getTime() >= start.getTime() ? eachDayOfInterval({ start, end }) : [start];
        collected.push(...range);
      });
    return collected;
  }, [blocks]);
  const labelsByDate = React.useMemo(() => {
    const labels: Record<string, string> = {};
    blocks.forEach((block) => {
      const day = parseBlockDate(block.start);
      if (!day) return;
      labels[format(day, "yyyy-MM-dd")] = block.company;
    });
    return labels;
  }, [blocks]);
  const dayMatches = React.useMemo(() => {
    if (!selectedDate) return [] as Block[];
    const selectedKey = format(selectedDate, "dd/MM/yyyy");
    return blocks.filter((block) => block.start.startsWith(selectedKey) || block.end.startsWith(selectedKey));
  }, [blocks, selectedDate]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[24px] font-semibold text-gray-900">Screen Playlists</div>
        <div className="mt-1 text-sm text-gray-600">
          Screen selector + playlist view + weekly schedule.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Screens</div>
          <div className="mt-4 space-y-2">
            {mockScreens.map((s) => {
              const activeScreen = s.id === screenId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScreenId(s.id)}
                  className={[
                    "w-full rounded-xl border px-4 py-3 text-left",
                    activeScreen ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50",
                  ].join(" ")}
                >
                  <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                  <div className="mt-1 text-xs text-gray-500">{s.location}</div>
                  <div className="mt-2">
                    <Badge variant={s.status === "offline" ? "error" : "success"} dot>
                      {s.status}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[18px] font-semibold text-gray-800">Currently Playing</div>
                <div className="mt-1 text-sm text-gray-600">
                  Live content indicator (simulation).
                </div>
              </div>
              <Button variant="danger" onClick={() => setConfirmEmergency(true)}>
                <Zap className="h-4 w-4" />
                Push Emergency Content
              </Button>
            </div>

            {currentlyPlaying ? (
              <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{currentlyPlaying.company}</div>
                    <div className="mt-1 text-xs text-gray-500 font-mono">{currentlyPlaying.ref}</div>
                  </div>
                  <Badge variant="live" dot>
                    Live
                  </Badge>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  {currentlyPlaying.start} → {currentlyPlaying.end}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Nothing playing right now.
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[18px] font-semibold text-gray-800">Weekly schedule</div>
                <div className="mt-1 text-sm text-gray-600">
                  Click any block to view campaign details and remove.
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6">
              <BookingCalendar
                bookedDates={bookedDates}
                activeDates={activeDates}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                labelsByDate={labelsByDate}
              />
            </div>

            <div className="mt-4 space-y-2">
              {(selectedDate ? dayMatches : blocks.slice(0, 2)).map((block) => (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => setActive(block)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{block.company}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {block.start} → {block.end}
                    </div>
                  </div>
                  <Badge variant={block.status === "live" ? "success" : block.status === "scheduled" ? "info" : "neutral"}>
                    {block.status}
                  </Badge>
                </button>
              ))}
              {!selectedDate && blocks.length > 2 ? (
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">Select a date to view exact slots.</div>
              ) : null}
              {selectedDate && !dayMatches.length ? (
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">No playlist block on this date.</div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title="Campaign"
        footer={
          active && screen ? (
            <>
              <Button variant="secondary" onClick={() => setActive(null)}>
                Close
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const next = (readPlaylist(screen.id) ?? blocks).filter((x) => x.id !== active.id);
                  writePlaylist(screen.id, next);
                  showToast({ type: "success", title: "Removed", message: "Removed from playlist." });
                  setActive(null);
                }}
              >
                Remove
              </Button>
            </>
          ) : null
        }
      >
        {active ? (
          <div className="space-y-3 text-sm text-gray-700">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Booking</div>
              <div className="mt-2 font-mono text-gray-900">{active.ref}</div>
              <div className="mt-1 text-gray-600">
                {active.customer_name} — {active.company}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Timing</div>
              <div className="mt-2 text-gray-900">{active.start} → {active.end}</div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={confirmEmergency}
        onClose={() => setConfirmEmergency(false)}
        title="Push Emergency Content"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmEmergency(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                showToast({
                  type: "success",
                  title: "Pushed",
                  message: "Emergency content pushed to selected screen (simulation).",
                });
                setConfirmEmergency(false);
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="text-sm text-gray-700">
          This will override the current playlist temporarily. Continue?
        </div>
      </Modal>
    </div>
  );
}
