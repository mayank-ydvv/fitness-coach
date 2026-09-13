/**
 * Pure unit conversions. No React, no formatting, no rounding decisions —
 * that's lib/units/format.ts. Never import this from a component directly
 * (eslint-enforced) — go through useMeasure() / lib/prefs/server.ts so unit
 * system and "hide calorie numbers" stay one consistent read.
 */

export function kgToLb(kg: number): number {
  return kg * 2.2046226218;
}
export function lbToKg(lb: number): number {
  return lb / 2.2046226218;
}

export function cmToIn(cm: number): number {
  return cm / 2.54;
}
export function inToCm(inches: number): number {
  return inches * 2.54;
}

/** cm -> whole feet + remaining inches (rounded to the nearest inch). The
 * ft/in UI holds this as a local draft and only commits to cm on blur —
 * round-tripping cm -> ft/in -> cm on every keystroke drifts. */
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cmToIn(cm));
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}
export function ftInToCm(feet: number, inches: number): number {
  return inToCm(feet * 12 + inches);
}
