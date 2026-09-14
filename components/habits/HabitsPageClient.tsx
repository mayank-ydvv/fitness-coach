"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarCheck, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sheet } from "@/components/ui/Sheet";
import { useHabits, type HabitWithLogs } from "@/hooks/useHabits";
import { useToggleHabit } from "@/hooks/useToggleHabit";
import { computeStreaks, type HabitLogStatus } from "@/lib/habits/streaks";
import { weekCompletionRate } from "@/lib/habits/cadence";
import { weekStartLocal } from "@/lib/time/localDay";
import { EASE, DURATION } from "@/lib/motion/tokens";
import { TodayRow } from "./TodayRow";
import { HabitGrid } from "./HabitGrid";
import { StreakCard } from "./StreakCard";
import { WeeklyRate } from "./WeeklyRate";
import { HabitEditor, type HabitDraft } from "./HabitEditor";

export function HabitsPageClient({ userId, todayDate }: { userId: string; todayDate: string }) {
  const { data: habits = [], refetch } = useHabits(userId);
  const reduceMotion = useReducedMotion();
  const toggle = useToggleHabit(userId);
  const [editorOpen, setEditorOpen] = useState(false);
  // Present = editing that habit; absent + editorOpen = creating a new one.
  const [editingHabit, setEditingHabit] = useState<HabitWithLogs | null>(null);

  async function handleToggle(habitId: string, done: boolean) {
    toggle.mutate({ habitId, logDate: todayDate, done });
  }

  function openCreate() {
    setEditingHabit(null);
    setEditorOpen(true);
  }
  function openEdit(habit: HabitWithLogs) {
    setEditingHabit(habit);
    setEditorOpen(true);
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

  async function handleUpdate(draft: HabitDraft) {
    if (!editingHabit) return;
    await fetch(`/api/habits/${editingHabit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draft.name, emoji: draft.emoji || null, cadence: draft.cadence, targetPerWeek: draft.targetPerWeek, restDayEnabled: draft.restDayEnabled }),
    });
    setEditorOpen(false);
    setEditingHabit(null);
    refetch();
  }

  async function handleArchive() {
    if (!editingHabit) return;
    await fetch(`/api/habits/${editingHabit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    setEditorOpen(false);
    setEditingHabit(null);
    refetch();
  }

  if (habits.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-ink-primary">Habits</h1>
        <Card>
          <EmptyState icon={<CalendarCheck size={28} />} line="No habits yet. Add one — training, logging meals, sleep — and track it daily." />
        </Card>
        <Button onClick={openCreate}>
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
        <button type="button" onClick={openCreate} aria-label="Add habit" className="flex size-11 items-center justify-center rounded-control text-ink-muted hover:text-ink-primary">
          <Plus size={20} aria-hidden />
        </button>
      </div>

      <Card>
        <TodayRow habits={habits} todayDate={todayDate} onToggle={handleToggle} />
      </Card>

      {/* layout on each card + AnimatePresence around the list — "layout
          transitions when the list changes" (brief §11): archiving a
          habit now animates the remaining cards into place instead of
          an abrupt reflow. */}
      <AnimatePresence>
        {habits.map((habit) => {
          const logs: HabitLogStatus[] = habit.logs.map((l) => ({ logDate: l.log_date, status: l.status as "done" | "skipped" }));
          const { current, longest } = computeStreaks(logs, todayDate, habit.rest_day_enabled);
          const { done, target } = weekCompletionRate(logs, weekStart, habit.target_per_week);

          return (
            <motion.div
              key={habit.id}
              layout={!reduceMotion}
              initial={false}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ duration: DURATION.transition, ease: EASE.standard }}
            >
              <Card className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-ink-primary">
                    {habit.emoji} {habit.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => openEdit(habit)}
                    className="-my-2.5 -mr-2.5 flex min-h-11 items-center px-2.5 text-sm font-medium text-action underline-offset-2 hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <StreakCard current={current} longest={longest} />
                <WeeklyRate done={done} target={target} />
                <HabitGrid logs={logs} todayDate={todayDate} colorToken={habit.color_token} />
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <Sheet
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingHabit(null);
        }}
        title={editingHabit ? "Edit habit" : "New habit"}
      >
        <HabitEditor
          key={editingHabit?.id ?? "create"}
          initial={
            editingHabit
              ? {
                  name: editingHabit.name,
                  emoji: editingHabit.emoji ?? "",
                  cadence: editingHabit.cadence as "daily" | "weekly",
                  targetPerWeek: editingHabit.target_per_week,
                  restDayEnabled: editingHabit.rest_day_enabled,
                }
              : undefined
          }
          onSubmit={editingHabit ? handleUpdate : handleCreate}
          onCancel={() => setEditorOpen(false)}
          onArchive={editingHabit ? handleArchive : undefined}
        />
      </Sheet>
    </div>
  );
}
