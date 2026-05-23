import { z } from "zod";

export const noteInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().max(50_000).default(""),
});

export type NoteInput = z.infer<typeof noteInputSchema>;
