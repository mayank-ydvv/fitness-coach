import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-base px-5">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold text-ink-primary">AI Fitness Coach</h1>
        <p className="mb-6 text-sm text-ink-muted">Sign in to see today&apos;s workout and log your meals.</p>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
