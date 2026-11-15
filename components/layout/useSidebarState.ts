"use client";

import * as React from "react";

const STORAGE_KEY = "afrah_sidebar_expanded";
const MOBILE_BREAKPOINT = 768;

export function useSidebarState() {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(true);

  React.useEffect(() => {
    const updateStateFromViewport = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);

      if (mobile) {
        setIsExpanded(false);
        return;
      }

      const stored = window.localStorage.getItem(STORAGE_KEY);
      setIsExpanded(stored === null ? true : stored === "true");
    };

    updateStateFromViewport();
    window.addEventListener("resize", updateStateFromViewport);
    return () => window.removeEventListener("resize", updateStateFromViewport);
  }, []);

  const setExpanded = React.useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    setIsExpanded((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      window.localStorage.setItem(STORAGE_KEY, String(resolved));
      return resolved;
    });
  }, []);

  const toggleExpanded = React.useCallback(() => {
    setExpanded((prev) => !prev);
  }, [setExpanded]);

  return {
    isMobile,
    isExpanded,
    setExpanded,
    toggleExpanded,
    sidebarWidth: isExpanded ? 220 : 64,
  };
}

