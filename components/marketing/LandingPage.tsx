import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Problem } from "./Problem";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { BuiltForEveryAge } from "./BuiltForEveryAge";
import { ProductPreview } from "./ProductPreview";
import { Faq } from "./Faq";
import { ClosingCta } from "./ClosingCta";
import { Footer } from "./Footer";

/**
 * No "social proof" section — the brief is explicit: real testimonials
 * only, skip entirely rather than invent any. There are none yet.
 */
export function LandingPage() {
  return (
    <div className="bg-surface-base">
      <Nav />
      <Hero />
      <Problem />
      <Features />
      <HowItWorks />
      <BuiltForEveryAge />
      <ProductPreview />
      <Faq />
      <ClosingCta />
      <Footer />
    </div>
  );
}
