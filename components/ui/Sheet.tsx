"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Bottom sheet on mobile, centered dialog on desktop. Wraps Radix Dialog
 * for the focus trap / scroll lock / aria wiring — the visual shell is
 * ours, restyled to the design tokens (see M0 decision: no shadcn/ui).
 *
 * Motion: Radix's internal Presence component watches for a CSS
 * animation/transition on Content before unmounting it, so the
 * data-state-driven `animate-*` utilities below (see app/globals.css)
 * are enough on their own — no AnimatePresence needed. Mobile slides
 * fully off-screen; desktop scales from center. Both transform+opacity
 * only, per the motion craft rules.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-ink-primary/40",
            "data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out",
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-sheet border-t border-hairline bg-surface-raised p-5 shadow-floating",
            "data-[state=open]:animate-sheet-mobile-in data-[state=closed]:animate-sheet-mobile-out",
            "sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-sheet sm:border",
            "sm:data-[state=open]:animate-sheet-desktop-in sm:data-[state=closed]:animate-sheet-desktop-out",
            className,
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-medium text-ink-primary">{title}</Dialog.Title>
            <Dialog.Close className="flex size-11 items-center justify-center rounded-control text-ink-muted hover:text-ink-primary" aria-label="Close">
              <X size={20} aria-hidden />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
