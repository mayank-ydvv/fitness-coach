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
    const redirectTo = `${window.location.origin}${next ?? "/today"}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
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
    const redirectTo = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
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
