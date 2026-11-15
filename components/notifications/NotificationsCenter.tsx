"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckSquare,
  CreditCard,
  Eye,
  FileText,
  Megaphone,
  Package,
  Play,
  Settings2,
  Star,
  TrendingUp,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import {
  getNotificationGroupLabel,
  getNotificationPath,
  getTypeFiltersForRole,
  type NotificationRecord,
  type NotificationRoleKey,
  type NotificationType,
} from "@/lib/notifications";
import { useNotificationFeed } from "@/components/notifications/useNotificationFeed";

type NotificationFilter = "all" | "unread" | "important" | "today";

const typeFilterLabels: Record<NotificationFilter, string> = {
  all: "All",
  unread: "Unread",
  important: "Important",
  today: "Today",
};

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function getTypeMeta(type: NotificationRecord["type"]) {
  switch (type) {
    case "booking":
      return { icon: CalendarDays, color: "blue", tone: "bg-blue-100 text-blue-600" };
    case "payment":
    case "invoice":
      return { icon: CreditCard, color: "green", tone: "bg-green-100 text-green-600" };
    case "campaign":
      return { icon: Play, color: "purple", tone: "bg-purple-100 text-purple-600" };
    case "ad_review":
      return { icon: Eye, color: "amber", tone: "bg-amber-100 text-amber-600" };
    case "rejection":
      return { icon: XCircle, color: "red", tone: "bg-red-100 text-red-600" };
    case "task":
      return { icon: CheckSquare, color: "indigo", tone: "bg-indigo-100 text-indigo-600" };
    case "hr":
      return { icon: Users, color: "teal", tone: "bg-teal-100 text-teal-600" };
    case "alert":
      return { icon: AlertTriangle, color: "red", tone: "bg-red-100 text-red-600" };
    case "system":
      return { icon: Settings2, color: "gray", tone: "bg-gray-100 text-gray-600" };
    case "recognition":
      return { icon: Star, color: "yellow", tone: "bg-yellow-100 text-yellow-600" };
    case "announcement":
      return { icon: Megaphone, color: "blue", tone: "bg-blue-100 text-blue-600" };
    case "commission":
      return { icon: TrendingUp, color: "emerald", tone: "bg-emerald-100 text-emerald-600" };
    case "fault":
      return { icon: Wrench, color: "orange", tone: "bg-orange-100 text-orange-600" };
    case "asset":
      return { icon: Package, color: "cyan", tone: "bg-cyan-100 text-cyan-600" };
    case "query":
    case "quote":
    case "screen":
    default:
      return { icon: FileText, color: "slate", tone: "bg-slate-100 text-slate-600" };
  }
}

function formatTimeAgo(value: string) {
  return value;
}

function groupNotifications(notifications: NotificationRecord[]) {
  const ordered = new Map<string, NotificationRecord[]>();
  notifications.forEach((notification) => {
    const label = getNotificationGroupLabel(notification.date);
    const list = ordered.get(label) ?? [];
    list.push(notification);
    ordered.set(label, list);
  });

  const order = ["Today", "Yesterday", "Earlier"];
  return Array.from(ordered.entries()).sort(
    ([a], [b]) => order.indexOf(a) - order.indexOf(b),
  );
}

function filterNotifications(
  notifications: NotificationRecord[],
  filter: NotificationFilter,
  typeFilter: NotificationType | "all",
) {
  return notifications.filter((notification) => {
    if (filter === "unread" && notification.read) return false;
    if (filter === "important" && notification.priority !== "high") return false;
    if (filter === "today" && getNotificationGroupLabel(notification.date) !== "Today") {
      return false;
    }
    if (typeFilter !== "all" && notification.type !== typeFilter) return false;
    return true;
  });
}

