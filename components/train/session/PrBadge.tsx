/**
 * Text alone carries "this was a PR" — no trophy icon (explicitly banned:
 * "trophy icons for achievements"). Uses the one accent, not the
 * load-yellow intensity token — a PR is a highlight, not an RPE/
 * intensity signal, and load-yellow's meaning elsewhere in the app is
 * "moderate/over-target," which would misread here.
 */
export function PrBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-action/10 px-2.5 py-1 text-xs font-medium text-action">
      Personal record
    </span>
  );
}
