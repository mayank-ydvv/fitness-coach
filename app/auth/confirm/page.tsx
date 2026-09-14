import type { EmailOtpType } from "@supabase/supabase-js";
import { ConfirmSignIn } from "@/components/auth/ConfirmSignIn";
import { AuthShell } from "@/components/auth/AuthShell";

// Renders a page rather than verifying on GET directly, so verification only
// ever fires from a real click — see the comment in ConfirmSignIn for why.
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const { token_hash: tokenHash, type, next } = await searchParams;

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="mb-1 text-3xl font-normal tracking-[-0.02em] text-ink-primary">AI Fitness Coach</h1>
        {tokenHash && type ? (
          <>
            <p className="mb-6 text-ink-muted">Confirm it was you before we sign you in.</p>
            <ConfirmSignIn tokenHash={tokenHash} type={type as EmailOtpType} next={next ?? "/today"} />
          </>
        ) : (
          <p className="text-action-danger">This sign-in link is missing or malformed. Request a new one from the sign-in page.</p>
        )}
      </div>
    </AuthShell>
  );
}
