"use client";

import * as React from "react";

import { Sidebar, type SidebarNavItem } from "@/components/layout/Sidebar";
import { useSidebarState } from "@/components/layout/useSidebarState";
import { TopNav } from "@/components/ui/TopNav";

type AppShellFrameProps = {
  roleLabel: string;
  items: SidebarNavItem[];
  user: { name: string; initials: string };
  breadcrumb: string[];
  onLogout?: () => void | Promise<void>;
  onNotificationsClick?: () => void;
  sidebarFooterExtra?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShellFrame({
  roleLabel,
  items,
  user,
  breadcrumb,
  onLogout,
  onNotificationsClick,
  sidebarFooterExtra,
  children,
}: AppShellFrameProps) {
  const { isMobile, isExpanded, setExpanded, toggleExpanded, sidebarWidth } = useSidebarState();

  return (
    <div className="fixed inset-0 overflow-hidden bg-page">
      {isMobile && isExpanded ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setExpanded(false)}
        />
      ) : null}

      <aside
        className="fixed left-0 top-0 z-30 h-screen overflow-y-auto transition-all duration-200 ease-in-out"
        style={{ width: sidebarWidth }}
      >
        <Sidebar
          roleLabel={roleLabel}
          items={items}
          user={user}
          onLogout={onLogout}
          isExpanded={isExpanded}
          onToggle={toggleExpanded}
          footerExtra={sidebarFooterExtra}
        />
      </aside>

      <main
        className="absolute inset-y-0 right-0 flex min-w-0 flex-col overflow-y-auto overflow-x-hidden transition-all duration-200 ease-in-out"
        style={{ left: sidebarWidth }}
      >
        <TopNav
          breadcrumb={breadcrumb}
          user={user}
          roleLabel={roleLabel}
          onMenuClick={() => setExpanded((prev) => !prev)}
          onNotificationsClick={onNotificationsClick}
        />

        <div className="flex-1 px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
