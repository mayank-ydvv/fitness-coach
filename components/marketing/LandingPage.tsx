import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Features } from "./Features";
import { ChapterSequence } from "./ChapterSequence";
import { Faq } from "./Faq";
import { ClosingCta } from "./ClosingCta";
import { Footer } from "./Footer";

/**
 * No "social proof" section — the brief is explicit: real testimonials
 * only, skip entirely rather than invent any. There are none yet.
 *
 * Problem ("Most plans ignore Tuesday") is gone at the user's request —
 * Features is now the section right after Hero and picks up Hero's
 * sticky-cover treatment (see Features.tsx and Hero.tsx). Hero and
 * Features scroll normally; only after Features does the pinned
 * ChapterSequence begin, walking through onboarding/today/training/
 * progress/every-age.
 */
export function LandingPage() {
  return (
    <div className="bg-surface-base">
      <Nav />
      <Hero />
      <Features />
      <ChapterSequence />
      <Faq />
      <ClosingCta />
      <Footer />
    </div>
  );
}
