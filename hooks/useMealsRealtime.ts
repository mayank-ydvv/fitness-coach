"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { qk } from "@/lib/queries/keys";
import type { Tables } from "@/lib/supabase/database.types";

type MealRow = Tables<"meals">;
type MealWithItems = MealRow & { meal_items: Tables<"meal_items">[] };

const POLL_DELAYS_MS = [3000, 6000, 12000, 24000];

/**
 * Postgres Changes on `meals` (RLS-scoped, filtered to this user) as the
 * primary signal, PLUS a bounded fallback poll that ships unconditionally —
 * per the M0/M2 decision, every realtime failure mode here (publication not
 * enabled, channel subscribed before realtime.setAuth() had a JWT, socket
 * dropped on a backgrounded tab) is silent, and the failure is a card stuck
 * in skeleton forever on the app's headline feature.
 */
export function useMealsRealtime(date: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const pollTimers = useRef<Map<string, ReturnType<typeof setTimeout>[]>>(new Map());

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`meals-${userId}-${date}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "meals", filter: `user_id=eq.${userId}` },
        async (payload) => {
          const updated = payload.new as MealRow;
          clearPollTimers(pollTimers.current, updated.id);

          // One meals UPDATE -> one targeted refetch of that meal's items,
          // never a subscription on meal_items itself (a ready meal is
          // 1-8 item INSERTs arriving out of order relative to the status
          // flip — see the plan's M2 section).
          const { data: items } = await supabase.from("meal_items").select("*").eq("meal_id", updated.id);

          queryClient.setQueryData<MealWithItems[]>(qk.meals(date), (prev) =>
            (prev ?? []).map((m) => (m.id === updated.id ? { ...m, ...updated, meal_items: items ?? [] } : m)),
          );
          queryClient.invalidateQueries({ queryKey: qk.rollup(date) });
        },
      )
      .subscribe();

    const timersMap = pollTimers.current;
    return () => {
      supabase.removeChannel(channel);
      for (const timers of timersMap.values()) timers.forEach(clearTimeout);
      timersMap.clear();
    };
  }, [date, userId, queryClient]);

  /** Called by useLogMeal right after a meal is created — arms the bounded
   * poll fallback for that specific meal. Cancelled the instant realtime
   * delivers (see the UPDATE handler above). */
  function armFallbackPoll(mealId: string) {
    const timers = POLL_DELAYS_MS.map((delay) =>
      setTimeout(async () => {
        const supabase = createClient();
        if (!supabase) return;
        const { data: meal } = await supabase.from("meals").select("*, meal_items(*)").eq("id", mealId).maybeSingle();
        if (meal && meal.status !== "processing") {
          clearPollTimers(pollTimers.current, mealId);
          queryClient.setQueryData<MealWithItems[]>(qk.meals(date), (prev) =>
            (prev ?? []).map((m) => (m.id === mealId ? (meal as MealWithItems) : m)),
          );
          queryClient.invalidateQueries({ queryKey: qk.rollup(date) });
        }
      }, delay),
    );
    pollTimers.current.set(mealId, timers);
  }

  return { armFallbackPoll };
}

function clearPollTimers(map: Map<string, ReturnType<typeof setTimeout>[]>, mealId: string) {
  const timers = map.get(mealId);
  if (timers) {
    timers.forEach(clearTimeout);
    map.delete(mealId);
  }
}
