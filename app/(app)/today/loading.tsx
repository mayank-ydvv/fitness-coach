import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Matches Today's real shape (brief §8: "skeletons matching the shape
 * of incoming content, no full-page spinners") — same block order as
 * the page itself: date, hero number + bar, next-session card,
 * quick-log, habits, macro bars, recent meals.
 */
export default function TodayLoading() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-4 w-24" />

      <div className="flex flex-col items-center gap-3 py-4">
        <Skeleton className="h-16 w-32" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-2 w-full max-w-56 rounded-full" />
      </div>

      <Skeleton className="h-24 w-full rounded-card" />
      <Skeleton className="h-11 w-full rounded-control" />
      <Skeleton className="h-20 w-full rounded-card" />

      <div className="flex flex-col gap-3 rounded-card border border-hairline bg-surface-raised p-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      <Skeleton className="h-16 w-full rounded-card" />
    </div>
  );
}
