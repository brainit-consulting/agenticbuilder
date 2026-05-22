"use client";

import { useState } from "react";
import { deleteNoteAction } from "../_actions";
import { Button } from "@/components/ui/button";

export function DeleteButton({ noteId }: { noteId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
        Delete
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex items-center gap-2">
        <span>Sure?</span>
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError(null);
            try {
              await deleteNoteAction(noteId);
            } catch (e) {
              // next/navigation's redirect() throws NEXT_REDIRECT to signal
              // success; that error must propagate so the redirect happens.
              if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
              setPending(false);
              setError(e instanceof Error ? e.message : "Delete failed");
            }
          }}
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
