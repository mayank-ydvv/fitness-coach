"use client";

import { useMemo, useState } from "react";
import { TextInput } from "@/components/ui/TextInput";
import { StatusDot } from "@/components/ui/StatusDot";
import { EQUIPMENT, type Equipment } from "@/lib/types";
import { cn } from "@/lib/cn";
import type { Tables } from "@/lib/supabase/database.types";

type ExerciseRow = Tables<"exercises">;

/** Search + equipment filter chips over the full library, fetched once and
 * cached forever client-side (it's global read-only reference data). */
export function ExerciseLibrary({ exercises }: { exercises: ExerciseRow[] }) {
  const [query, setQuery] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState<Equipment | null>(null);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (equipmentFilter && ex.equipment !== equipmentFilter) return false;
      if (query && !ex.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [exercises, query, equipmentFilter]);

  return (
    <div className="flex flex-col gap-4">
      <TextInput placeholder="Search exercises…" value={query} onChange={(e) => setQuery(e.target.value)} />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEquipmentFilter(null)}
          className={cn("min-h-9 rounded-full border px-3 text-sm", equipmentFilter === null ? "border-load-blue bg-load-blue-soft text-ink-primary" : "border-hairline text-ink-muted")}
        >
          All
        </button>
        {EQUIPMENT.map((eq) => (
          <button
            key={eq}
            type="button"
            onClick={() => setEquipmentFilter(eq)}
            className={cn("min-h-9 rounded-full border px-3 text-sm capitalize", equipmentFilter === eq ? "border-load-blue bg-load-blue-soft text-ink-primary" : "border-hairline text-ink-muted")}
          >
            {eq}
          </button>
        ))}
      </div>

      <div className="flex flex-col divide-y divide-hairline rounded-card border border-hairline bg-surface-raised">
        {filtered.map((ex) => (
          <div key={ex.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink-primary">{ex.name}</p>
              <p className="text-xs capitalize text-ink-muted">
                {ex.primary_muscle} · {ex.equipment}
              </p>
            </div>
            {ex.form_rules ? <StatusDot tone="load-blue" label="Form check" /> : null}
          </div>
        ))}
        {filtered.length === 0 ? <p className="p-4 text-sm text-ink-muted">No exercises match.</p> : null}
      </div>
    </div>
  );
}
