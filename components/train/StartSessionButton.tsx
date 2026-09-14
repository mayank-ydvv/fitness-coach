"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function StartSessionButton({ plannedWorkoutId }: { plannedWorkoutId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [starting, setStarting] = useState(false);

  async function start() {
    setStarting(true);
    const id = crypto.randomUUID(); // client-generated, per M0's UUID rule
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, plannedWorkoutId }),
    });
    setStarting(false);
    if (!res.ok) {
      push("Couldn't start the session — try again.", "danger");
      return;
    }
    router.push(`/train/session/${id}`);
  }

  return (
    <Button size="lg" onClick={start} loading={starting} className="w-full">
      Start session
    </Button>
  );
}
