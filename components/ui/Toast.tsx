"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { EASE, DURATION } from "@/lib/motion/tokens";

type Toast = { id: string; message: string; tone: "default" | "danger" };
type ToastContextValue = { push: (message: string, tone?: Toast["tone"]) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const reduceMotion = useReducedMotion();

  const push = useCallback((message: string, tone: Toast["tone"] = "default") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-50 flex flex-col items-center gap-2 px-5 sm:bottom-6"
        aria-live="polite"
      >
        {/* AnimatePresence (not the data-state CSS approach Sheet uses)
            because these mount/unmount from plain React state, not a
            Radix Presence-aware primitive — Motion is what actually
            delays the unmount until the exit animation finishes here. */}
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              role="status"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.transition, ease: EASE.spring }}
              className={cn(
                "pointer-events-auto w-full max-w-sm rounded-control border px-4 py-3 text-sm shadow-floating",
                t.tone === "danger"
                  ? "border-action-danger bg-surface-raised text-ink-primary"
                  : "border-hairline bg-surface-raised text-ink-primary",
              )}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
