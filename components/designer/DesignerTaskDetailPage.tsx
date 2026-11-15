"use client";

import * as React from "react";
import { Download, ExternalLink, Eye, MessageSquare, Paperclip, Send } from "lucide-react";

import {
  addDesignerMessage,
  designerTaskEventName,
  getDesignerScreen,
  getDesignerTask,
  getTaskBooking,
  seedDesignerTasksIfMissing,
  submitDesignerRevision,
  updateDesignerTaskStatus,
  type DesignerTask,
} from "@/components/designer/store";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

function qualityRows() {
  return [
    { label: "Resolution", value: "1920x1080", tone: "success" },
    { label: "File size", value: "44MB", tone: "success" },
    { label: "Aspect ratio", value: "16:9", tone: "success" },
    { label: "Duration", value: "32 seconds - slightly over 30s limit", tone: "warning" },
  ] as const;
}

export function DesignerTaskDetailPage({ taskId }: { taskId: string }) {
  const { showToast } = useToast();

  const [task, setTask] = React.useState<DesignerTask | null>(null);
  const [activeTab, setActiveTab] = React.useState<"status" | "files" | "messages">("status");
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [confirmDoneOpen, setConfirmDoneOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [qualityVisible, setQualityVisible] = React.useState(false);
  const [uploadNotes, setUploadNotes] = React.useState("Added tagline in final 5 seconds as requested");
  const [message, setMessage] = React.useState("");
  const rightPanelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    seedDesignerTasksIfMissing();
    const refresh = () => setTask(getDesignerTask(taskId));
    refresh();
    window.addEventListener(designerTaskEventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(designerTaskEventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [taskId]);

  if (!task) {
    return (
      <Card className="p-8">
        <div className="text-sm text-gray-600">Task not found.</div>
      </Card>
    );
  }

  const screen = getDesignerScreen(task.screen);
  const booking = getTaskBooking(task);
  const brandAssets = task.brand_assets ?? [];
  const productPhotos = [
    ...brandAssets.filter((asset) => asset.type === "Photo"),
    { type: "Photo", name: "Product Shot 2.jpg", url: "https://picsum.photos/seed/brand3/400/300" },
  ];
  const currentPreview = productPhotos[lightboxIndex] ?? productPhotos[0];

  async function simulateUpload() {
    setUploading(true);
    setUploadProgress(0);
    setQualityVisible(false);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setUploadProgress(25);
    await new Promise((resolve) => setTimeout(resolve, 220));
    setUploadProgress(55);
    await new Promise((resolve) => setTimeout(resolve, 220));
    setUploadProgress(100);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setQualityVisible(true);
    setUploading(false);
    showToast({ type: "info", title: "Quality check", message: "Quality report is ready." });
  }

  function handleCopy(hex: string) {
    navigator.clipboard.writeText(hex).catch(() => null);
    showToast({ type: "success", title: "Copied", message: `Copied ${hex} to clipboard.` });
  }

  function handleSendMessage() {
    if (!task) return;
    const trimmed = message.trim();
    if (!trimmed) return;
    addDesignerMessage(task.id, trimmed);
    setMessage("");
    showToast({ type: "success", title: "Message sent", message: "Your update is now visible in the thread." });
  }

  function handleSubmitForReview() {
    if (!task) return;
    submitDesignerRevision(task.id, uploadNotes || "Submitted v2 for internal review.");
    setActiveTab("status");
    setQualityVisible(false);
    setUploadProgress(0);
    showToast({ type: "success", title: "Submitted", message: "File submitted for internal review." });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <BackButton />
            <div className="text-[24px] font-semibold text-gray-900">{task.campaign}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="info">{task.company}</Badge>
              <Badge variant="neutral">{task.screen}</Badge>
              <Badge variant="neutral">{booking ? `${booking.start} - ${booking.end}` : "10/04/2024 - 24/04/2024"}</Badge>
              <Badge variant="warning">Deadline {task.deadline}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.open("https://pearldairy.co.ug", "_blank", "noopener,noreferrer")}>
              Reference Site
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Creative Brief</div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Goal</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{task.brief?.goal}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Audience</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{task.brief?.audience}</div>
              </div>
              <div className="md:col-span-2 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-blue-700">Key Message</div>
                <div className="mt-2 text-sm font-semibold text-blue-950">{task.brief?.message}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Tone</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{task.brief?.tone}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Avoid</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{task.brief?.avoid}</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Brand Colors</div>
              <div className="mt-3 flex flex-wrap gap-3">
                {(task.brief?.colors ?? []).map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => handleCopy(hex)}
                    className="rounded-2xl border border-gray-200 p-3 text-left"
                  >
                    <div className="h-12 w-20 rounded-xl border border-white/70" style={{ backgroundColor: hex }} />
                    <div className="mt-2 font-mono text-xs text-gray-700">{hex}</div>
                  </button>
                ))}
              </div>
              <a
                href="https://pearldairy.co.ug"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary"
              >
                pearldairy.co.ug
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[18px] font-semibold text-gray-800">Head of Design Instructions</div>
                <div className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950">
                  {task.instructions}
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setActiveTab("messages");
                  rightPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <MessageSquare className="h-4 w-4" />
                Send Message
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[18px] font-semibold text-gray-800">Brand Assets</div>
              <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Downloaded", message: "All brand assets downloaded." })}>
                Download All
              </Button>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={brandAssets[0]?.url} alt={brandAssets[0]?.name} className="h-14 w-14 rounded-xl object-cover" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{brandAssets[0]?.name}</div>
                    <div className="mt-1 text-xs text-gray-500">Logo asset</div>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Downloaded", message: "Logo download started." })}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {productPhotos.map((asset, index) => (
                <button
                  key={`${asset.name}-${index}`}
                  type="button"
                  onClick={() => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                  className="overflow-hidden rounded-2xl border border-gray-200 text-left"
                >
                  <img src={asset.url} alt={asset.name} className="h-44 w-full object-cover" />
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{asset.name}</div>
                      <div className="mt-1 text-xs text-gray-500">Product photo</div>
                    </div>
                    <Eye className="h-4 w-4 text-gray-500" />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Downloaded", message: "All photos downloaded." })}>
                Download All Photos
              </Button>
              <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Downloaded", message: "Brand guide downloaded." })}>
                Brand Guide PDF
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Screen Specs</div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ["Resolution", screen.resolution],
                ["Formats", screen.formats ?? "JPG, PNG, MP4, MOV"],
                ["Max File Size", screen.max_file_size ?? "100MB"],
                ["Duration", "30 seconds"],
                ["Aspect Ratio", "16:9"],
                ["Screen Size", screen.size],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-gray-200 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
                  <div className="mt-2 font-mono text-sm text-gray-900">{value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div ref={rightPanelRef} className="space-y-6">
          {task.status === "revision_requested" ? (
            <Card className="border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-amber-900">Revision requested</div>
                <Badge variant="warning">Revision #{task.revision_count ?? 1}</Badge>
              </div>
              <div className="mt-3 rounded-2xl border border-amber-200 bg-white/70 p-4 text-sm text-amber-950">
                {task.client_notes}
              </div>
            </Card>
          ) : null}

          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              {(["status", "files", "messages"] as const).map((tab) => {
                const selected = activeTab === tab;
                const label = tab === "status" ? "Status" : tab === "files" ? "Files" : "Messages";
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={[
                      "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      selected ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {activeTab === "status" ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-slate-50 p-5">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Current Status</div>
                  <div className="mt-3">
                    <Badge variant={task.status === "done" ? "success" : task.status === "revision_requested" ? "warning" : "info"} dot>
                      {task.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Status selector</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["to_do", "in_progress", "done"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          if (status === "done") {
                            setConfirmDoneOpen(true);
                            return;
                          }
                          updateDesignerTaskStatus(task.id, status);
                          showToast({ type: "success", title: "Status updated", message: `Task moved to ${status.replaceAll("_", " ")}.` });
                        }}
                        className={[
                          "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                          task.status === status ? "bg-primary text-white" : "bg-slate-100 text-gray-700 hover:bg-slate-200",
                        ].join(" ")}
                      >
                        {status.replaceAll("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "files" ? (
              <div className="mt-6 space-y-5">
                <div className="space-y-3">
                  {(task.files ?? []).map((file) => (
                    <div key={`${file.name}-${file.version}`} className="rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{file.name}</div>
                          <div className="mt-1 text-xs text-gray-500">
                            {file.size} | {file.date} | v{file.version}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                          <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Downloaded", message: "File download started." })}>
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-dashed border-gray-300 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <Paperclip className="h-4 w-4" />
                    Upload revision
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Select a file to simulate upload, quality check, and submission.
                  </div>
                  <input
                    type="file"
                    className="mt-4 block w-full text-sm text-gray-700"
                    onChange={(event) => {
                      if (!event.target.files?.length) return;
                      void simulateUpload();
                    }}
                  />

                  {uploadProgress > 0 ? (
                    <div className="mt-4">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <div className="mt-2 text-xs text-gray-500">{uploading ? "Running quality check..." : `${uploadProgress}% uploaded`}</div>
                    </div>
                  ) : null}

                  {qualityVisible ? (
                    <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="text-sm font-semibold text-gray-900">Quality Report</div>
                      <div className="mt-4 space-y-3">
                        {qualityRows().map((row) => (
                          <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-gray-700">{row.label}</span>
                            <span className={row.tone === "warning" ? "text-amber-600" : "text-green-600"}>{row.value}</span>
                          </div>
                        ))}
                      </div>

                      <textarea
                        value={uploadNotes}
                        onChange={(event) => setUploadNotes(event.target.value)}
                        className="mt-4 min-h-28 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <div className="mt-4">
                        <Button onClick={handleSubmitForReview}>Submit for Review</Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeTab === "messages" ? (
              <div className="mt-6 space-y-4">
                <div className="space-y-3">
                  {(task.messages ?? []).map((item, index) => (
                    <div key={`${item.time}-${index}`} className={`flex ${item.side === "right" ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[90%] rounded-2xl border border-gray-200 bg-white p-4">
                        <div className="text-xs text-gray-500">{item.sender}</div>
                        <div className="mt-1 text-sm text-gray-800">{item.text}</div>
                        <div className="mt-2 text-xs font-mono text-gray-500">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleSendMessage();
                    }}
                    placeholder="Write an update for Head of Design..."
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Version Preview">
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <img src={task.files?.[task.files.length - 1]?.preview} alt="Version preview" className="h-auto w-full object-cover" />
        </div>
      </Modal>

      <Modal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={currentPreview?.name ?? "Brand Asset"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setLightboxIndex((prev) => (prev === 0 ? productPhotos.length - 1 : prev - 1))}>
              Previous
            </Button>
            <Button variant="secondary" onClick={() => setLightboxIndex((prev) => (prev + 1) % productPhotos.length)}>
              Next
            </Button>
            <Button onClick={() => showToast({ type: "success", title: "Downloaded", message: `${currentPreview?.name} downloaded.` })}>
              Download
            </Button>
          </>
        }
      >
        <img src={currentPreview?.url} alt={currentPreview?.name} className="h-auto w-full rounded-2xl object-cover" />
      </Modal>

      <Modal
        open={confirmDoneOpen}
        onClose={() => setConfirmDoneOpen(false)}
        title="Mark as complete?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDoneOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                updateDesignerTaskStatus(task.id, "done");
                setConfirmDoneOpen(false);
                showToast({ type: "success", title: "Status updated", message: "Task marked as complete and ready for review." });
              }}
            >
              Mark Complete
            </Button>
          </>
        }
      >
        <div className="text-sm text-gray-600">
          Marking this task complete will submit your file for review. You can still upload a newer version afterwards.
        </div>
      </Modal>
    </div>
  );
}
