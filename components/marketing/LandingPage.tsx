import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Problem } from "./Problem";
import { Features } from "./Features";
import { ChapterSequence } from "./ChapterSequence";
import { Faq } from "./Faq";
import { ClosingCta } from "./ClosingCta";
import { Footer } from "./Footer";

/**
 * No "social proof" section — the brief is explicit: real testimonials
 * only, skip entirely rather than invent any. There are none yet.
 *
 * Hero, Problem, and Features scroll normally, same as before §22's
 * merge — the user asked for that back explicitly (DESIGN.md §23).
 * Only after Features does the pinned ChapterSequence begin, walking
 * through onboarding/today/training/progress/every-age. HowItWorks and
 * BuiltForEveryAge's old content stays folded into ChapterSequence
 * (every-age) rather than restored as their own sections.
 */
export function LandingPage() {
  return (
    <div className="bg-surface-base">
      <Nav />
      <Hero />
      <Problem />
      <Features />
      <ChapterSequence />
      <Faq />
      <ClosingCta />
      <Footer />
    </div>
  );
}
