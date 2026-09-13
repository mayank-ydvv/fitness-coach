import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { PreferencesProvider } from "@/components/prefs/PreferencesProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at, unit_system, hide_energy")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarded_at) redirect("/onboarding");

  return (
    <PreferencesProvider
      initialUnitSystem={profile.unit_system}
      initialHideEnergy={profile.hide_energy}
    >
      <AppShell>{children}</AppShell>
    </PreferencesProvider>
  );
}
