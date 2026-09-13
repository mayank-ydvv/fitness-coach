import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/today");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-surface-base px-5 text-center">
      <div>
        <h1 className="mb-2 text-3xl font-semibold text-ink-primary">AI Fitness Coach</h1>
        <p className="mx-auto max-w-sm text-ink-muted">
          Photograph your meals. Get a program that adjusts to what you actually log. Check your form
          with your camera. See the numbers move.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Link href="/login">
          <Button size="lg">Get started</Button>
        </Link>
        <Link href="/demo" className="text-sm font-medium text-ink-muted underline underline-offset-2">
          See a demo first
        </Link>
      </div>
    </div>
  );
}