function NotificationAvatar({ notification }: { notification: NotificationRecord }) {
  const meta = getTypeMeta(notification.type);
  const Icon = meta.icon;

  return (
    <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", meta.tone)}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function NotificationRow({
  notification,
  onView,
  onDismiss,
}: {
  notification: NotificationRecord;
  onView: (notification: NotificationRecord) => Promise<void> | void;
  onDismiss: (notification: NotificationRecord) => Promise<void> | void;
}) {
  const [viewing, setViewing] = React.useState(false);
  const [dismissing, setDismissing] = React.useState(false);
  const viewVariant = notification.priority === "high" ? "danger" : "primary";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        "group flex gap-4 rounded-xl border p-4 transition-shadow duration-200 hover:shadow-md",
        notification.read
          ? "border-transparent bg-gray-50"
          : "border-l-4 border-l-blue-500 bg-white shadow-sm",
      )}
    >
      <button
        type="button"
        onClick={() => void onView(notification)}
        className="flex flex-1 items-start gap-4 text-left"
      >
        <NotificationAvatar notification={notification} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className={cn(
                  "truncate text-sm font-semibold",
                  notification.read ? "text-gray-600" : "text-gray-900",
                )}
              >
                {notification.title}
              </div>
              <div className="mt-1 line-clamp-1 text-sm text-gray-500">{notification.body}</div>
            </div>
            <div className="shrink-0 text-xs text-gray-400">{formatTimeAgo(notification.time)}</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {notification.meta.map((item) => (
              <span key={item} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {item}
              </span>
            ))}
          </div>
        </div>
      </button>

      <div className="flex flex-col items-end justify-between gap-2">
        <Button
          variant={viewVariant}
          loading={viewing}
          autoLoadOnClick={false}
          className="h-8 px-3 text-xs shadow-none"
          onClick={async (event) => {
            event.stopPropagation();
            setViewing(true);
            try {
              await onView(notification);
            } finally {
              setViewing(false);
            }
          }}
        >
          View
        </Button>

        <Button
          variant="ghost"
          type="button"
          loading={dismissing}
          autoLoadOnClick={false}
          className="h-7 px-2 text-xs text-gray-400 hover:bg-transparent hover:text-red-400"
          onClick={async (event) => {
            event.stopPropagation();
            setDismissing(true);
            try {
              await onDismiss(notification);
            } finally {
              setDismissing(false);
            }
          }}
        >
          Dismiss
        </Button>
      </div>
    </motion.div>
  );
}

