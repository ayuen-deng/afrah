import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/cn";

export function AuthSplitLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-sidebar lg:block">
          <div className="absolute inset-0 opacity-30">
            <Image
              src="https://picsum.photos/seed/kampala/1600/1600"
              alt="Kampala city"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="relative flex h-full flex-col justify-between p-10">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <span className="text-lg font-bold">A</span>
              </div>
              <div className="text-[18px] font-bold text-white">Afrah Media</div>
            </div>

            <div className="max-w-md">
              <div className="text-3xl font-semibold leading-tight text-white">
                Uganda’s Digital Billboard Network
              </div>
              <div className="mt-3 text-sm text-slate-300">
                Book screens, run campaigns, manage approvals, and track
                performance — all in one modern ERP.
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { label: "Screens", value: "12" },
                  { label: "Campaigns", value: "27" },
                  { label: "Uptime", value: "96%" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={cn(
                      "rounded-xl border border-slate-700/60 bg-slate-900/30 p-4",
                    )}
                  >
                    <div className="text-2xl font-bold text-white">{s.value}</div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()} Afrah Media. All rights reserved.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
              <div className="text-[18px] font-semibold text-gray-800">
                {title}
              </div>
              <div className="mt-6">{children}</div>
            </div>
            <div className="mt-4 text-center text-xs text-gray-500 lg:hidden">
              Afrah Media — Uganda’s Digital Billboard Network
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
