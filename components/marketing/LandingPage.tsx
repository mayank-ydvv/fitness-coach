import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { ChapterSequence } from "./ChapterSequence";
import { Faq } from "./Faq";
import { ClosingCta } from "./ClosingCta";
import { Footer } from "./Footer";

/**
 * No "social proof" section — the brief is explicit: real testimonials
 * only, skip entirely rather than invent any. There are none yet.
 *
 * Problem, Features, HowItWorks, and BuiltForEveryAge no longer exist
 * as separate sections — their content was merged into
 * ChapterSequence's nine pinned chapters (see that file's own comment,
 * and DESIGN.md §22). FAQ and the closing CTA stay as normal sections.
 */
export function LandingPage() {
  return (
    <div className="bg-surface-base">
      <Nav />
      <Hero />
      <ChapterSequence />
      <Faq />
      <ClosingCta />
      <Footer />
    </div>
  );
}
