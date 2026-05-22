"use client";

import { useState } from "react";
import { deleteNoteAction } from "../_actions";
import { Button } from "@/components/ui/button";

export function DeleteButton({ noteId }: { noteId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  if (!confirming) {
    return (
      <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span>Sure?</span>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          await deleteNoteAction(noteId);
        }}
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
