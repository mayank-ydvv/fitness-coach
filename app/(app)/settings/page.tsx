import { createClient } from "@/lib/supabase/server";
import { PreferencesPanel } from "@/components/settings/PreferencesPanel";
import { ExportData } from "@/components/settings/ExportData";
import { DeleteAccount } from "@/components/settings/DeleteAccount";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("unit_system, hide_energy, display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-normal tracking-[-0.02em] text-ink-primary">Settings</h1>

      <PreferencesPanel
        initialUnitSystem={profile?.unit_system ?? "metric"}
        initialHideEnergy={profile?.hide_energy ?? false}
      />

      <Card className="flex flex-col gap-4">
        <p className="text-sm font-medium text-ink-primary">Account</p>
        <p className="text-sm text-ink-muted">{user.email}</p>
        <ExportData />
        <form action="/auth/signout" method="post">
          <Button variant="secondary" type="submit" className="w-full">
            Sign out
          </Button>
        </form>
        <DeleteAccount />
      </Card>
    </div>
  );
}
