"use client";

import { useState } from "react";

/** The ONLY path by which video leaves the device — explicit, off by
 * default (spec §7/§12: "Camera video is never uploaded" unless the user
 * explicitly opts in here). */
export function SaveClipPrompt({ onSave }: { onSave: () => void }) {
  const [saved, setSaved] = useState(false);

  if (saved) return <p className="text-sm text-ink-muted">Clip saved.</p>;

  return (
    <button
      type="button"
      onClick={() => {
        onSave();
        setSaved(true);
      }}
      className="text-sm text-ink-muted underline underline-offset-2"
    >
      Save a clip of this set (stays on your device unless you choose to save it — off by default)
    </button>
  );
}
