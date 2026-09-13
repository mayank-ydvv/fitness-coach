import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const DeleteAccountSchema = z.object({ confirmation: z.literal("DELETE") });

/** Account deletion that actually cascades — the delete_account() RPC
 * (0010 migration) deletes the auth.users row, and every user-owned table
 * already has `on delete cascade` back to it. Requires the client to
 * literally type "DELETE" server-side too, not just in the UI, so a
 * scripted retry can't skip the confirmation. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = DeleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });
  }

  const { error } = await supabase.rpc("delete_account");
  if (error) return NextResponse.json({ error: "Couldn't delete your account. Try again." }, { status: 500 });

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
