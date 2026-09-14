import { createClient } from "@/lib/supabase/server";
import { ExercisePicker } from "@/components/form/ExercisePicker";

export default async function FormPickerPage() {
  const supabase = await createClient();
  const { data: exercises } = await supabase.from("exercises").select("*").not("form_rules", "is", null).order("name");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-normal tracking-[-0.02em] text-ink-primary">Check your form</h1>
      <p className="text-sm text-ink-muted">
        On-device pose tracking — your camera video never leaves your device. Pick an exercise below.
      </p>
      <ExercisePicker exercises={exercises ?? []} />
    </div>
  );
}
