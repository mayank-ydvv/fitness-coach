import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  // Guest sessions are real anonymous Supabase users (see GuestButton) —
  // "the data won't save" is made true here, not by RLS: on sign-out we
  // delete the account (and everything cascading from auth.users) via the
  // existing delete_account() RPC, the same one Settings uses, rather than
  // leaving throwaway rows behind on every guest visit.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.is_anonymous) {
    await supabase.rpc("delete_account");
  }

  await supabase.auth.signOut();

  const formData = await request.formData().catch(() => null);
  const next = formData?.get("next");
  return NextResponse.redirect(new URL(typeof next === "string" && next.startsWith("/") ? next : "/", request.url));
}
