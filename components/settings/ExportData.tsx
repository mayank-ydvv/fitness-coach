"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

/** Full data export, two taps from Settings (spec §12). Fetches the JSON
 * itself (rather than a plain <a href="/api/export">) so the button can
 * show a "Preparing…" state and a toast on failure instead of the browser
 * just... doing something with a raw 500 response. */
export function ExportData() {
  const { push } = useToast();
  const [downloading, setDownloading] = useState(false);

  async function handleExport() {
    setDownloading(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fitness-coach-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      push("Couldn't build your export — try again.", "danger");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-ink-primary">Export your data</p>
        <p className="text-sm text-ink-muted">Everything you&apos;ve logged, as a JSON file.</p>
      </div>
      <Button variant="secondary" onClick={handleExport} disabled={downloading}>
        {downloading ? "Preparing…" : "Export"}
      </Button>
    </div>
  );
}
