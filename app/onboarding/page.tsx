import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

// Deliberately outside the (app) route group — that layout redirects here
// whenever onboarded_at is null, so nesting this page under it would loop.
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh bg-surface-base">
      <OnboardingFlow />
    </div>
  );
}
