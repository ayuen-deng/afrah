"use client";

import * as React from "react";

import { mockScreens } from "@/lib/mockData";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

const templateItems = [
  { id: "tpl-001", title: "Telecom Flash Sale", industry: "Telecom", preview: "https://picsum.photos/seed/dtpl1/640/360" },
  { id: "tpl-002", title: "Food Lunch Promo", industry: "F&B", preview: "https://picsum.photos/seed/dtpl2/640/360" },
  { id: "tpl-003", title: "Retail Weekend Offer", industry: "Retail", preview: "https://picsum.photos/seed/dtpl3/640/360" },
  { id: "tpl-004", title: "Corporate Event Screen", industry: "Corporate", preview: "https://picsum.photos/seed/dtpl4/640/360" },
];

export function DesignerResourcesPage() {
  const { showToast } = useToast();
  const [selectedScreenId, setSelectedScreenId] = React.useState<string | null>(null);
  const [activeIndustry, setActiveIndustry] = React.useState("All");
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  const selectedScreen = mockScreens.find((screen) => screen.id === selectedScreenId) ?? null;
  const selectedTemplate = templateItems.find((item) => item.id === previewId) ?? null;
  const filteredTemplates = templateItems.filter((item) => activeIndustry === "All" || item.industry === activeIndustry);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[24px] font-semibold text-gray-900">Resources</div>
        <div className="mt-1 text-sm text-gray-600">
          Screen specifications, standards, and reusable template previews.
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[18px] font-semibold text-gray-800">Screen Specs</div>
            <div className="mt-1 text-sm text-gray-600">Click a screen to inspect the reference details.</div>
          </div>
        </div>
        <div className="mt-6">
          <DataTable
            data={mockScreens}
            rowKey={(row) => row.id}
            selectable={false}
            onRowClick={(row) => setSelectedScreenId(row.id)}
            columns={[
              {
                key: "name",
                header: "Screen",
                cell: (row) => (
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{row.name}</div>
                    <div className="text-xs text-gray-500">{row.location}</div>
                  </div>
                ),
              },
              { key: "size", header: "Size", cell: (row) => row.size },
              { key: "resolution", header: "Resolution", cell: (row) => <span className="font-mono">{row.resolution}</span> },
              { key: "status", header: "Status", cell: (row) => <Badge variant={row.status === "available" ? "success" : row.status === "offline" ? "error" : "warning"}>{row.status}</Badge> },
            ]}
          />
        </div>

        {selectedScreen ? (
          <div className="mt-5 rounded-2xl border border-primary/20 bg-blue-50 p-5">
            <div className="text-sm font-semibold text-blue-950">{selectedScreen.name}</div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-white p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Resolution</div>
                <div className="mt-2 font-mono text-sm text-gray-900">{selectedScreen.resolution}</div>
              </div>
              <div className="rounded-xl bg-white p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Formats</div>
                <div className="mt-2 text-sm text-gray-900">{selectedScreen.formats ?? "JPG, PNG, MP4, MOV"}</div>
              </div>
              <div className="rounded-xl bg-white p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Max Size</div>
                <div className="mt-2 text-sm text-gray-900">{selectedScreen.max_file_size ?? "100MB"}</div>
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="p-6">
        <div className="text-[18px] font-semibold text-gray-800">Design Standards</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Downloaded", message: "Billboard standards PDF downloaded." })}>
            Billboard Standards PDF
          </Button>
          <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Downloaded", message: "Brand-safe motion guide downloaded." })}>
            Motion Guide PDF
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[18px] font-semibold text-gray-800">Templates</div>
            <div className="mt-1 text-sm text-gray-600">Filtered previews ready for download.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "Telecom", "F&B", "Retail", "Corporate"].map((industry) => (
              <button
                key={industry}
                type="button"
                onClick={() => setActiveIndustry(industry)}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-medium",
                  activeIndustry === industry ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                {industry}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setPreviewId(template.id)}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:bg-gray-50"
            >
              <img src={template.preview} alt={template.title} className="h-40 w-full object-cover" />
              <div className="p-4">
                <div className="text-sm font-semibold text-gray-900">{template.title}</div>
                <div className="mt-2">
                  <Badge variant="info">{template.industry}</Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Modal
        open={Boolean(selectedTemplate)}
        onClose={() => setPreviewId(null)}
        title={selectedTemplate?.title}
        footer={
          <Button onClick={() => showToast({ type: "success", title: "Downloaded", message: "Template download started." })}>
            Download Template
          </Button>
        }
      >
        {selectedTemplate ? <img src={selectedTemplate.preview} alt={selectedTemplate.title} className="w-full rounded-2xl object-cover" /> : null}
      </Modal>
    </div>
  );
}
