"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type LastPerformance = { loadKg: number; reps: number; rpe: number | null };

/**
 * One prefetched query for every exercise in the session, never a
 * per-set fetch — "Last: 60 kg x 9 @ RPE 8" has to render the instant the
 * set becomes active, not after a network round trip.
 */
export function useLastPerformance(exerciseIds: string[]) {
  return useQuery({
    queryKey: ["last-performance", ...exerciseIds.slice().sort()],
    queryFn: async () => {
      const supabase = createClient();
      if (!supabase || exerciseIds.length === 0) return {} as Record<string, LastPerformance>;

      // See the comment in useHabits.ts — this fires on mount, the same
      // race window where the browser client's session cookie can still be
      // parsing when the request goes out.
      await supabase.auth.getSession();

      const { data } = await supabase
        .from("set_logs")
        .select("exercise_id, load_kg, reps, rpe, completed_at")
        .in("exercise_id", exerciseIds)
        .eq("is_warmup", false)
        .order("completed_at", { ascending: false });

      const map: Record<string, LastPerformance> = {};
      for (const row of data ?? []) {
        if (!map[row.exercise_id]) {
          map[row.exercise_id] = { loadKg: row.load_kg, reps: row.reps, rpe: row.rpe };
        }
      }
      return map;
    },
    enabled: exerciseIds.length > 0,
    staleTime: 60_000,
  });
}
