"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { TextInput } from "@/components/ui/TextInput";
import { GuestButton } from "@/components/auth/GuestButton";

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
      setError(error.message);
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
      <p className="text-sm text-ink-primary">
        Check {email} for a sign-in link. It expires in an hour — if it doesn&apos;t arrive, check spam or try again.
      </p>
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
          />
        </Field>
        <Button type="submit" disabled={status === "sending"} className="w-full">
          {status === "sending" ? "Sending link…" : "Send sign-in link"}
        </Button>
      </form>
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
