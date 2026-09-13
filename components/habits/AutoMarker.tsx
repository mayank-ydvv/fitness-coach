/** A small glyph — the accessible name carries "ticked automatically" too,
 * not just the visual, so a screen-reader user gets the same information. */
export function AutoMarker() {
  return (
    <span aria-label="ticked automatically" title="Ticked automatically" className="text-[10px] text-ink-muted">
      ⚡
    </span>
  );
}
