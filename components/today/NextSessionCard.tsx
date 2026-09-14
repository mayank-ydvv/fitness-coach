import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StartSessionButton } from "@/components/train/StartSessionButton";

/**
 * The single clearest "next action" on Today (brief §8) — the CTA
 * starts the session directly (via the same StartSessionButton the real
 * Train page uses), not a link to a list the user still has to act on.
 *
 * shadow-floating, not the standard shadow-raised every other Today
 * card uses — Phase 8 self-critique caught every card on this page
 * reading as visually identical ("identical rounded cards... for every
 * piece of content," a named generic tell). This is the one thing on
 * the page you're meant to act on first; it should look like it.
 */
export function NextSessionCard({
  session,
}: {
  // plannedWorkoutId is optional so the logged-out /demo page (real
  // fixture content, no real account to start a session against) can
  // reuse this component without wiring a fake StartSessionButton call.
  session: { name: string; exerciseCount: number; estimatedMinutes: number | null; plannedWorkoutId?: string } | null;
}) {
  if (!session) {
    return (
      <Card className="flex flex-col items-center gap-3 text-center">
        <Dumbbell size={24} className="text-ink-muted" />
        <p className="text-sm text-ink-muted">No program yet. Build one from your goals and equipment.</p>
        <Link href="/train">
          <Button variant="secondary">Build a program</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3 shadow-floating">
      <div>
        <p className="text-sm text-ink-muted">Today&apos;s session</p>
        <p className="text-lg font-medium text-ink-primary">{session.name}</p>
        <p className="text-sm text-ink-muted">
          {session.exerciseCount} exercises{session.estimatedMinutes ? `, about ${session.estimatedMinutes} minutes` : ""}
        </p>
      </div>
      {session.plannedWorkoutId ? (
        <StartSessionButton plannedWorkoutId={session.plannedWorkoutId} />
      ) : (
        <Link href="/login">
          <Button size="lg" className="w-full">
            Start session
          </Button>
        </Link>
      )}
    </Card>
  );
}
