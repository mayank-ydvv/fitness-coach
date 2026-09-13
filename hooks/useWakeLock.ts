"use client";

import { useEffect, useRef } from "react";

/** navigator.wakeLock.request('screen') while active, released on
 * unmount/deactivate, re-requested on visibilitychange (the lock
 * auto-releases when the tab is hidden). See the plan's rest-timer
 * section: this is the one thing that's actually achievable for keeping
 * the zero-cue reachable — there is no scheduled-notification path on the
 * web for a hidden tab. */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let cancelled = false;
    async function acquire() {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (!cancelled) lockRef.current = lock;
        else lock.release();
      } catch {
        // Denied or unsupported — the copy ("Keep this screen on") is the
        // fallback, not a hard requirement.
      }
    }
    function onVisibility() {
      if (document.visibilityState === "visible" && active) acquire();
    }

    acquire();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      lockRef.current?.release();
      lockRef.current = null;
    };
  }, [active]);
}
