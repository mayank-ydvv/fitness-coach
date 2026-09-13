"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { HabitWithLogs } from "./useHabits";

/** Optimistic toggle — the fill animation (motion moment #3) has to feel
 * instant, the network write happens underneath it. */
export function useToggleHabit(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, logDate, done }: { habitId: string; logDate: string; done: boolean }) => {
      const res = await fetch("/api/habits/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, logDate, status: done ? "done" : "skipped" }),
      });
      if (!res.ok) throw new Error("Couldn't save that.");
      return res.json();
    },
    onMutate: async ({ habitId, logDate, done }) => {
      const key = ["habits", userId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<HabitWithLogs[]>(key);
      queryClient.setQueryData<HabitWithLogs[]>(key, (prev) =>
        (prev ?? []).map((h) => {
          if (h.id !== habitId) return h;
          const withoutToday = h.logs.filter((l) => l.log_date !== logDate);
          return {
            ...h,
            logs: [
              ...withoutToday,
              {
                id: crypto.randomUUID(),
                habit_id: habitId,
                user_id: userId ?? "",
                log_date: logDate,
                status: done ? "done" : "skipped",
                source: "user",
                updated_at: new Date().toISOString(),
              },
            ],
          };
        }),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["habits", userId], context.previous);
    },
  });
}
