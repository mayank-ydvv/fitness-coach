import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type { AiJobKind } from "@/lib/types";

const DAILY_CAPS: Record<AiJobKind, number> = {
  meal_vision: 20,
  program_gen: 3,
  form_summary: 30,
  weekly_checkin: 7,
};

/** Checks the per-user daily cap via the check_daily_cap() RPC (runs as the
 * caller, so RLS/auth.uid() scope it automatically — no user_id param
 * needed or trusted from the caller). */
export async function assertUnderDailyCap(supabaseUserClient: SupabaseClient<Database>, kind: AiJobKind): Promise<void> {
  const { data, error } = await supabaseUserClient.rpc("check_daily_cap", {
    p_kind: kind,
    p_limit: DAILY_CAPS[kind],
  });
  if (error) throw new Error(`Couldn't check your daily limit: ${error.message}`);
  if (!data) {
    throw new DailyCapError(kind, DAILY_CAPS[kind]);
  }
}

export class DailyCapError extends Error {
  constructor(
    public kind: AiJobKind,
    public limit: number,
  ) {
    super(`Daily limit of ${limit} reached for ${kind}.`);
    this.name = "DailyCapError";
  }
}

/** Writes ai_jobs via the admin client so it succeeds even if the request
 * that triggered it later fails/rolls back its own user-scoped writes. */
export async function recordAiJob(params: {
  userId: string;
  kind: AiJobKind;
  model?: string;
  status: "succeeded" | "failed" | "fallback";
  tokensIn?: number;
  tokensOut?: number;
  latencyMs: number;
  error?: string;
}) {
  const admin = createAdminClient();
  await admin.from("ai_jobs").insert({
    user_id: params.userId,
    kind: params.kind,
    model: params.model,
    status: params.status,
    tokens_in: params.tokensIn,
    tokens_out: params.tokensOut,
    latency_ms: params.latencyMs,
    error: params.error,
  });
}
