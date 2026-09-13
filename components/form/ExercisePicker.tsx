import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { Tables } from "@/lib/supabase/database.types";

/** Only exercises with a non-null form_rules — shows the required view. */
export function ExercisePicker({ exercises }: { exercises: Tables<"exercises">[] }) {
  return (
    <div className="flex flex-col gap-2">
      {exercises.map((ex) => (
        <Link key={ex.id} href={`/train/form/${ex.slug}`}>
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-primary">{ex.name}</p>
              <p className="text-xs capitalize text-ink-muted">{ex.form_camera_view} view</p>
            </div>
          </Card>
        </Link>
      ))}
      {exercises.length === 0 ? <p className="text-sm text-ink-muted">Form checks aren&apos;t available yet.</p> : null}
    </div>
  );
}
