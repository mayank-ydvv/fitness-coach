/** Plate calculator: target load + bar weight -> plates per side. */
export type PlateResult = {
  perSide: number[]; // e.g. [20, 10, 2.5]
  achievedKg: number;
  exact: boolean;
};

const DEFAULT_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

export function platesPerSide(targetKg: number, barKg: number, availablePlatesKg: number[] = DEFAULT_PLATES_KG): PlateResult {
  const perSideNeeded = (targetKg - barKg) / 2;
  if (perSideNeeded <= 0) return { perSide: [], achievedKg: barKg, exact: targetKg === barKg };

  const sorted = [...availablePlatesKg].sort((a, b) => b - a);
  const perSide: number[] = [];
  let remaining = perSideNeeded;
  for (const plate of sorted) {
    while (remaining >= plate - 1e-6) {
      perSide.push(plate);
      remaining -= plate;
    }
  }
  const achievedKg = barKg + perSide.reduce((s, p) => s + p, 0) * 2;
  return { perSide, achievedKg, exact: Math.abs(achievedKg - targetKg) < 0.01 };
}
