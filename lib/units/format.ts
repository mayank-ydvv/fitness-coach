import type { UnitSystem } from "@/lib/types";
import { cmToFtIn, kgToLb } from "./convert";

export type Measure = {
  unitSystem: UnitSystem;
  hideEnergy: boolean;
  /** kg -> "72.4 kg" | "159.6 lb" */
  mass: (kg: number | null | undefined) => string | null;
  /** cm -> "175 cm" | "5'9"" */
  length: (cm: number | null | undefined) => string | null;
  /** kcal -> "620 kcal" | null when hideEnergy is on. This is the ONLY
   * function in the app that may decide whether a kcal number is shown —
   * <Metric> just renders whatever it returns. */
  energy: (kcal: number | null | undefined) => string | null;
  /** grams of a macro -> "42 g". Never hidden — hideEnergy only affects kcal. */
  macro: (grams: number | null | undefined) => string | null;
};

/** The single source both client (useMeasure) and server (lib/prefs/server)
 * build from, so SSR and the client always agree on what's shown. */
export function makeFormatter({
  unitSystem,
  hideEnergy,
}: {
  unitSystem: UnitSystem;
  hideEnergy: boolean;
}): Measure {
  return {
    unitSystem,
    hideEnergy,
    mass: (kg) => {
      if (kg === null || kg === undefined) return null;
      return unitSystem === "imperial" ? `${kgToLb(kg).toFixed(1)} lb` : `${kg.toFixed(1)} kg`;
    },
    length: (cm) => {
      if (cm === null || cm === undefined) return null;
      if (unitSystem === "imperial") {
        const { feet, inches } = cmToFtIn(cm);
        return `${feet}'${inches}"`;
      }
      return `${Math.round(cm)} cm`;
    },
    energy: (kcal) => {
      if (hideEnergy) return null;
      if (kcal === null || kcal === undefined) return null;
      return `${Math.round(kcal)} kcal`;
    },
    macro: (grams) => {
      if (grams === null || grams === undefined) return null;
      return `${Math.round(grams)} g`;
    },
  };
}
