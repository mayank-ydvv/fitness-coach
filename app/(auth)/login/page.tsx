import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell>
      <h1 className="mb-1 text-3xl font-normal tracking-[-0.02em] text-ink-primary">AI Fitness Coach</h1>
      <p className="mb-6 text-ink-muted">Sign in to see today&apos;s workout and log your meals.</p>
      <LoginForm next={next} />
    </AuthShell>
  );
}
