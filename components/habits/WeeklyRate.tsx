export function WeeklyRate({ done, target }: { done: number; target: number }) {
  const fraction = target > 0 ? Math.min(1, done / target) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="text-ink-primary">This week</span>
        <span className="text-ink-muted">
          {done} of {target}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
        <div className="h-full rounded-full bg-load-blue" style={{ width: `${fraction * 100}%` }} />
      </div>
    </div>
  );
}
