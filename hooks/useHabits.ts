"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type HabitWithLogs = Tables<"habits"> & { logs: Tables<"habit_logs">[] };

/** Fetches every active habit plus its logs for the last 84 days (12 weeks
 * — exactly what the contribution grid needs), in one query per resource. */
export function useHabits(userId: string | undefined) {
  return useQuery({
    queryKey: ["habits", userId],
    queryFn: async () => {
      const supabase = createClient();
      if (!supabase || !userId) return [] as HabitWithLogs[];

      const { data: habits } = await supabase.from("habits").select("*").eq("user_id", userId).is("archived_at", null).order("sort_index");
      const habitIds = (habits ?? []).map((h) => h.id);
      if (habitIds.length === 0) return [];

      const since = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data: logs } = await supabase.from("habit_logs").select("*").in("habit_id", habitIds).gte("log_date", since);

      return (habits ?? []).map((h) => ({ ...h, logs: (logs ?? []).filter((l) => l.habit_id === h.id) }));
    },
    enabled: !!userId,
  });
}
