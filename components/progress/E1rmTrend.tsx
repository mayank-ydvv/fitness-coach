"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { LineChart } from "./LineChart";
import { e1rmTrend } from "@/lib/progress/series";
import { useMeasure } from "@/components/prefs/PreferencesProvider";
import type { Tables } from "@/lib/supabase/database.types";

type SetLogRow = Pick<Tables<"set_logs">, "completed_at" | "e1rm" | "e1rm_trusted" | "is_warmup" | "exercise_id">;
type ExerciseOption = { id: string; name: string };

/** Per-exercise selector + line — the one genuinely client-interactive
 * progress chart (the others are static per-render). */
export function E1rmTrend({ setLogs, exercises }: { setLogs: SetLogRow[]; exercises: ExerciseOption[] }) {
  const measure = useMeasure();
  const [selected, setSelected] = useState(exercises[0]?.id ?? "");

  const points = e1rmTrend(setLogs.filter((l) => l.exercise_id === selected));

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-ink-primary">Estimated 1RM</p>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-control border border-hairline bg-surface-sunken px-2 py-1 text-sm text-ink-primary"
        >
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>
      <LineChart points={points.map((p) => ({ x: p.date, y: p.e1rm }))} formatValue={(v) => measure.mass(v) ?? ""} tone="#4A9E5C" />
    </Card>
  );
}
