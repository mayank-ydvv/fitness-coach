"use client";

import { useState } from "react";
import { ChartShell } from "@/components/ui/ChartShell";
import { LineChart } from "./LineChart";
import { e1rmTrend } from "@/lib/progress/series";
import { useMeasure } from "@/components/prefs/PreferencesProvider";
import type { Tables } from "@/lib/supabase/database.types";

type SetLogRow = Pick<Tables<"set_logs">, "completed_at" | "e1rm" | "e1rm_trusted" | "is_warmup" | "exercise_id">;
type ExerciseOption = { id: string; name: string };

/** Per-exercise selector + line — the one genuinely client-interactive
 * progress chart (the others are static per-render). Doubles as the
 * "personal bests over time" the brief asks for under Progress. */
export function E1rmTrend({ setLogs, exercises }: { setLogs: SetLogRow[]; exercises: ExerciseOption[] }) {
  const measure = useMeasure();
  const [selected, setSelected] = useState(exercises[0]?.id ?? "");
  const selectedName = exercises.find((e) => e.id === selected)?.name ?? "";

  const points = e1rmTrend(setLogs.filter((l) => l.exercise_id === selected));
  const summary =
    points.length >= 2
      ? `Estimated 1-rep max for ${selectedName} from ${measure.mass(points[0].e1rm)} to ${measure.mass(points[points.length - 1].e1rm)}`
      : `Not enough logged sets yet for ${selectedName || "this exercise"}'s trend`;

  return (
    <ChartShell
      title="Estimated 1RM"
      summary={summary}
      rangeControl={
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
      }
    >
      <LineChart points={points.map((p) => ({ x: p.date, y: p.e1rm }))} formatValue={(v) => measure.mass(v) ?? ""} tone="#4A9E5C" />
    </ChartShell>
  );
}
