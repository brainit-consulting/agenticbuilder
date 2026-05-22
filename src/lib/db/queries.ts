import { eq, desc, and } from "drizzle-orm";
import { db } from "./client";
import { notes, user, type Note, type User } from "./schema";

export async function getUserById(id: string): Promise<User | undefined> {
  const rows = await db.select().from(user).where(eq(user.id, id)).limit(1);
  return rows[0];
}

export async function listNotesForUser(userId: string): Promise<Note[]> {
  return db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.createdAt));
}

export async function getNoteForUser(
  noteId: string,
  userId: string,
): Promise<Note | undefined> {
  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .limit(1);
  return rows[0];
}

export async function createNote(input: {
  id: string;
  userId: string;
  title: string;
  body: string;
}): Promise<Note> {
  const [row] = await db.insert(notes).values(input).returning();
  return row;
}

export async function updateNoteForUser(
  noteId: string,
  userId: string,
  patch: { title?: string; body?: string },
): Promise<Note | undefined> {
  const [row] = await db
    .update(notes)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .returning();
  return row;
}

export async function deleteNoteForUser(
  noteId: string,
  userId: string,
): Promise<boolean> {
  const rows = await db
    .delete(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .returning({ id: notes.id });
  return rows.length > 0;
}
