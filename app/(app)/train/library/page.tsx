import { createClient } from "@/lib/supabase/server";
import { ExerciseLibrary } from "@/components/train/ExerciseLibrary";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: exercises } = await supabase.from("exercises").select("*").order("name");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-ink-primary">Exercise library</h1>
      <ExerciseLibrary exercises={exercises ?? []} />
    </div>
  );
}
