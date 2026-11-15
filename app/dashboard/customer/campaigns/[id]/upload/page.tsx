"use client";

import * as React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud } from "lucide-react";

import { mockBookings, mockScreens } from "@/lib/mockData";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BackButton } from "@/components/ui/BackButton";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { QualityReport } from "@/components/customer/QualityReport";

type Mode = "upload" | "brief" | "template";

const briefSchema = z.object({
  goal: z.string().min(5, "Goal is required."),
  audience: z.string().min(5, "Audience is required."),
  message: z.string().min(5, "Key message is required."),
  tone: z.string().min(2, "Tone is required."),
  colors: z.string().min(2, "Add at least one color."),
  avoid: z.string().min(2, "Avoid field is required."),
  notes: z.string().min(2, "Notes are required."),
});

type BriefValues = z.infer<typeof briefSchema>;
type Template = { id: string; industry: string; title: string; preview: string };

export default function CampaignUploadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [mode, setMode] = React.useState<Mode>("upload");
  const [file, setFile] = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [templateOpen, setTemplateOpen] = React.useState(false);
  const [templateIndustry, setTemplateIndustry] = React.useState("All");
  const [activeTemplate, setActiveTemplate] = React.useState<Template | null>(null);

  const campaign =
    mockBookings.find((booking) => booking.id === params.id) ??
    (() => {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(`afrah_booking_${params.id}`)
          : null;
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as { screenId: string; ref: string };
        const screen = mockScreens.find((item) => item.id === parsed.screenId);
        if (!screen) return null;
        return {
          id: parsed.screenId,
          ref: parsed.ref,
          screen: screen.name,
          screen_image: screen.image,
          customer_name: "Sarah Nakato",
          company: "Personal",
          campaign_status: "scheduled",
        };
      } catch {
        return null;
      }
    })();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BriefValues>({
    resolver: zodResolver(briefSchema),
    defaultValues: {
      goal: "",
      audience: "",
      message: "",
      tone: "professional",
      colors: "#2563EB, #FFFFFF",
      avoid: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (!file) return;
    setProgress(0);
    const timer = window.setInterval(() => {
      setProgress((prev) => Math.min(100, prev + 12));
    }, 220);
    return () => window.clearInterval(timer);
  }, [file]);

  const quality = React.useMemo(() => {
    const score = file ? Math.min(92, Math.max(58, 70 + Math.round(file.size / 500000))) : 0;
    return {
      score: file ? score : 0,
      items: [
        { check: "Resolution", status: "good" as const, note: "Matches screen spec" },
        {
          check: "File size",
          status: file && file.size > 90_000_000 ? ("warning" as const) : ("good" as const),
          note: `${file ? (file.size / 1_000_000).toFixed(1) : "0"}MB`,
        },
        { check: "Aspect ratio", status: "good" as const, note: "16:9 safe" },
        {
          check: "Word count",
          status: "warning" as const,
          note: "Keep under 7 words for billboard clarity",
        },
      ],
    };
  }, [file]);

  const templates = React.useMemo<Template[]>(
    () => [
      {
        id: "tpl-001",
        industry: "Telecom",
        title: "New Offer Promo",
        preview: "https://picsum.photos/seed/tpl1/800/450",
      },
      {
        id: "tpl-002",
        industry: "FMCG",
        title: "Product Launch",
        preview: "https://picsum.photos/seed/tpl2/800/450",
      },
      {
        id: "tpl-003",
        industry: "Events",
        title: "Concert Countdown",
        preview: "https://picsum.photos/seed/tpl3/800/450",
      },
      {
        id: "tpl-004",
        industry: "Retail",
        title: "Weekend Sale",
        preview: "https://picsum.photos/seed/tpl4/800/450",
      },
    ],
    [],
  );

  const filteredTemplates = templates.filter(
    (template) => templateIndustry === "All" || template.industry === templateIndustry,
  );

  if (!campaign) {
    return (
      <Card>
        <div className="text-[18px] font-semibold text-gray-800">Campaign not found</div>
        <div className="mt-2 text-sm text-gray-600">
          Go back to My Campaigns and open a campaign first.
        </div>
        <div className="mt-4">
          <Button onClick={() => router.push("/dashboard/customer/campaigns")}>Back to Campaigns</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        backButton={<BackButton />}
        title="Ad Upload"
        subtitle="Upload your ad creative or submit a brief."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              showToast({ type: "success", title: "Saved", message: "Draft saved." });
            }}
          >
            Save Draft
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="info" className="font-mono">
          {campaign.ref}
        </Badge>
        <Badge variant="neutral">{campaign.screen}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "upload", label: "Upload Own File" },
          { key: "brief", label: "Submit a Brief" },
          { key: "template", label: "Use a Template" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key as Mode)}
            className={
              mode === tab.key
                ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                : "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <Card className="p-6">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Drag & Drop</div>
            <div className="mt-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <UploadCloud className="mx-auto h-10 w-10 text-gray-500" />
              <div className="mt-3 text-sm font-medium text-gray-900">Drop a file here, or choose a file</div>
              <div className="mt-1 text-xs text-gray-600">JPG, PNG, MP4, MOV - Max 100MB</div>
              <div className="mt-5">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.mp4,.mov"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="block w-full text-sm"
                />
              </div>
            </div>

            {file ? (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium text-gray-900">{file.name}</div>
                  <div className="text-gray-600">{(file.size / 1_000_000).toFixed(1)}MB</div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-2 bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-xs text-gray-600">
                  {progress < 100 ? "Running quality checks..." : "Quality check complete."}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                loading={submitting}
                disabled={!file || progress < 100}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await new Promise((resolve) => setTimeout(resolve, 1200));
                    showToast({
                      type: "success",
                      title: "Submitted for review",
                      message: "AI content check passed.",
                    });
                    router.push("/dashboard/customer/campaigns");
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                Submit for Review
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="overflow-hidden p-0">
              <div className="relative aspect-[16/10] bg-gray-100">
                <Image src={campaign.screen_image} alt={campaign.screen} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/0 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-sm font-semibold text-white">Screen preview mockup</div>
                  <div className="mt-0.5 text-xs text-slate-200">
                    Your creative appears here after upload.
                  </div>
                </div>
              </div>
            </Card>

            {file && progress >= 100 ? (
              <QualityReport score={quality.score} items={quality.items} />
            ) : (
              <Card className="p-6">
                <div className="text-sm font-medium text-gray-900">Quality report</div>
                <div className="mt-1 text-sm text-gray-600">
                  Upload a file to generate a quality report.
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : mode === "brief" ? (
        <Card className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[18px] font-semibold text-gray-800">Submit a Brief</div>
              <div className="mt-1 text-sm text-gray-600">
                Fill out the structured brief for the design team.
              </div>
            </div>
          </div>

          <form
            className="mt-6 grid gap-4 md:grid-cols-2"
            onSubmit={handleSubmit(async () => {
              setSubmitting(true);
              try {
                await new Promise((resolve) => setTimeout(resolve, 900));
                showToast({
                  type: "success",
                  title: "Brief submitted",
                  message: "Redirecting to campaigns...",
                });
                router.push("/dashboard/customer/campaigns");
              } finally {
                setSubmitting(false);
              }
            })}
          >
            {(
              [
                { key: "goal", label: "Goal" },
                { key: "audience", label: "Audience" },
                { key: "message", label: "Key Message" },
                { key: "tone", label: "Tone" },
                { key: "colors", label: "Brand Colors (comma-separated)" },
                { key: "avoid", label: "Avoid" },
              ] satisfies Array<{ key: keyof BriefValues; label: string }>
            ).map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium text-gray-700">{field.label}</label>
                <input
                  {...register(field.key)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                />
                {errors[field.key]?.message ? (
                  <div className="mt-1 text-xs text-red-600">{errors[field.key]?.message}</div>
                ) : null}
              </div>
            ))}

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                {...register("notes")}
                rows={4}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.notes?.message ? (
                <div className="mt-1 text-xs text-red-600">{errors.notes.message}</div>
              ) : null}
            </div>

            <div className="md:col-span-2 flex items-center justify-end">
              <Button type="submit" loading={submitting}>
                Submit Brief
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[18px] font-semibold text-gray-800">Use a Template</div>
              <div className="mt-1 text-sm text-gray-600">
                Choose a ready-made layout by industry.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", "Telecom", "FMCG", "Events", "Retail"].map((industry) => (
                <button
                  key={industry}
                  type="button"
                  onClick={() => setTemplateIndustry(industry)}
                  className={
                    templateIndustry === industry
                      ? "rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white"
                      : "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  }
                >
                  {industry}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  setActiveTemplate(template);
                  setTemplateOpen(true);
                }}
                className="text-left"
              >
                <Card className="overflow-hidden p-0">
                  <div className="relative aspect-[16/10] bg-gray-100">
                    <Image src={template.preview} alt={template.title} fill className="object-cover" />
                  </div>
                  <div className="p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {template.industry}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">{template.title}</div>
                    <div className="mt-3 text-sm font-medium text-primary">Preview</div>
                  </div>
                </Card>
              </button>
            ))}
          </div>

          <Modal
            open={templateOpen}
            title="Template preview"
            onClose={() => setTemplateOpen(false)}
            footer={
              <>
                <Button variant="secondary" onClick={() => setTemplateOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setTemplateOpen(false);
                    showToast({
                      type: "success",
                      title: "Template selected",
                      message: "Template applied to your campaign.",
                    });
                    router.push(`/dashboard/customer/campaigns/${params.id}`);
                  }}
                >
                  Use Template
                </Button>
              </>
            }
          >
            {activeTemplate ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-700">
                  {activeTemplate.title} ({activeTemplate.industry})
                </div>
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                  <Image src={activeTemplate.preview} alt="Template" fill className="object-cover" />
                </div>
              </div>
            ) : null}
          </Modal>
        </Card>
      )}
    </div>
  );
}
