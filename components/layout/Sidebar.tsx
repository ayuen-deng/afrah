"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/cn";

export type SidebarNavItem = {
  section?: string;
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
};

export type SidebarProps = {
  roleLabel: string;
  items: SidebarNavItem[];
  user: { name: string; initials: string };
  onLogout?: () => void | Promise<void>;
  isExpanded: boolean;
  onToggle: () => void;
  footerExtra?: React.ReactNode;
};

type Group = { section: string; items: SidebarNavItem[] };

type SidebarNavLinkProps = {
  item: SidebarNavItem;
  active: boolean;
  isExpanded: boolean;
};

function SidebarNavLink({ item, active, isExpanded }: SidebarNavLinkProps) {
  const [tooltip, setTooltip] = React.useState({ visible: false, top: 0, left: 0 });
  const Icon = item.icon;
  const showBadge = item.badge !== undefined && item.badge !== 0 && item.badge !== "0";

  return (
    <div
      className="relative"
      onMouseEnter={(event) => {
        if (!isExpanded) {
          const rect = event.currentTarget.getBoundingClientRect();
          setTooltip({ visible: true, top: rect.top + rect.height / 2, left: rect.right + 8 });
        }
      }}
      onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
    >
      <Link
        href={item.href}
        className={cn(
          "relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors",
          active
            ? "bg-blue-50 text-blue-600"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
          !isExpanded && "justify-center px-0",
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
        {isExpanded ? <span>{item.label}</span> : null}

        {isExpanded && showBadge ? (
          <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-100">
            {item.badge}
          </span>
        ) : null}

        {!isExpanded && showBadge ? (
          <span className="absolute right-[12px] top-[9px] h-2 w-2 rounded-full bg-red-500" />
        ) : null}
      </Link>

      {!isExpanded ? (
        <div
          className={cn(
            "pointer-events-none fixed left-0 top-0 z-[70] -translate-y-1/2 whitespace-nowrap rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white shadow-lg transition-opacity duration-75",
            tooltip.visible ? "opacity-100" : "opacity-0",
          )}
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          {item.label}
        </div>
      ) : null}
    </div>
  );
}

export function Sidebar({
  roleLabel,
  items,
  user,
  onLogout,
  isExpanded,
  onToggle,
  footerExtra,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [footerTooltip, setFooterTooltip] = React.useState({
    visible: false,
    top: 0,
    left: 0,
    text: "",
    red: false,
  });
  const fullPath = React.useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const groups = React.useMemo<Group[]>(() => {
    const ordered: Group[] = [];
    items.forEach((item) => {
      const sectionName = item.section ?? "";
      const current = ordered[ordered.length - 1];
      if (!current || current.section !== sectionName) {
        ordered.push({ section: sectionName, items: [item] });
        return;
      }
      current.items.push(item);
    });
    return ordered;
  }, [items]);

  return (
    <aside
      aria-label={`${roleLabel} navigation`}
      className="flex h-full w-full flex-col overflow-x-hidden border-r border-slate-800 bg-sidebar text-white"
    >
      <div className="border-b border-slate-700">
        {isExpanded ? (
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-blue-600 text-[11px] font-bold text-white">
                AM
              </div>
              <span className="whitespace-nowrap text-sm font-semibold text-white">Afrah Media</span>
            </div>
            <button
              type="button"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center px-2 py-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-blue-600 text-[11px] font-bold text-white">
              AM
            </div>
            <button
              type="button"
              onClick={onToggle}
              aria-label="Expand sidebar"
              className="mt-2 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4", !isExpanded && "px-1")}>
        {groups.map((group, groupIndex) => (
          <div key={`${group.section}-${groupIndex}`} className="space-y-1">
            {group.section ? (
              isExpanded ? (
                <div className="px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  {group.section}
                </div>
              ) : (
                <div className="px-3 pb-2 pt-4">
                  <div className="h-px w-full bg-slate-700/70" />
                </div>
              )
            ) : null}

            {group.items.map((item) => {
              const hasQuery = item.href.includes("?");
              const active = hasQuery
                ? fullPath === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <SidebarNavLink
                  key={item.href}
                  item={item}
                  active={active}
                  isExpanded={isExpanded}
                />
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-3 py-4">
        {isExpanded ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-[13px] font-semibold">
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-white">{user.name}</div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-white"
              aria-label="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative flex justify-center"
              onMouseEnter={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setFooterTooltip({
                  visible: true,
                  top: rect.top + rect.height / 2,
                  left: rect.right + 8,
                  text: "Logout",
                  red: true,
                });
              }}
              onMouseLeave={() => setFooterTooltip((prev) => ({ ...prev, visible: false }))}
            >
              <button
                type="button"
                onClick={onLogout}
                aria-label="Logout"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-red-600 hover:text-white"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>

            <div
              className="relative flex justify-center"
              onMouseEnter={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setFooterTooltip({
                  visible: true,
                  top: rect.top + rect.height / 2,
                  left: rect.right + 8,
                  text: user.name,
                  red: false,
                });
              }}
              onMouseLeave={() => setFooterTooltip((prev) => ({ ...prev, visible: false }))}
            >
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-[12px] font-semibold text-white">
                {user.initials}
              </div>
            </div>

            <div
              className={cn(
                "pointer-events-none fixed left-0 top-0 z-[70] -translate-y-1/2 whitespace-nowrap rounded-lg bg-black px-3 py-1.5 text-sm font-medium shadow-lg transition-opacity duration-75",
                footerTooltip.red ? "text-red-400" : "text-white",
                footerTooltip.visible ? "opacity-100" : "opacity-0",
              )}
              style={{ top: footerTooltip.top, left: footerTooltip.left }}
            >
              {footerTooltip.text}
            </div>
          </div>
        )}
      </div>

      {isExpanded && footerExtra ? <div className="border-t border-slate-800 px-3 py-4">{footerExtra}</div> : null}
    </aside>
  );
}
