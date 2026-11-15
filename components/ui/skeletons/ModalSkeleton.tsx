import * as React from "react";

import { SkeletonBlock } from "@/components/ui/skeletons/SkeletonBlock";

export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-40 rounded-full" />
            <SkeletonBlock className="h-3 w-56 rounded-full" />
          </div>
          <SkeletonBlock className="h-8 w-8 rounded-full" />
        </div>

        <div className="mt-6 space-y-4">
          <SkeletonBlock className="h-12 w-full rounded-xl" />
          <SkeletonBlock className="h-28 w-full rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonBlock className="h-12 w-full rounded-xl" />
            <SkeletonBlock className="h-12 w-full rounded-xl" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <SkeletonBlock className="h-10 w-24 rounded-xl" />
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
