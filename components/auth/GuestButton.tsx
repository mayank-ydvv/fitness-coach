"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

/**
 * Real anonymous Supabase session (auth.signInAnonymously), not a
 * client-only mock — the guest gets the actual app (real meal-photo
 * analysis, real program generation) writing to real, RLS-scoped rows
 * under a throwaway user. Nothing is recoverable after sign-out: the
 * signout route deletes the account (see app/auth/signout/route.ts),
 * which is what "the data won't save" means here.
 */
export function GuestButton({
  next = "/onboarding",
  className,
  children = "Continue as a guest",
}: {
  next?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const supabase = createClient();
    if (!supabase) {
      setStatus("error");
      setError("Guest mode isn't configured yet.");
      return;
    }
    setStatus("loading");
    setError(null);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }
    router.replace(next);
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className={cn(
          "text-sm font-medium text-ink-muted underline underline-offset-2 disabled:opacity-50",
          className,
        )}
      >
        {status === "loading" ? "Starting…" : children}
      </button>
      {status === "error" ? <p className="text-xs text-load-red">{error}</p> : null}
    </div>
  );
}
