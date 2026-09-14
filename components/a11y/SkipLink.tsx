/** Skip to main content — the first focusable element on every page, per
 * WCAG 2.1 AA. Visually hidden until focused. */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-action focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink-on-brand"
    >
      Skip to main content
    </a>
  );
}
