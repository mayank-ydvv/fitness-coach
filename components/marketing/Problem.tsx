/**
 * Immediately follows the sticky Hero (see Hero.tsx) — an opaque
 * background plus `relative z-10` is what makes it visually scroll up
 * and cover Hero rather than the two overlapping with no clear front/
 * back order (later DOM siblings already paint on top by default, but
 * z-10 makes that explicit rather than relying on paint-order alone).
 */
export function Problem() {
  return (
    <section className="relative z-10 bg-surface-base py-16">
      <div className="mx-auto max-w-3xl px-5">
        <h2 className="text-3xl font-normal text-ink-primary">Most plans ignore Tuesday.</h2>
        <div className="mt-6 flex flex-col gap-4 text-lg text-ink-muted">
          <p>
            A program built once, for someone else&apos;s week, doesn&apos;t know you skipped leg day or
            added an extra walk on Tuesday. It just keeps handing you next week&apos;s workout as if
            nothing happened.
          </p>
          <p>
            Logging food usually means typing every ingredient by hand, guessing at portions, and
            starting over each time you eat something you haven&apos;t logged before. By the third day,
            most people stop.
          </p>
          <p>
            And without a running record of either one, it&apos;s hard to tell if a plan is actually
            working or just filling time on your calendar.
          </p>
        </div>
      </div>
    </section>
  );
}
