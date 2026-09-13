import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function NextSessionCard({
  session,
}: {
  session: { name: string; exerciseCount: number; estimatedMinutes: number | null } | null;
}) {
  if (!session) {
    return (
      <Card className="flex flex-col items-center gap-3 text-center">
        <Dumbbell size={24} className="text-ink-muted" />
        <p className="text-sm text-ink-muted">No program yet. Build one from your goals and equipment.</p>
        <Link href="/train">
          <Button variant="secondary">Build a program</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-medium uppercase text-ink-muted">Today&apos;s session</p>
        <p className="text-lg font-medium text-ink-primary">{session.name}</p>
        <p className="text-sm text-ink-muted">
          {session.exerciseCount} exercises{session.estimatedMinutes ? ` · ~${session.estimatedMinutes} min` : ""}
        </p>
      </div>
      <Link href="/train">
        <Button className="w-full">Start session</Button>
      </Link>
    </Card>
  );
}
