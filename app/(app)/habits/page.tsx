import { createClient } from "@/lib/supabase/server";
import { todayLocal } from "@/lib/time/localDay";
import { HabitsPageClient } from "@/components/habits/HabitsPageClient";

export default async function HabitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const todayDate = todayLocal(profile?.timezone ?? "UTC");

  return <HabitsPageClient userId={user.id} todayDate={todayDate} />;
}
