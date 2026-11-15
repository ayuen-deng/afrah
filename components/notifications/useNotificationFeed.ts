"use client";

import * as React from "react";

import { getRoleNotifications } from "@/hooks/useNotifications";
import {
  type NotificationRecord,
  type NotificationRoleKey,
} from "@/lib/notifications";

type StoredNotificationState = {
  readIds: string[];
  dismissedIds: string[];
};

const STORAGE_PREFIX = "afrah_notifications";
const SYNC_EVENT = "afrah_notifications_updated";

function getStorageKey(roleKey: NotificationRoleKey) {
  return `${STORAGE_PREFIX}_${roleKey}`;
}

function readStoredState(roleKey: NotificationRoleKey): StoredNotificationState {
  if (typeof window === "undefined") {
    return { readIds: [], dismissedIds: [] };
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(roleKey));
    if (!raw) return { readIds: [], dismissedIds: [] };
    const parsed = JSON.parse(raw) as Partial<StoredNotificationState>;
    return {
      readIds: Array.isArray(parsed.readIds) ? parsed.readIds.filter(Boolean) : [],
      dismissedIds: Array.isArray(parsed.dismissedIds) ? parsed.dismissedIds.filter(Boolean) : [],
    };
  } catch {
    return { readIds: [], dismissedIds: [] };
  }
}

function writeStoredState(roleKey: NotificationRoleKey, next: StoredNotificationState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(roleKey), JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { roleKey } }));
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function useNotificationFeed(roleKey: NotificationRoleKey) {
  const [state, setState] = React.useState<StoredNotificationState>(() =>
    readStoredState(roleKey),
  );

  React.useEffect(() => {
    setState(readStoredState(roleKey));
  }, [roleKey]);

  React.useEffect(() => {
    const sync = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.roleKey && event.detail.roleKey !== roleKey) {
        return;
      }
      setState(readStoredState(roleKey));
    };

    window.addEventListener(SYNC_EVENT, sync as EventListener);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SYNC_EVENT, sync as EventListener);
      window.removeEventListener("storage", sync);
    };
  }, [roleKey]);

  const notifications = React.useMemo(() => {
    const source = getRoleNotifications(roleKey);
    const read = new Set(state.readIds);
    const dismissed = new Set(state.dismissedIds);

    return source
      .filter((notification) => !dismissed.has(notification.id))
      .map((notification) => ({
        ...notification,
        read: notification.read || read.has(notification.id),
      }));
  }, [roleKey, state.dismissedIds, state.readIds]);

  const unreadCount = React.useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const urgentCount = React.useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.read && notification.priority === "high",
      ).length,
    [notifications],
  );

  const persist = React.useCallback(
    (updater: (current: StoredNotificationState) => StoredNotificationState) => {
      setState((current) => {
        const next = updater(current);
        writeStoredState(roleKey, next);
        return next;
      });
    },
    [roleKey],
  );

  const markAsRead = React.useCallback(
    (id: string) => {
      persist((current) => ({
        ...current,
        readIds: unique([...current.readIds, id]),
      }));
    },
    [persist],
  );

  const markAllAsRead = React.useCallback(() => {
    persist((current) => ({
      ...current,
      readIds: unique([
        ...current.readIds,
        ...notifications.map((notification) => notification.id),
      ]),
    }));
  }, [notifications, persist]);

  const dismiss = React.useCallback(
    (id: string) => {
      persist((current) => ({
        readIds: unique([...current.readIds, id]),
        dismissedIds: unique([...current.dismissedIds, id]),
      }));
    },
    [persist],
  );

  const resetAll = React.useCallback(() => {
    persist(() => ({ readIds: [], dismissedIds: [] }));
  }, [persist]);

  return {
    notifications,
    unreadCount,
    urgentCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    resetAll,
  };
}
