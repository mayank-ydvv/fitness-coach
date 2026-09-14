import { createClient } from "@/lib/supabase/server";
import { ProgramWizard } from "@/components/train/ProgramWizard";
import type { Equipment, Goal } from "@/lib/types";

export default async function NewProgramPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("goal, days_per_week, session_minutes, equipment, limitations, experience_level")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-normal tracking-[-0.02em] text-ink-primary">Build a program</h1>
      <ProgramWizard
        experienceLevel={profile?.experience_level ?? "beginner"}
        initial={{
          goal: (profile?.goal as Goal) ?? null,
          daysPerWeek: profile?.days_per_week ?? 3,
          sessionMinutes: profile?.session_minutes ?? 60,
          equipment: (profile?.equipment as Equipment[]) ?? [],
          limitations: profile?.limitations ?? "",
        }}
      />
    </div>
  );
}
