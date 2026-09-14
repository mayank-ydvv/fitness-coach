"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

// A deliberate extra click between the emailed link and a live session —
// not just UX polish. Verifying on GET (the previous behaviour) meant any
// automated link-prefetch (corporate email scanners, Gmail's own image
// proxy) silently consumed the one-time token before the user ever saw the
// page, which reads to them as "the link is broken". Requiring a click
// means only a real user click can trigger verifyOtp.
export function ConfirmSignIn({ tokenHash, type, next }: { tokenHash: string; type: EmailOtpType; next: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");

  async function verify() {
    const supabase = createClient();
    if (!supabase) {
      setStatus("error");
      return;
    }
    setStatus("verifying");
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      setStatus("error");
      return;
    }
    // A real designed state, not padding: without it, verifying jumps
    // straight to a blank navigation with no confirmation the click
    // worked at all.
    setStatus("success");
    setTimeout(() => router.replace(next), 500);
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-action-danger">
          That link has expired or was already used. Request a new one from the sign-in page.
        </p>
        <Button type="button" onClick={() => router.replace("/login")} className="w-full">
          Back to sign in
        </Button>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-2 text-action">
        <CircleCheck size={28} aria-hidden />
        <p className="font-medium text-ink-primary">You&apos;re in — taking you there now.</p>
      </div>
    );
  }

  return (
    <Button type="button" onClick={verify} loading={status === "verifying"} className="w-full">
      Verify and sign in
    </Button>
  );
}
