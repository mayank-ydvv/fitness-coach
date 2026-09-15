/**
 * Pure. Rescales a meal item's kcal and all three macros linearly when the
 * user changes its gram amount (portion stepper or direct gram entry) —
 * spec §5: "Changing grams rescales kcal and all macros linearly." Also
 * rescales the kcal_low/kcal_high range so the range stays proportionate.
 */
export type RescalableItem = {
  grams: number | null;
  kcal: number;
  kcalLow: number | null;
  kcalHigh: number | null;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export function rescaleItemToGrams<T extends RescalableItem>(item: T, newGrams: number): T {
  if (!item.grams || item.grams <= 0 || newGrams <= 0) {
    // No baseline to scale from — just set grams, leave macros as-is.
    return { ...item, grams: newGrams };
  }
  const factor = newGrams / item.grams;
  return {
    ...item,
    grams: newGrams,
    kcal: round(item.kcal * factor),
    kcalLow: item.kcalLow !== null ? round(item.kcalLow * factor) : null,
    kcalHigh: item.kcalHigh !== null ? round(item.kcalHigh * factor) : null,
    proteinG: round1(item.proteinG * factor),
    carbsG: round1(item.carbsG * factor),
    fatG: round1(item.fatG * factor),
    fiberG: round1(item.fiberG * factor),
  };
}

function round(n: number) {
  return Math.round(n);
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}
