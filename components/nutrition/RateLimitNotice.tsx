import { Button } from "@/components/ui/Button";

export function RateLimitNotice({ message, onManualEntry }: { message: string; onManualEntry: () => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-control border border-hairline bg-surface-sunken p-3">
      <p className="text-sm text-ink-muted">{message}</p>
      <Button variant="secondary" size="md" onClick={onManualEntry}>
        Enter manually
      </Button>
    </div>
  );
}
