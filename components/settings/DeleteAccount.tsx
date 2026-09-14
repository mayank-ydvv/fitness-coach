"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

/** Two-step confirm, types the word DELETE — an irreversible, cascading
 * action gets real friction, not a single click. */
export function DeleteAccount() {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
    setDeleting(false);
    if (!res.ok) {
      push("Couldn't delete your account — try again.", "danger");
      return;
    }
    router.push("/");
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-left text-sm text-action-danger underline underline-offset-2">
        Delete account
      </button>
      <Sheet open={open} onOpenChange={setOpen} title="Delete your account">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">
            This permanently deletes every meal, workout, habit, and form check you&apos;ve logged. There&apos;s no undo.
            Export your data first if you want to keep it.
          </p>
          <Field label='Type "DELETE" to confirm' htmlFor="delete-confirm">
            <TextInput id="delete-confirm" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="DELETE" />
          </Field>
          <Button variant="danger" disabled={confirmation !== "DELETE" || deleting} onClick={handleDelete} className="w-full">
            {deleting ? "Deleting…" : "Permanently delete my account"}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
