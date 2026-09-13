"use client";

import { useEffect, useRef } from "react";

/** Exactly one large cue line at a time — never a paragraph, never
 * stacked. Optional speech via SpeechSynthesis (spec §7). */
export function CueBanner({ cue, speak = false }: { cue: string | null; speak?: boolean }) {
  const lastSpoken = useRef<string | null>(null);

  useEffect(() => {
    if (!speak || !cue || cue === lastSpoken.current || typeof window === "undefined" || !window.speechSynthesis) return;
    lastSpoken.current = cue;
    const utterance = new SpeechSynthesisUtterance(cue);
    window.speechSynthesis.speak(utterance);
  }, [cue, speak]);

  if (!cue) return null;

  return (
    <div className="absolute inset-x-4 bottom-4 rounded-control bg-surface-base/90 p-4 text-center">
      <p className="metric text-xl text-ink-primary">{cue}</p>
    </div>
  );
}
