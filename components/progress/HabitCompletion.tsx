import { Card } from "@/components/ui/Card";

export function HabitCompletion({ habits }: { habits: { name: string; rate: number }[] }) {
  if (habits.length === 0) return null;
  return (
    <Card className="flex flex-col gap-2">
      <p className="text-sm font-medium text-ink-primary">Habit completion (this week)</p>
      {habits.map((h) => (
        <div key={h.name}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="text-ink-primary">{h.name}</span>
            <span className="text-ink-muted">{Math.round(h.rate * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full rounded-full bg-load-blue" style={{ width: `${h.rate * 100}%` }} />
          </div>
        </div>
      ))}
    </Card>
  );
}
