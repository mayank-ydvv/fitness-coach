"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { insightMessage, type Insight } from "@/lib/progress/insights";

/**
 * Exactly one insight, rotating — spec §9's Today priority order item 5.
 * Dismissible (brief §8) — persisted per day in localStorage, not just
 * component state, so it stays dismissed across a reload/re-visit today
 * but reappears (if still relevant) tomorrow. No dismiss history is
 * kept beyond that; this is deliberately lightweight, matching "one AI
 * note per day," not a notification inbox.
 */
export function InsightCard({ insight, todayLocalDate }: { insight: Insight | null; todayLocalDate: string }) {
  const storageKey = `insight-dismissed-${todayLocalDate}`;
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  if (!insight || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // Private browsing / storage disabled — dismissal just won't
      // persist across a reload today, which is a fine degradation.
    }
  }

  return (
    <Card className="flex items-start justify-between gap-3">
      <p className="text-sm text-ink-primary">{insightMessage(insight)}</p>
      {/* size-11 (44px) real tap target, pulled back in with negative
          margin so it doesn't visually enlarge the card's padding —
          size-8 (32px) was under the 44px floor. */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="-m-2.5 flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-ink-primary"
      >
        <X size={16} aria-hidden />
      </button>
    </Card>
  );
}
