import { useMeasure } from "@/components/prefs/PreferencesProvider";

/** "Last: 60 kg x 9 @ RPE 8" — visible without scrolling, and the spec's
 * single most useful line for actually progressing. */
export function LastTimeLine({ last }: { last: { loadKg: number; reps: number; rpe: number | null } | undefined }) {
  const measure = useMeasure();
  if (!last) return <p className="text-sm text-ink-muted">No previous data for this exercise yet.</p>;
  return (
    <p className="text-sm text-ink-muted">
      Last: <span className="metric text-ink-primary">{measure.mass(last.loadKg)}</span> ×{" "}
      <span className="metric text-ink-primary">{last.reps}</span>
      {last.rpe !== null ? ` @ RPE ${last.rpe}` : ""}
    </p>
  );
}
