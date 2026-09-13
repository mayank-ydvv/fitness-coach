import { HabitDot } from "./HabitDot";
import type { HabitWithLogs } from "@/hooks/useHabits";

export function TodayRow({
  habits,
  todayDate,
  onToggle,
}: {
  habits: HabitWithLogs[];
  todayDate: string;
  onToggle: (habitId: string, done: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {habits.map((h) => {
        const todayLog = h.logs.find((l) => l.log_date === todayDate);
        const done = todayLog?.status === "done";
        return (
          <HabitDot
            key={h.id}
            name={h.name}
            emoji={h.emoji}
            done={done}
            isAuto={todayLog?.source !== "user" && todayLog !== undefined}
            colorToken={h.color_token}
            onToggle={() => onToggle(h.id, !done)}
          />
        );
      })}
    </div>
  );
}