export function NotificationBellMenu({
  roleKey,
}: {
  roleKey: NotificationRoleKey;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<NotificationFilter>("all");
  const [typeFilter, setTypeFilter] = React.useState<NotificationType | "all">("all");
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const { notifications, unreadCount, urgentCount, markAsRead, markAllAsRead, dismiss } =
    useNotificationFeed(roleKey);
  const roleTypeFilters = React.useMemo(() => getTypeFiltersForRole(roleKey), [roleKey]);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const visible = React.useMemo(
    () => filterNotifications(notifications, filter, typeFilter),
    [filter, notifications, typeFilter],
  );

  const grouped = React.useMemo(() => groupNotifications(visible), [visible]);

  const navigateToNotification = React.useCallback(
    async (notification: NotificationRecord) => {
      markAsRead(notification.id);
      setOpen(false);
      await delay(180);
      router.push(notification.link);
    },
    [markAsRead, router],
  );

  const seeAllPath = getNotificationPath(roleKey);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm",
              urgentCount > 0 && "animate-pulse",
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-12 z-50 w-[380px] max-w-[calc(100vw-1rem)] rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <div>
                <div className="text-base font-semibold text-gray-900">Notifications</div>
                <div className="text-xs text-gray-500">
                  {unreadCount} unread • {notifications.length} total
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-xs text-blue-600 hover:bg-blue-50"
                  onClick={async () => {
                    markAllAsRead();
                    await delay(150);
                  }}
                >
                  Mark all as Read
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-xs text-gray-400 hover:bg-gray-50"
                  onClick={() => {
                    setOpen(false);
                    router.push(seeAllPath);
                  }}
                >
                  See All →
                </Button>
              </div>
            </div>

            <div className="flex gap-1 overflow-x-auto px-4 pt-3">
              {(["all", "unread", "important"] as NotificationFilter[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs transition",
                    filter === value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  )}
                >
                  {typeFilterLabels[value]}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto px-4 pt-3">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition",
                  typeFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                )}
              >
                All Types
              </button>
              {roleTypeFilters.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTypeFilter(option.value)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition",
                    typeFilter === option.value
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="max-h-[380px] space-y-4 overflow-y-auto px-4 py-4">
              {grouped.length ? (
                grouped.map(([group, items]) => (
                  <div key={group} className="space-y-3">
                    <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">
                      {group}
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {items.map((notification) => (
                          <motion.div key={notification.id} layout>
                            <div
                              className={cn(
                                "rounded-xl border border-slate-100 bg-white p-3 transition hover:bg-gray-50",
                                notification.read && "bg-gray-50",
                              )}
                              role="button"
                              tabIndex={0}
                              onClick={() => void navigateToNotification(notification)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  void navigateToNotification(notification);
                                }
                              }}
                            >
                              <div className="flex gap-3">
                                <NotificationAvatar notification={notification} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <div
                                        className={cn(
                                          "truncate text-sm font-semibold",
                                          notification.read ? "text-gray-600" : "text-gray-900",
                                        )}
                                      >
                                        {notification.title}
                                      </div>
                                      <div className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                                        {notification.body}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {notification.read ? null : (
                                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                                      )}
                                      <div className="text-[11px] text-gray-400">{notification.time}</div>
                                    </div>
                                  </div>

                                  {notification.meta.length ? (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {notification.meta.slice(0, 3).map((item) => (
                                        <span
                                          key={item}
                                          className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
                                        >
                                          {item}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              <div className="mt-3 flex justify-end">
                                <Button
                                  variant="secondary"
                                  className="h-7 px-2.5 text-xs"
                                  onClick={async (event) => {
                                    event.stopPropagation();
                                    await navigateToNotification(notification);
                                  }}
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6">
                  <EmptyState
                    icon={Bell}
                    title="All caught up!"
                    description="No notifications for this filter"
                    className="border-0 bg-transparent p-0 shadow-none"
                  />
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-4 py-3 text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => {
                  setOpen(false);
                  router.push(seeAllPath);
                }}
              >
                View all notifications →
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function NotificationsPage({
  roleKey,
}: {
  roleKey: NotificationRoleKey;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [filter, setFilter] = React.useState<NotificationFilter>("all");
  const [typeFilter, setTypeFilter] = React.useState<NotificationType | "all">("all");
  const { notifications, unreadCount, markAllAsRead, markAsRead, dismiss } =
    useNotificationFeed(roleKey);
  const [markingAll, setMarkingAll] = React.useState(false);
  const roleTypeFilters = React.useMemo(() => getTypeFiltersForRole(roleKey), [roleKey]);

  const visible = React.useMemo(
    () => filterNotifications(notifications, filter, typeFilter),
    [filter, notifications, typeFilter],
  );
  const grouped = React.useMemo(() => groupNotifications(visible), [visible]);

  const navigateToNotification = React.useCallback(
    async (notification: NotificationRecord) => {
      markAsRead(notification.id);
      await delay(150);
      router.push(notification.link);
    },
    [markAsRead, router],
  );

  const markAll = async () => {
    setMarkingAll(true);
    try {
      markAllAsRead();
      showToast({
        type: "success",
        title: "Notifications updated",
        message: "All notifications marked as read.",
      });
      await delay(220);
    } finally {
      setMarkingAll(false);
    }
  };

  const isFiltered = filter !== "all" || typeFilter !== "all";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`You have ${unreadCount} notifications to go through`}
        actions={
          <Button
            variant="ghost"
            loading={markingAll}
            onClick={markAll}
            className="h-9 px-3 text-sm text-blue-600 hover:bg-blue-50"
          >
            Mark all as Read
          </Button>
        }
      />

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "unread", "important", "today"] as NotificationFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  filter === value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                )}
              >
                {typeFilterLabels[value]}
              </button>
              ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  typeFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                )}
              >
                All Types
              </button>
              {roleTypeFilters.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTypeFilter(option.value)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition",
                    typeFilter === option.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {isFiltered ? (
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setFilter("all");
                  setTypeFilter("all");
                }}
              >
                Clear All
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {grouped.length ? (
          grouped.map(([group, items]) => (
            <section key={group} className="space-y-3">
              <div className="border-b border-gray-100 pb-2 text-sm font-semibold text-gray-500">
                {group}
              </div>
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {items.map((notification) => (
                    <motion.div key={notification.id} layout>
                      <NotificationRow
                        notification={notification}
                        onView={navigateToNotification}
                        onDismiss={async (item) => {
                          dismiss(item.id);
                          showToast({
                            type: "success",
                            title: "Notification dismissed",
                            message: item.title,
                          });
                          await delay(120);
                        }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))
        ) : (
          <Card className="py-14">
            <EmptyState
              icon={Bell}
              title="All caught up!"
              description="No notifications for this filter"
              action={
                isFiltered
                    ? {
                      label: "Clear filters",
                      onClick: () => {
                        setFilter("all");
                        setTypeFilter("all");
                      },
                    }
                  : undefined
              }
              className="border-0 bg-transparent p-0 shadow-none"
            />
          </Card>
        )}
      </div>
    </div>
  );
}
