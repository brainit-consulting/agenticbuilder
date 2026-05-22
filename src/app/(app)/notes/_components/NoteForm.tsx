"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createNoteAction, updateNoteAction } from "../_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode =
  | { mode: "create" }
  | { mode: "edit"; noteId: string; initialTitle: string; initialBody: string };

export function NoteForm(props: Mode) {
  const router = useRouter();
  const [title, setTitle] = useState(props.mode === "edit" ? props.initialTitle : "");
  const [body, setBody] = useState(props.mode === "edit" ? props.initialBody : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData();
    fd.set("title", title);
    fd.set("body", body);

    if (props.mode === "create") {
      const res = await createNoteAction(fd);
      // createNoteAction redirects on success; if it returns, it failed.
      setPending(false);
      if (res && !res.ok) {
        setError(res.error);
      }
      return;
    }

    const res = await updateNoteAction(props.noteId, fd);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="body">Body</Label>
        <textarea
          id="body"
          name="body"
          rows={10}
          className="flex w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:border-neutral-700 dark:focus-visible:outline-white"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : props.mode === "create" ? "Create note" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
