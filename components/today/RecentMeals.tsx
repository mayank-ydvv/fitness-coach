import Link from "next/link";
import { Salad } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusDot } from "@/components/ui/StatusDot";

type Meal = { id: string; name: string; kcalLabel: string | null };

export function RecentMeals({ meals }: { meals: Meal[] }) {
  if (meals.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 text-center">
        <Salad size={24} className="text-ink-muted" />
        <p className="text-sm text-ink-muted">Nothing logged yet. Photograph your next meal and it&apos;ll land here.</p>
        <Link href="/eat" className="text-sm font-medium text-ink-primary underline underline-offset-2">
          Log a meal
        </Link>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm font-medium text-ink-primary">Today&apos;s meals</p>
      {meals.map((m) => (
        <div key={m.id} className="flex items-center justify-between">
          <span className="text-sm text-ink-primary">{m.name}</span>
          {m.kcalLabel ? (
            <StatusDot tone="load-blue" label={m.kcalLabel} />
          ) : (
            <span className="text-xs text-ink-muted">logged</span>
          )}
        </div>
      ))}
    </Card>
  );
}
