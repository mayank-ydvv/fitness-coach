"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { TextInput } from "@/components/ui/TextInput";
import { GuestButton } from "@/components/auth/GuestButton";
import { describeAuthError } from "./authErrorCopy";

/**
 * This app is passwordless by design (magic link + Google + guest) — see
 * DESIGN.md's Phase 5 note. One email field IS the whole form; there's
 * no separate signup mode to toggle to, since the same link creates an
 * account on first use.
 */
export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  // Defaults to checked — matches the app's actual default behavior
  // (see lib/auth/rememberMe.ts): sessions already persist 400 days
  // unless this box is unchecked.
  const [rememberMe, setRememberMe] = useState(true);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setStatus("error");
      setError("Sign-in isn't configured yet — Supabase environment variables are missing.");
      return;
    }
    setStatus("sending");
    setError(null);
    // emailRedirectTo is the FINAL destination after verification, not the
    // confirm page itself — the email template builds the actual
    // /auth/confirm?token_hash=...&next=... link using {{ .RedirectTo }} as
    // the next param (see the "Magic link or OTP" template in Supabase).
    // The remember-me choice rides along as a query param on that same
    // URL — ConfirmSignIn reads it back out once verification succeeds
    // and strips it before the final redirect (see that component).
    const redirectUrl = new URL(next ?? "/today", window.location.origin);
    redirectUrl.searchParams.set("remember", rememberMe ? "1" : "0");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl.toString() },
    });
    if (error) {
      setStatus("error");
      setError(describeAuthError(error.message));
      return;
    }
    setStatus("sent");
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    if (!supabase) return;
    const redirectUrl = new URL("/auth/callback", window.location.origin);
    if (next) redirectUrl.searchParams.set("next", next);
    redirectUrl.searchParams.set("remember", rememberMe ? "1" : "0");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl.toString() },
    });
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-start gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-action/10 text-action">
          <MailCheck size={22} aria-hidden />
        </span>
        <div>
          <p className="font-medium text-ink-primary">Check {email}</p>
          <p className="mt-1 text-ink-muted">
            We sent a sign-in link. It expires in an hour — if it doesn&apos;t arrive, check spam or send
            another.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm font-medium text-ink-primary underline-offset-2 hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={sendMagicLink} className="flex flex-col gap-4">
        <Field label="Email" htmlFor="email" error={status === "error" ? (error ?? undefined) : undefined}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-invalid={status === "error"}
          />
        </Field>
        <label className="-my-2.5 flex min-h-11 items-center gap-2.5 py-2.5 text-sm text-ink-primary">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="size-4 accent-action"
          />
          Keep me signed in on this device
        </label>
        <Button type="submit" loading={status === "sending"} className="w-full">
          Send sign-in link
        </Button>
      </form>
      <p className="text-sm text-ink-muted">New here? The same link creates your account.</p>
      <div className="flex items-center gap-3 text-xs text-ink-muted">
        <div className="h-px flex-1 bg-hairline" />
        or
        <div className="h-px flex-1 bg-hairline" />
      </div>
      <Button type="button" variant="secondary" onClick={signInWithGoogle} className="w-full">
        Continue with Google
      </Button>
      <div className="mt-1 flex justify-center">
        <GuestButton next={next ?? "/onboarding"}>Continue as a guest — nothing will be saved</GuestButton>
      </div>
    </div>
  );
}
