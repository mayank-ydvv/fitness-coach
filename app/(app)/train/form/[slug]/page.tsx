import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DynamicCaptureClient } from "./DynamicCaptureClient";

export default async function FormExercisePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: exercise } = await supabase.from("exercises").select("*").eq("slug", slug).not("form_rules", "is", null).maybeSingle();
  if (!exercise) notFound();

  if (exercise.form_camera_view !== "side") {
    // The M5 integration layer (worker.ts) only wires up side-view
    // rep-counted exercises today — front-view (squatFront) and plank's
    // isometric hold have their pure rule evaluators built and tested
    // (lib/form/rules/squatFront.ts, plank.ts) but aren't threaded through
    // the worker/capture UI yet. Say so rather than showing a broken screen.
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-normal tracking-[-0.02em] text-ink-primary">{exercise.name}</h1>
        <p className="text-sm text-ink-muted">This exercise&apos;s form check isn&apos;t wired up to the camera yet — the rules exist, the capture flow doesn&apos;t reach them.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-normal tracking-[-0.02em] text-ink-primary">{exercise.name}</h1>
      <DynamicCaptureClient exerciseId={exercise.id} exerciseSlug={exercise.slug} exerciseName={exercise.name} cameraView="side" />
    </div>
  );
}
