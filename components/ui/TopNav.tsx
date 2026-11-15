"use client";

import * as React from "react";
import { ChevronDown, Menu, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/cn";
import { NotificationBellMenu } from "@/components/notifications/NotificationsCenter";
import {
  inferRoleFromLabel,
  roleHome,
  roleLabels,
  roleSwitcherOptions,
  type Role,
} from "@/lib/roles";
import { getNotificationRoleKeyFromLabel } from "@/lib/notifications";

export type TopNavProps = {
  breadcrumb?: string[];
  user: { name: string; initials: string };
  roleLabel?: string;
  onMenuClick?: () => void;
  onNotificationsClick?: () => void;
};

export function TopNav({
  breadcrumb = [],
  user,
  roleLabel,
  onMenuClick,
  onNotificationsClick,
}: TopNavProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [switchingRole, setSwitchingRole] = React.useState<Role | null>(null);
  const [isLocalHost, setIsLocalHost] = React.useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  });
  const currentRole = roleLabel ? inferRoleFromLabel(roleLabel) : null;
  const notificationRoleKey = getNotificationRoleKeyFromLabel(roleLabel) ?? "customer";

  React.useEffect(() => {
    setIsLocalHost(
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1",
    );
  }, []);

  const showRoleSwitcher = process.env.NODE_ENV !== "production" || isLocalHost;

  const handleSwitchRole = async (role: Role) => {
    setSwitchingRole(role);
    try {
      const response = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { redirectTo?: string };
      setOpen(false);
      router.push(payload.redirectTo ?? roleHome[role]);
      router.refresh();
    } finally {
      setSwitchingRole(null);
    }
  };

  return (
    <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-4">
      <div className="min-w-0 text-sm text-gray-500">
        {onMenuClick ? (
          <button
            type="button"
            onClick={onMenuClick}
            className="mr-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : null}
        {breadcrumb.length ? (
          <div className="truncate">
            {breadcrumb.map((b, idx) => (
              <React.Fragment key={`${b}-${idx}`}>
                <span className={cn(idx === breadcrumb.length - 1 && "text-gray-700")}>
                  {b}
                </span>
                {idx !== breadcrumb.length - 1 ? <span className="px-2">/</span> : null}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">Dashboard</div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showRoleSwitcher ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
              aria-label="Role switcher"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {currentRole ? roleLabels[currentRole] : "Role"}
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {open ? (
              <div className="absolute right-0 top-11 z-30 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Dev role switch
                </div>
                <div className="space-y-1">
                  {roleSwitcherOptions.map((option) => {
                    const active = option.role === currentRole;
                    return (
                      <button
                        key={option.role}
                        type="button"
                        onClick={() => handleSwitchRole(option.role)}
                        disabled={switchingRole !== null}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                          active ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50",
                          switchingRole === option.role && "opacity-70",
                        )}
                      >
                        <span>{option.label}</span>
                        {switchingRole === option.role ? (
                          <span className="text-xs text-slate-400">Switching...</span>
                        ) : active ? (
                          <span className="text-xs font-medium text-blue-600">Current</span>
                        ) : (
                          <span className="text-xs text-slate-400">Go</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <NotificationBellMenu roleKey={notificationRoleKey} />

        <div className="flex items-center gap-3">
          <div className="hidden text-sm font-medium text-gray-700 sm:block">
            {user.name}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
            {user.initials}
          </div>
        </div>
      </div>
    </header>
  );
}
