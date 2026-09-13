"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { Calculator, Repeat } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSessionPlayer, type PlannedSetView } from "@/hooks/useSessionPlayer";
import { useLastPerformance } from "@/hooks/useLastPerformance";
import { useRestTimer } from "@/hooks/useRestTimer";
import { SetRow } from "./SetRow";
import { CompletedStack } from "./CompletedStack";
import { RestTimer } from "./RestTimer";
import { PlateCalculatorSheet } from "./PlateCalculatorSheet";
import { SwapExerciseSheet } from "./SwapExerciseSheet";

export function SessionPlayer({ sessionId, plannedSets: initialPlannedSets }: { sessionId: string; plannedSets: PlannedSetView[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [plannedSets, setPlannedSets] = useState(initialPlannedSets);
  const [prSetIds, setPrSetIds] = useState<Set<string>>(new Set());
  const [plateSheetOpen, setPlateSheetOpen] = useState(false);
  const [swapSheetOpen, setSwapSheetOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const exerciseIds = Array.from(new Set(plannedSets.map((s) => s.exerciseId)));
  const { data: lastPerformance = {} } = useLastPerformance(exerciseIds);
  const player = useSessionPlayer(sessionId, plannedSets, lastPerformance);
  const timer = useRestTimer(player.current?.restSeconds ?? 90);

  async function handleLog(reps: number, loadKg: number, rpe: number | null) {
    const setId = player.current?.id;
    const result = await player.logSet(reps, loadKg, rpe);
    if (!result.ok) {
      push("Couldn't save that set — try again.", "danger");
      return;
    }
    if (result.isPr && setId) setPrSetIds((prev) => new Set(prev).add(setId));
    timer.start();
  }

  function handleSwap(newExercise: { id: string; name: string; load_increment_kg: number }) {
    if (!player.current) return;
    const oldExerciseId = player.current.exerciseId;
    setPlannedSets((prev) =>
      prev.map((s) =>
        s.exerciseId === oldExerciseId
          ? { ...s, exerciseId: newExercise.id, exerciseName: newExercise.name, loadIncrementKg: newExercise.load_increment_kg }
          : s,
      ),
    );
  }

  async function handleFinish() {
    setFinishing(true);
    const res = await fetch(`/api/session/${sessionId}/finish`, { method: "POST" });
    setFinishing(false);
    if (res.ok) {
      router.push(`/train/session/${sessionId}/summary`);
    } else {
      push("Couldn't finish the session — try again.", "danger");
    }
  }

  if (player.isDone) {
    return (
      <div className="flex flex-col gap-4">
        <CompletedStack completed={player.completed} prSetIds={prSetIds} />
        <Button size="lg" disabled={finishing} onClick={handleFinish} className="w-full">
          {finishing ? "Finishing…" : "Finish session"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          Set {player.totalCount - player.remainingCount + 1} of {player.totalCount}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Plate calculator"
            onClick={() => setPlateSheetOpen(true)}
            className="flex size-11 items-center justify-center rounded-control text-ink-muted hover:text-ink-primary"
          >
            <Calculator size={20} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Swap exercise"
            onClick={() => setSwapSheetOpen(true)}
            className="flex size-11 items-center justify-center rounded-control text-ink-muted hover:text-ink-primary"
          >
            <Repeat size={20} aria-hidden />
          </button>
        </div>
      </div>

      <RestTimer timer={timer} />

      <AnimatePresence mode="wait">
        {player.current ? (
          <SetRow
            key={player.current.id}
            set={player.current}
            positionLabel={`Set ${player.currentSetPositionInExercise} of ${player.currentExerciseTotalSets}`}
            last={lastPerformance[player.current.exerciseId]}
            pending={player.pending}
            onLog={handleLog}
          />
        ) : null}
      </AnimatePresence>

      <CompletedStack completed={player.completed} prSetIds={prSetIds} />

      {player.current ? (
        <>
          <PlateCalculatorSheet open={plateSheetOpen} onOpenChange={setPlateSheetOpen} targetKg={player.current.targetLoadKg ?? 20} />
          <SwapExerciseSheet open={swapSheetOpen} onOpenChange={setSwapSheetOpen} currentExerciseId={player.current.exerciseId} onSwap={handleSwap} />
        </>
      ) : null}
    </div>
  );
}
