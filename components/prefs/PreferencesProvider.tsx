"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { UnitSystem } from "@/lib/types";
import { makeFormatter, type Measure } from "@/lib/units/format";

type PreferencesContextValue = {
  measure: Measure;
  setUnitSystem: (unitSystem: UnitSystem) => void;
  setHideEnergy: (hideEnergy: boolean) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/** Client-side counterpart to lib/prefs/server.ts. Seeded from the server
 * component's initial read (see app/(app)/layout.tsx) so there's no flash
 * of the wrong units/visible-kcal on mount; local setters here are called
 * optimistically by the settings panel while the PATCH to /api/profile is
 * in flight. */
export function PreferencesProvider({
  initialUnitSystem,
  initialHideEnergy,
  children,
}: {
  initialUnitSystem: UnitSystem;
  initialHideEnergy: boolean;
  children: ReactNode;
}) {
  const [unitSystem, setUnitSystem] = useState(initialUnitSystem);
  const [hideEnergy, setHideEnergy] = useState(initialHideEnergy);

  const measure = useMemo(() => makeFormatter({ unitSystem, hideEnergy }), [unitSystem, hideEnergy]);

  return (
    <PreferencesContext.Provider value={{ measure, setUnitSystem, setHideEnergy }}>
      {children}
    </PreferencesContext.Provider>
  );
}

/** The only way a client component should turn a stored number into
 * display text. Throws outside a PreferencesProvider so a missing provider
 * fails loudly instead of silently defaulting to metric/visible-kcal. */
export function useMeasure(): Measure {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("useMeasure must be used within <PreferencesProvider>");
  return ctx.measure;
}

export function usePreferencesControls() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferencesControls must be used within <PreferencesProvider>");
  return { setUnitSystem: ctx.setUnitSystem, setHideEnergy: ctx.setHideEnergy };
}
