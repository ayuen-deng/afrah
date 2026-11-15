"use client";

import * as React from "react";
import Image from "next/image";
import { Download, Plus, Trash2, UploadCloud } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

type AssetType = "Logo" | "Photo" | "Brand Guide" | "Other";

type Asset = {
  id: string;
  type: AssetType;
  name: string;
  url: string;
  size: string;
  createdAt: string;
};

function fileTypeColor(type: AssetType) {
  if (type === "Logo") return "bg-blue-100 text-blue-700";
  if (type === "Photo") return "bg-green-100 text-green-700";
  if (type === "Brand Guide") return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-700";
}

export default function BrandAssetsPage() {
  const { showToast } = useToast();

  const [assets, setAssets] = React.useState<Asset[]>([
    {
      id: "ast-001",
      type: "Logo",
      name: "Afrah Media Logo.png",
      url: "https://picsum.photos/seed/brandlogo/800/450",
      size: "1.2MB",
      createdAt: "04/04/2024",
    },
    {
      id: "ast-002",
      type: "Photo",
      name: "Product Shot 1.jpg",
      url: "https://picsum.photos/seed/brandshot1/800/450",
      size: "3.1MB",
      createdAt: "03/04/2024",
    },
    {
      id: "ast-003",
      type: "Photo",
      name: "Product Shot 2.jpg",
      url: "https://picsum.photos/seed/brandshot2/800/450",
      size: "2.8MB",
      createdAt: "03/04/2024",
    },
    {
      id: "ast-004",
      type: "Brand Guide",
      name: "Brand Guide.pdf",
      url: "https://picsum.photos/seed/brandpdf/800/450",
      size: "5.6MB",
      createdAt: "02/04/2024",
    },
  ]);

  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<Asset | null>(null);
  const [showDeleteInlineConfirm, setShowDeleteInlineConfirm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [newType, setNewType] = React.useState<AssetType>("Logo");
  const [newName, setNewName] = React.useState("");
  const [newFile, setNewFile] = React.useState<File | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">Brand Assets</div>
          <div className="mt-1 text-sm text-gray-600">
            Grid of assets with type labels, upload modal, preview modal, and downloads.
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            onClick={() =>
              showToast({ type: "success", title: "Download started", message: "All assets are ready." })
            }
          >
            <Download className="h-4 w-4" />
            Download All
          </Button>
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" />
            Upload Asset
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {assets.map((asset) => (
          <button key={asset.id} type="button" onClick={() => setPreview(asset)} className="text-left">
            <Card className="overflow-hidden p-0">
              <div className="relative aspect-[16/10] bg-gray-100">
                <Image src={asset.url} alt={asset.name} fill className="object-cover" />
                <div className="absolute left-3 top-3">
                  <Badge variant="neutral" className="bg-white/90">
                    {asset.type}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="truncate text-sm font-semibold text-gray-900">{asset.name}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {asset.size} - {asset.createdAt}
                </div>
                <div className="mt-3 text-sm font-medium text-primary">Preview</div>
              </div>
            </Card>
          </button>
        ))}
      </div>

      <Modal
        open={uploadOpen}
        title="Upload Brand Asset"
        className="max-w-md"
        onClose={() => setUploadOpen(false)}
        footer={
          <div className="flex w-full gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={saving}
              onClick={async () => {
                if (!newFile) {
                  showToast({ type: "error", title: "Missing file", message: "Choose a file to upload." });
                  return;
                }
                if (!newName.trim()) {
                  showToast({ type: "error", title: "Missing name", message: "Asset name is required." });
                  return;
                }
                setSaving(true);
                try {
                  await new Promise((resolve) => setTimeout(resolve, 900));
                  setAssets((prev) => [
                    {
                      id: `ast-${String(prev.length + 1).padStart(3, "0")}`,
                      type: newType,
                      name: newName.trim(),
                      url: "https://picsum.photos/seed/uploaded/800/450",
                      size: `${(newFile.size / 1_000_000).toFixed(1)}MB`,
                      createdAt: "10/04/2026",
                    },
                    ...prev,
                  ]);
                  setUploadOpen(false);
                  setNewName("");
                  setNewFile(null);
                  setNewType("Logo");
                  showToast({ type: "success", title: "Uploaded", message: "Asset added to your library." });
                } finally {
                  setSaving(false);
                }
              }}
            >
              Upload
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {!newFile ? (
            <label className="flex h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center">
              <UploadCloud className="h-8 w-8 text-blue-600" />
              <div className="mt-2 text-sm font-medium text-gray-800">Drop file here</div>
              <div className="text-xs text-blue-600">or click to browse</div>
              <div className="mt-1 text-[11px] text-gray-500">PNG, JPG, PDF, AI - max 10MB</div>
              <input
                type="file"
                className="hidden"
                onChange={(event) => {
                  const picked = event.target.files?.[0] ?? null;
                  setNewFile(picked);
                  if (picked && !newName.trim()) {
                    setNewName(picked.name);
                  }
                }}
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
              <div className={cn("rounded-md px-2 py-1 text-xs font-semibold", fileTypeColor(newType))}>
                {newType}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-900">{newFile.name}</div>
                <div className="text-xs text-gray-500">{(newFile.size / 1_000_000).toFixed(1)}MB</div>
              </div>
              <button
                type="button"
                onClick={() => setNewFile(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
                aria-label="Remove file"
              >
                x
              </button>
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-gray-700">Asset Type</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["Logo", "Photo", "Brand Guide", "Other"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewType(type)}
                  className={
                    newType === type
                      ? "rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                      : "rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
                  }
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 px-3 pt-4 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder=" "
            />
            <label className="pointer-events-none absolute left-3 top-1.5 text-[11px] text-gray-500">
              Asset Name
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(preview)}
        title="Asset Preview"
        className="max-w-sm"
        onClose={() => {
          setPreview(null);
          setShowDeleteInlineConfirm(false);
        }}
        footer={
          preview ? (
            <div className="w-full space-y-3">
              <Button
                className="w-full"
                onClick={() => showToast({ type: "success", title: "Downloaded", message: preview.name })}
              >
                Download
              </Button>
              <div className="relative flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowDeleteInlineConfirm((open) => !open)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                {showDeleteInlineConfirm ? (
                  <div className="absolute top-7 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-md">
                    <div>Are you sure?</div>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setAssets((prev) => prev.filter((item) => item.id !== preview.id));
                          setPreview(null);
                          setShowDeleteInlineConfirm(false);
                          showToast({ type: "success", title: "Deleted", message: "Asset removed." });
                        }}
                      >
                        Yes delete
                      </button>
                      <button
                        type="button"
                        className="text-gray-600 hover:text-gray-700"
                        onClick={() => setShowDeleteInlineConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null
        }
      >
        {preview ? (
          <div className="space-y-3 text-center">
            <div className="relative h-[180px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <Image src={preview.url} alt={preview.name} fill className="object-contain" />
            </div>
            <div className="text-base font-semibold text-gray-900">{preview.name}</div>
            <div className="flex justify-center">
              <Badge variant="neutral">{preview.type}</Badge>
            </div>
            <div className="text-xs text-gray-500">
              {preview.size} - Uploaded {preview.createdAt}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
