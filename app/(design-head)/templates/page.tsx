"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Plus } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type Template = {
  id: string;
  name: string;
  industry: string;
  preview: string;
  active: boolean;
  tags: string[];
};

function readTemplates(): Template[] {
  try {
    const raw = window.localStorage.getItem("afrah_hod_templates");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Template[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTemplates(next: Template[]) {
  window.localStorage.setItem("afrah_hod_templates", JSON.stringify(next));
  window.dispatchEvent(new Event("afrah_hod_templates_updated"));
}

function seedIfMissing() {
  if (readTemplates().length) return;
  const seeded: Template[] = [
    {
      id: "tpl-001",
      name: "Telecom Prime Takeover",
      industry: "Telecom",
      preview: "https://picsum.photos/seed/tpl1/800/450",
      active: true,
      tags: ["High CTR", "Prime Time"],
    },
    {
      id: "tpl-002",
      name: "FMCG Price Drop",
      industry: "FMCG",
      preview: "https://picsum.photos/seed/tpl2/800/450",
      active: true,
      tags: ["Static", "Bold price"],
    },
    {
      id: "tpl-003",
      name: "F&B Lunch Promo",
      industry: "F&B",
      preview: "https://picsum.photos/seed/tpl3/800/450",
      active: false,
      tags: ["Daypart", "Food"],
    },
  ];
  writeTemplates(seeded);
}

const addSchema = z.object({
  name: z.string().min(2, "Name is required."),
  industry: z.string().min(2, "Industry is required."),
});
type AddValues = z.infer<typeof addSchema>;

const industries = ["All", "Telecom", "FMCG", "F&B", "Retail", "Events"] as const;

export default function TemplatesPage() {
  const { showToast } = useToast();

  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [industry, setIndustry] = React.useState<(typeof industries)[number]>("All");
  const [addOpen, setAddOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<Template | null>(null);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { name: "", industry: "Telecom" },
  });

  React.useEffect(() => {
    seedIfMissing();
    setTemplates(readTemplates());
    const onUpdate = () => setTemplates(readTemplates());
    window.addEventListener("afrah_hod_templates_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("afrah_hod_templates_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const filtered = React.useMemo(() => {
    if (industry === "All") return templates;
    return templates.filter((t) => t.industry === industry);
  }, [industry, templates]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Templates</div>
          <div className="mt-1 text-sm text-gray-600">
            Industry filter, preview, and active/inactive toggle.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              showToast({
                type: "success",
                title: "Export ready",
                message: "Templates export prepared successfully.",
              })
            }
          >
            Export
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Template
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-2">
          {industries.map((k) => {
            const active = industry === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setIndustry(k)}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  active ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                {k}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card"
            >
              <div className="relative">
                <img src={t.preview} alt={t.name} className="h-40 w-full object-cover" />
                <div className="absolute left-3 top-3 flex items-center gap-2">
                  <Badge variant="neutral">{t.industry}</Badge>
                  <Badge variant={t.active ? "success" : "warning"} dot>
                    {t.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {t.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setPreview(t)}>
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const next = readTemplates().map((x) =>
                        x.id !== t.id ? x : { ...x, active: !x.active },
                      );
                      writeTemplates(next);
                      showToast({
                        type: "success",
                        title: "Updated",
                        message: `${t.name} is now ${t.active ? "Inactive" : "Active"}.`,
                      });
                    }}
                  >
                    Toggle
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length ? null : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
              No templates found.
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={addOpen}
        onClose={() => {
          if (saving) return;
          setAddOpen(false);
        }}
        title="Add Template"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={form.handleSubmit(async (values) => {
                setSaving(true);
                try {
                  await new Promise((r) => setTimeout(r, 800));
                  const next: Template = {
                    id: `tpl-${String(Date.now()).slice(-6)}`,
                    name: values.name,
                    industry: values.industry,
                    preview: `https://picsum.photos/seed/tpl${Math.floor(Math.random() * 1000)}/800/450`,
                    active: true,
                    tags: ["New"],
                  };
                  writeTemplates([next, ...readTemplates()]);
                  showToast({ type: "success", title: "Added", message: "Template added." });
                  setAddOpen(false);
                  form.reset();
                } finally {
                  setSaving(false);
                }
              })}
            >
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              {...form.register("name")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            />
            {form.formState.errors.name ? (
              <div className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</div>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Industry</label>
            <select
              {...form.register("industry")}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
            >
              {industries.filter((i) => i !== "All").map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            {form.formState.errors.industry ? (
              <div className="mt-1 text-xs text-red-600">{form.formState.errors.industry.message}</div>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Template Preview"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreview(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                showToast({ type: "success", title: "Selected", message: "Template selected (simulation)." });
                setPreview(null);
              }}
            >
              Use Template
            </Button>
          </>
        }
      >
        {preview ? (
          <div>
            <img
              src={preview.preview}
              alt={preview.name}
              className="w-full rounded-xl border border-gray-200 object-cover"
            />
            <div className="mt-3 text-sm font-semibold text-gray-900">{preview.name}</div>
            <div className="mt-1 text-sm text-gray-600">{preview.industry}</div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

