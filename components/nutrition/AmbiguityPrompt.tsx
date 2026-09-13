"use client";

import { Button } from "@/components/ui/Button";

/** "Is this the whole plate or your share?" — spec §5's multiple-people's-
 * plates edge case. */
export function AmbiguityPrompt({ onChoose }: { onChoose: (multiplier: 1 | 0.5) => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-control border border-hairline bg-surface-sunken p-3">
      <p className="text-sm text-ink-primary">Is this the whole plate or your share?</p>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => onChoose(1)}>
          Whole plate
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => onChoose(0.5)}>
          My share (½)
        </Button>
      </div>
    </div>
  );
}
