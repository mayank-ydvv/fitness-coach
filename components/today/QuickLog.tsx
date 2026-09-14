import Link from "next/link";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * "Quick-log shortcuts for the actions people repeat daily" (brief §8).
 * Scoped to what's real: logging a meal is the one repeat-action that
 * had no persistent entry point on Today — RecentMeals' "Log a meal"
 * link only existed inside its empty state, which disappears the moment
 * one meal exists today. That's exactly wrong for the case the brief
 * names explicitly: "the third meal of the fourth day," not the first.
 *
 * Deliberately NOT adding a "Log weight" shortcut here — there is no
 * weight-logging UI anywhere in the app yet (body_metrics is read-only
 * from Progress; onboarding writes the one starting value and nothing
 * since). Flagged in DESIGN.md rather than inventing a destination that
 * doesn't exist.
 */
export function QuickLog() {
  return (
    <Link href="/eat">
      <Button variant="secondary" size="md" className="w-full">
        <Camera size={18} aria-hidden />
        Log a meal
      </Button>
    </Link>
  );
}
