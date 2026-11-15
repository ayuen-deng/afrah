"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";

export type ModalProps = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  className?: string;
};

export function Modal({ open, title, children, footer, onClose, className }: ModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "relative z-10 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl",
              className,
            )}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="text-base font-semibold text-gray-900">
                {title}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5">{children}</div>

            {footer ? (
              <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

