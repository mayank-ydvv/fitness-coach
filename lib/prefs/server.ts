import { createClient } from "@/lib/supabase/server";
import { makeFormatter, type Measure } from "@/lib/units/format";

/** Server-side counterpart to useMeasure() — builds the identical formatter
 * from the signed-in user's profile row, so a Server Component's first
 * render already shows the right units and never flashes a visible kcal
 * number before hydration can hide it. */
export async function getMeasure(): Promise<Measure> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return makeFormatter({ unitSystem: "metric", hideEnergy: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("unit_system, hide_energy")
    .eq("id", user.id)
    .single();

  return makeFormatter({
    unitSystem: profile?.unit_system ?? "metric",
    hideEnergy: profile?.hide_energy ?? false,
  });
}
