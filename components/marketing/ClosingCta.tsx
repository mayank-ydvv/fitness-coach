import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function ClosingCta() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-20 text-center">
      <h2 className="text-3xl font-normal text-ink-primary">Start with your own numbers.</h2>
      <p className="mx-auto mt-3 max-w-md text-ink-muted">
        Two minutes of setup, then a plan sized to what you told it — no email required to see how it
        works first.
      </p>
      <div className="mt-7">
        <Link href="/login">
          <Button size="lg">Create your account</Button>
        </Link>
      </div>
    </section>
  );
}
