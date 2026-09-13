import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role client. Bypasses RLS entirely — never expose to the client,
 * never call from a client component.
 *
 * This is the ONLY client that may:
 *   - download an object from the private `meals` storage bucket for vision
 *     analysis (lib/ai/mealVision.ts)
 *   - write ai_jobs rows (lib/ai/jobs.ts)
 *   - write meal_items on the server after a vision call and flip
 *     meals.status to 'ready' | 'failed' (app/api/nutrition/analyze)
 *   - write progression_runs / rewrite planned_sets from the progression
 *     engine (app/api/session/[id]/finish)
 *
 * Everything else goes through lib/supabase/server.ts so RLS stays the
 * enforcement boundary, not "remembering to filter by user_id".
 */
let _client: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createAdminClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Paste it from the Supabase dashboard " +
        "(Project Settings -> API -> service_role key) into .env.local.",
    );
  }

  _client = createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return _client;
}
