"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWakeLock } from "./useWakeLock";

const STORAGE_KEY = "fitness-coach-rest-ends-at";

/**
 * Timestamp-based, never a decrementing counter — computed from Date.now()
 * every tick, source of truth in localStorage so it survives a backgrounded
 * or reloaded tab (iOS reloads backgrounded tabs aggressively). See the
 * plan: there is no way for a hidden tab to fire a scheduled notification,
 * so the honest mechanism is visibility-triggered recomputation, a wake
 * lock while active, and a zero-cue that degrades through vibrate -> beep
 * -> visual flash.
 */
export function useRestTimer(totalSeconds: number) {
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useWakeLock(restEndsAt !== null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const endsAt = Number(stored);
      if (Number.isFinite(endsAt) && endsAt > Date.now() - 5 * 60_000) {
        setRestEndsAt(endsAt);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    function tick() {
      setNow(Date.now());
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") setNow(Date.now());
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const start = useCallback(() => {
    const endsAt = Date.now() + totalSeconds * 1000;
    firedRef.current = false;
    setRestEndsAt(endsAt);
    localStorage.setItem(STORAGE_KEY, String(endsAt));
  }, [totalSeconds]);

  const skip = useCallback(() => {
    setRestEndsAt(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const remainingMs = restEndsAt !== null ? restEndsAt - now : 0;
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const overdueSeconds = remainingMs < 0 ? Math.round(-remainingMs / 1000) : 0;
  const fraction = restEndsAt !== null ? Math.max(0, remainingMs / (totalSeconds * 1000)) : 0;

  useEffect(() => {
    if (restEndsAt !== null && remainingMs <= 0 && !firedRef.current) {
      firedRef.current = true;
      fireZeroCue();
    }
  }, [restEndsAt, remainingMs]);

  return { active: restEndsAt !== null, remainingSeconds, overdueSeconds, fraction, start, skip };
}

/** Feature-detected in this order: vibrate does not exist on iOS Safari at
 * all (not throttled — absent), so a beep and a visual flash both need to
 * exist as real fallbacks, not decoration. */
function fireZeroCue() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.([200, 100, 200]);
  }
  try {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextCtor) {
      const ctx = new AudioContextCtor();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Visual flash (driven by the `active`/`remainingSeconds === 0` state in
    // RestRing/RestTimer) is the last-resort cue and always renders regardless.
  }
}
