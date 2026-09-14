"use client";

import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { useHabits } from "@/hooks/useHabits";
import { useToggleHabit } from "@/hooks/useToggleHabit";
import { TodayRow } from "@/components/habits/TodayRow";
import { Card } from "@/components/ui/Card";
import { IconBadge } from "@/components/ui/IconBadge";

/** Today's tappable habit dots — spec §9 priority order item 3. Reuses
 * the same TodayRow/useHabits/useToggleHabit as the full Habits page so
 * a tap here and a tap there behave identically. */
export function TodayHabits({ userId, todayDate }: { userId: string; todayDate: string }) {
  const { data: habits = [] } = useHabits(userId);
  const toggle = useToggleHabit(userId);

  if (habits.length === 0) {
    return (
      <Card className="flex flex-row items-center gap-3.5">
        <IconBadge icon={<CalendarCheck size={20} />} size="md" />
        <p className="text-sm text-ink-muted">
          No habits yet.{" "}
          <Link href="/habits" className="font-medium text-ink-primary underline underline-offset-2">
            Add one
          </Link>{" "}
          to track daily.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <TodayRow habits={habits} todayDate={todayDate} onToggle={(habitId, done) => toggle.mutate({ habitId, logDate: todayDate, done })} />
    </Card>
  );
}
