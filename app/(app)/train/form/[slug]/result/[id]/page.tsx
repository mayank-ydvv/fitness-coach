import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormSummary } from "@/components/form/FormSummary";

export default async function FormResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: analysis } = await supabase.from("form_analyses").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!analysis) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-ink-primary">Form check results</h1>
      <FormSummary analysis={analysis} />
    </div>
  );
}
