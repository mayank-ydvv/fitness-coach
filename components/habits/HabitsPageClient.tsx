"use client";

import { useState } from "react";
import { CalendarCheck, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sheet } from "@/components/ui/Sheet";
import { useHabits } from "@/hooks/useHabits";
import { useToggleHabit } from "@/hooks/useToggleHabit";
import { computeStreaks, type HabitLogStatus } from "@/lib/habits/streaks";
import { weekCompletionRate } from "@/lib/habits/cadence";
import { weekStartLocal } from "@/lib/time/localDay";
import { TodayRow } from "./TodayRow";
import { HabitGrid } from "./HabitGrid";
import { StreakCard } from "./StreakCard";
import { WeeklyRate } from "./WeeklyRate";
import { HabitEditor, type HabitDraft } from "./HabitEditor";

export function HabitsPageClient({ userId, todayDate }: { userId: string; todayDate: string }) {
  const { data: habits = [], refetch } = useHabits(userId);
  const toggle = useToggleHabit(userId);
  const [editorOpen, setEditorOpen] = useState(false);

  async function handleToggle(habitId: string, done: boolean) {
    toggle.mutate({ habitId, logDate: todayDate, done });
  }

  async function handleCreate(draft: HabitDraft) {
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draft.name, emoji: draft.emoji || undefined, cadence: draft.cadence, targetPerWeek: draft.targetPerWeek, restDayEnabled: draft.restDayEnabled }),
    });
    setEditorOpen(false);
    refetch();
  }

  if (habits.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-ink-primary">Habits</h1>
        <Card>
          <EmptyState icon={<CalendarCheck size={28} />} line="No habits yet. Add one — training, logging meals, sleep — and track it daily." />
        </Card>
        <Button onClick={() => setEditorOpen(true)}>
          <Plus size={16} aria-hidden /> Add habit
        </Button>
        <Sheet open={editorOpen} onOpenChange={setEditorOpen} title="New habit">
          <HabitEditor onSubmit={handleCreate} onCancel={() => setEditorOpen(false)} />
        </Sheet>
      </div>
    );
  }

  const weekStart = weekStartLocal(todayDate);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-primary">Habits</h1>
        <button type="button" onClick={() => setEditorOpen(true)} aria-label="Add habit" className="flex size-11 items-center justify-center rounded-control text-ink-muted hover:text-ink-primary">
          <Plus size={20} aria-hidden />
        </button>
      </div>

      <Card>
        <TodayRow habits={habits} todayDate={todayDate} onToggle={handleToggle} />
      </Card>

      {habits.map((habit) => {
        const logs: HabitLogStatus[] = habit.logs.map((l) => ({ logDate: l.log_date, status: l.status as "done" | "skipped" }));
        const { current, longest } = computeStreaks(logs, todayDate, habit.rest_day_enabled);
        const { done, target } = weekCompletionRate(logs, weekStart, habit.target_per_week);

        return (
          <Card key={habit.id} className="flex flex-col gap-3">
            <p className="text-sm font-medium text-ink-primary">
              {habit.emoji} {habit.name}
            </p>
            <StreakCard current={current} longest={longest} />
            <WeeklyRate done={done} target={target} />
            <HabitGrid logs={logs} todayDate={todayDate} colorToken={habit.color_token} />
          </Card>
        );
      })}

      <Sheet open={editorOpen} onOpenChange={setEditorOpen} title="New habit">
        <HabitEditor onSubmit={handleCreate} onCancel={() => setEditorOpen(false)} />
      </Sheet>
    </div>
  );
}
