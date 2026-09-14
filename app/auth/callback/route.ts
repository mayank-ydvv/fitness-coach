import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { REMEMBER_COOKIE, REMEMBER_MAX_AGE } from "@/lib/auth/rememberMe";

// OAuth (Google) redirect target: ?code=... -> exchangeCodeForSession.
// Kept separate from /auth/confirm (magic link, ?token_hash&type=) because
// mixing the two flows on one route produces "both auth code and code
// verifier should be non-empty" errors.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/today";
  // LoginForm put this on the redirectTo URL before starting the OAuth
  // round-trip — see lib/auth/rememberMe.ts for what it controls.
  const remember = searchParams.get("remember") !== "0";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.set(REMEMBER_COOKIE, "1", {
        path: "/",
        sameSite: "lax",
        ...(remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
      });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
