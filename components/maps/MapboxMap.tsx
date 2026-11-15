"use client";

import * as React from "react";
import mapboxgl from "mapbox-gl";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type MarkerItem = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  title: string;
  subtitle?: string;
  onViewDetails?: () => void;
  actions?: Array<{ label: string; onClick: () => void; tone?: "primary" | "secondary" }>;
};

export function MapboxMap({
  markers,
  heightClassName = "h-[520px]",
  center = { lat: 0.3163, lng: 32.5822 },
  zoom = 12,
}: {
  markers: MarkerItem[];
  heightClassName?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    if (!ref.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [center.lng, center.lat],
      zoom,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

    const created: mapboxgl.Marker[] = [];
    markers.forEach((m) => {
      const el = document.createElement("button");
      el.type = "button";
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "9999px";
      el.style.background = m.color;
      el.style.boxShadow = "0 8px 20px rgba(15, 23, 42, 0.18)";
      el.style.border = "2px solid #ffffff";

      const popup = new mapboxgl.Popup({ offset: 14 }).setDOMContent(
        (() => {
          const wrap = document.createElement("div");
          wrap.style.minWidth = "220px";
          wrap.innerHTML = `<div style="font-weight: 600; font-size: 14px; color: #0f172a">${m.title}</div>
<div style="margin-top: 2px; font-size: 12px; color: #64748b">${m.subtitle ?? ""}</div>`;

          const actions =
            m.actions && m.actions.length
              ? m.actions
              : m.onViewDetails
                ? [{ label: "View Details", onClick: () => m.onViewDetails?.(), tone: "primary" as const }]
                : [];

          if (actions.length) {
            const actionsWrap = document.createElement("div");
            actionsWrap.style.display = "grid";
            actionsWrap.style.gap = "8px";
            actionsWrap.style.marginTop = "10px";

            actions.forEach((action) => {
              const btn = document.createElement("button");
              btn.type = "button";
              btn.textContent = action.label;
              btn.style.width = "100%";
              btn.style.border = action.tone === "secondary" ? "1px solid #E2E8F0" : "none";
              btn.style.background = action.tone === "secondary" ? "#ffffff" : "#2563EB";
              btn.style.color = action.tone === "secondary" ? "#0F172A" : "white";
              btn.style.borderRadius = "10px";
              btn.style.padding = "8px 10px";
              btn.style.fontWeight = "600";
              btn.style.cursor = "pointer";
              btn.onclick = () => action.onClick();
              actionsWrap.appendChild(btn);
            });

            wrap.appendChild(actionsWrap);
          }
          return wrap;
        })(),
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .setPopup(popup)
        .addTo(map);
      created.push(marker);
    });

    return () => {
      created.forEach((mk) => mk.remove());
      map.remove();
    };
  }, [markers, center.lat, center.lng, zoom]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    return (
      <Card className="p-6">
        <div className="text-[18px] font-semibold text-gray-800">
          Mapbox setup required
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Add <span className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</span> to
          enable the Kampala map view.
        </div>
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() =>
              window.navigator.clipboard.writeText("NEXT_PUBLIC_MAPBOX_TOKEN=")
            }
          >
            Copy env key
          </Button>
        </div>
      </Card>
    );
  }

  return <div ref={ref} className={`w-full overflow-hidden rounded-xl border border-gray-200 ${heightClassName}`} />;
}
