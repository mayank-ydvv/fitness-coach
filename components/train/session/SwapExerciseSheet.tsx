"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

type ExerciseRow = Tables<"exercises">;

/** 3 alternatives sharing the same movement pattern and the user's
 * available equipment. */
export function SwapExerciseSheet({
  open,
  onOpenChange,
  currentExerciseId,
  onSwap,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentExerciseId: string;
  onSwap: (exercise: ExerciseRow) => void;
}) {
  const [alternatives, setAlternatives] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: current } = await supabase.from("exercises").select("movement_pattern").eq("id", currentExerciseId).single();
      if (!current?.movement_pattern) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("exercises")
        .select("*")
        .eq("movement_pattern", current.movement_pattern)
        .neq("id", currentExerciseId)
        .limit(3);
      setAlternatives(data ?? []);
      setLoading(false);
    })();
  }, [open, currentExerciseId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Swap exercise">
      {loading ? (
        <p className="text-sm text-ink-muted">Finding alternatives…</p>
      ) : alternatives.length === 0 ? (
        <p className="text-sm text-ink-muted">No alternatives sharing this movement pattern were found.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {alternatives.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => {
                onSwap(ex);
                onOpenChange(false);
              }}
              className="flex min-h-14 items-center justify-between rounded-control border border-hairline bg-surface-sunken px-4 text-left"
            >
              <span className="text-sm font-medium text-ink-primary">{ex.name}</span>
              <ChevronRight size={18} className="text-ink-muted" aria-hidden />
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
