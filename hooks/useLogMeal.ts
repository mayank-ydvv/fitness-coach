"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { prepareMealPhoto } from "@/lib/image/prepare";
import { qk } from "@/lib/queries/keys";
import type { Tables } from "@/lib/supabase/database.types";
import { useMealsRealtime } from "./useMealsRealtime";

type MealWithItems = Tables<"meals"> & { meal_items: Tables<"meal_items">[]; _previewUrl?: string };

/**
 * The meal-photo logging mutation. This app is online-only by design (no
 * offline queue) — a network failure just leaves the row `failed` with a
 * Retry affordance, same as any other analyze failure. Client generates
 * the meal UUID so the optimistic row and the later Realtime/poll patch
 * share identity (no duplicate-card flash). onError marks the row failed
 * rather than rolling back: the user's photo is irreproducible, discarding
 * it is worse than a stuck-looking card. Never invalidateQueries on
 * settle — that would clobber the local preview URL before Realtime/poll
 * can hand back a real one.
 */
export function useLogMeal(date: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const { armFallbackPoll } = useMealsRealtime(date, userId);

  const mutation = useMutation({
    mutationFn: async ({ blob: rawBlob, note }: { blob: Blob; note?: string }) => {
      if (!userId) throw new Error("Not signed in.");
      if (!navigator.onLine) throw new Error("You're offline — reconnect and try again.");
      const prepared = await prepareMealPhoto(rawBlob);
      const mealId = crypto.randomUUID();
      await createAndAnalyze({ userId, mealId, blob: prepared.blob, contentType: prepared.contentType, note });
      return { mealId };
    },
    onMutate: async ({ blob }) => {
      await queryClient.cancelQueries({ queryKey: qk.meals(date) });
      const previous = queryClient.getQueryData<MealWithItems[]>(qk.meals(date));
      const mealId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(blob);
      const optimistic: MealWithItems = {
        id: mealId,
        user_id: userId ?? "",
        eaten_at: new Date().toISOString(),
        meal_type: null,
        source: "photo",
        image_path: null,
        status: "processing",
        note: null,
        created_at: new Date().toISOString(),
        meal_items: [],
        _previewUrl: previewUrl,
      };
      queryClient.setQueryData<MealWithItems[]>(qk.meals(date), (prev) => [optimistic, ...(prev ?? [])]);
      return { previous, mealId };
    },
    onSuccess: (result, _vars, context) => {
      if (!context) return;
      // Reconcile the optimistic row's id with the real one (they're the
      // same UUID by construction, but the row may have been created under
      // a different id if onMutate ran before mutationFn generated its
      // own — swap the temp id for the real one either way).
      queryClient.setQueryData<MealWithItems[]>(qk.meals(date), (prev) =>
        (prev ?? []).map((m) => (m.id === context.mealId ? { ...m, id: result.mealId } : m)),
      );
      armFallbackPoll(result.mealId);
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData<MealWithItems[]>(qk.meals(date), (prev) =>
        (prev ?? []).map((m) => (m.id === context.mealId ? { ...m, status: "failed" } : m)),
      );
    },
  });

  async function retryMeal(mealId: string, blob: Blob, note?: string) {
    queryClient.setQueryData<MealWithItems[]>(qk.meals(date), (prev) =>
      (prev ?? []).map((m) => (m.id === mealId ? { ...m, status: "processing" } : m)),
    );
    try {
      if (!userId) throw new Error("Not signed in.");
      const prepared = await prepareMealPhoto(blob);
      await createAndAnalyze({ userId, mealId, blob: prepared.blob, contentType: prepared.contentType, note, isRetry: true });
      armFallbackPoll(mealId);
    } catch {
      queryClient.setQueryData<MealWithItems[]>(qk.meals(date), (prev) =>
        (prev ?? []).map((m) => (m.id === mealId ? { ...m, status: "failed" } : m)),
      );
    }
  }

  return { logMealPhoto: mutation.mutate, isLogging: mutation.isPending, retryMeal };
}

async function createAndAnalyze(params: {
  userId: string;
  mealId: string;
  blob: Blob;
  contentType: "image/webp" | "image/jpeg";
  note?: string;
  isRetry?: boolean;
}) {
  const supabase = createClient();
  if (!supabase) throw new Error("Sign-in isn't configured.");

  const ext = params.contentType === "image/webp" ? "webp" : "jpg";
  const path = `${params.userId}/${params.mealId}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("meals").upload(path, params.blob, {
    contentType: params.contentType,
    upsert: params.isRetry,
  });
  if (uploadError) throw uploadError;

  if (!params.isRetry) {
    const res = await fetch("/api/nutrition/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: params.mealId, source: "photo", status: "processing", imagePath: path, note: params.note }),
    });
    if (!res.ok) throw new Error("Couldn't create the meal row.");
  } else {
    await supabase.from("meals").update({ status: "processing", image_path: path }).eq("id", params.mealId);
  }

  const analyzeRes = await fetch("/api/nutrition/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mealId: params.mealId }),
  });
  if (!analyzeRes.ok && analyzeRes.status !== 429) {
    // A non-2xx here that isn't the rate-limit case is a network/server
    // problem reaching the route at all — the route's own try/catch
    // already flips status to 'failed' in the DB for in-route failures,
    // so this only fires for something outside that (route never ran).
    throw new Error("Couldn't start analysis.");
  }
}
