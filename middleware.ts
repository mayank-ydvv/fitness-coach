import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { REMEMBER_COOKIE } from "@/lib/auth/rememberMe";

// Next 15 uses middleware.ts (not proxy.ts, which is a Next 16 rename that
// doesn't apply here). Refreshes the Supabase session cookie on every
// request so Server Components always see a valid session.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touching the session is what actually triggers a refresh when the
  // access token has expired.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // "Remember me" enforcement (see lib/auth/rememberMe.ts for the full
  // reasoning). The Supabase session cookie itself always lives 400
  // days — that can't be shortened through this library version's own
  // config — so a "not remembered" choice instead leaves behind a
  // second, real session-only cookie (REMEMBER_COOKIE) at sign-in time.
  // If that marker is gone but a Supabase session still is here, the
  // marker either expired (browser was closed and reopened — exactly
  // the case a "not remembered" choice should end) or it never existed
  // because this session predates this feature; either way, the
  // correct move is to sign out now rather than trust a session that
  // was never actually meant to persist.
  let effectiveUser = user;
  if (user && !request.cookies.has(REMEMBER_COOKIE)) {
    await supabase.auth.signOut();
    effectiveUser = null;
  }

  const { pathname } = request.nextUrl;
  const isPublicRoute = pathname.startsWith("/login") || pathname.startsWith("/auth") || pathname.startsWith("/demo") || pathname === "/";
  const isAppRoute = !isPublicRoute;

  if (!effectiveUser && isAppRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    // `signOut()` above queued cookie-clearing writes onto `response` via
    // the `setAll` callback — a fresh `NextResponse.redirect(...)` doesn't
    // carry those, so without copying them the browser would keep the
    // (now server-invalidated) session cookies and just get redirected
    // back to /login on every following request without ever actually
    // clearing them client-side.
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
