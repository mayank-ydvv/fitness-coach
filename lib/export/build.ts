import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** Full data export — the heavy lifting is the export_account() RPC (0010
 * migration), which assembles all 16 tables in one round trip via RLS-
 * scoped SQL. This wraps it with the envelope metadata. */
export async function buildAccountExport(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("export_account");
  if (error) throw new Error(`Couldn't build export: ${error.message}`);
  return {
    exported_at: new Date().toISOString(),
    format_version: 1,
    data,
  };
}
