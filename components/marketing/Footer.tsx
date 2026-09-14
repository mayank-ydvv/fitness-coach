export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-5 py-8 text-sm text-ink-muted sm:flex-row sm:justify-between">
        <span>AI Fitness Coach</span>
        {/* Privacy links to the FAQ's real privacy answer (#privacy on
            that <details>) rather than a standalone policy page — there
            isn't one yet, and a link to a page that doesn't exist is
            worse than reusing real content already on this page. No
            "Contact" item: there's no real support address to point it
            at, and a fabricated one is worse than omitting the link —
            flagged to the user rather than invented. */}
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-5">
          <a href="#training" className="hover:text-ink-primary">
            Training
          </a>
          <a href="#food" className="hover:text-ink-primary">
            Food
          </a>
          <a href="#habits" className="hover:text-ink-primary">
            Habits
          </a>
          <a href="#progress" className="hover:text-ink-primary">
            Progress
          </a>
          <a href="#privacy" className="hover:text-ink-primary">
            Privacy
          </a>
        </nav>
      </div>
    </footer>
  );
}
