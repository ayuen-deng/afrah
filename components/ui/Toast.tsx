"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "@/lib/cn";

type ToastType = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextValue = {
  showToast: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...toast, id }]);

      if (toast.type !== "error") {
        window.setTimeout(() => remove(id), 3000);
      }
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] w-full max-w-sm space-y-3">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={cn(
                "relative overflow-hidden rounded-xl border bg-white p-4 shadow-lg",
                t.type === "success" && "border-l-4 border-l-green-500",
                t.type === "error" && "border-l-4 border-l-red-500",
                t.type === "info" && "border-l-4 border-l-blue-500",
              )}
            >
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="absolute right-3 top-3 rounded-md p-1 text-gray-500 hover:bg-gray-50"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-3 pr-6">
                <div className="mt-0.5">
                  {t.type === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : t.type === "error" ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">
                    {t.title}
                  </div>
                  {t.message ? (
                    <div className="mt-0.5 text-sm text-gray-600">
                      {t.message}
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

