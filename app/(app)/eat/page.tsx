import { createClient } from "@/lib/supabase/server";
import { todayLocal, dayRangeUtc } from "@/lib/time/localDay";
import { EatPageClient } from "@/components/nutrition/EatPageClient";

export default async function EatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const timezone = profile?.timezone ?? "UTC";
  const date = todayLocal(timezone);
  const { start, end } = dayRangeUtc(date, timezone);

  const { data: meals } = await supabase
    .from("meals")
    .select("*, meal_items(*)")
    .eq("user_id", user.id)
    .gte("eaten_at", start)
    .lt("eaten_at", end)
    .order("eaten_at", { ascending: false });

  return <EatPageClient date={date} userId={user.id} initialMeals={meals ?? []} />;
}
