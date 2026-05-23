import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireSession } from "@/lib/auth/roles";
import { uploadBlob } from "@/lib/blob";
import {
  createAttachment,
  getNoteForUser,
} from "@/lib/db/queries";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await requireSession();
  const userId = session.user.id;

  const url = new URL(req.url);
  const noteId = url.searchParams.get("noteId");

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'file' field" }, { status: 400 });
  }

  // If a noteId is supplied, confirm the caller owns the note before we even
  // upload — keeps the namespace tight and avoids stray blobs on bad input.
  if (noteId) {
    const note = await getNoteForUser(noteId, userId);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
  }

  const { url: blobUrl, pathname } = await uploadBlob(userId, file);

  if (noteId) {
    const attachment = await createAttachment({
      id: nanoid(),
      userId,
      noteId,
      url: blobUrl,
      pathname,
      size: file.size,
      contentType: file.type || "application/octet-stream",
    });
    return NextResponse.json({
      id: attachment.id,
      url: blobUrl,
      pathname,
      size: attachment.size,
      contentType: attachment.contentType,
    });
  }

  return NextResponse.json({
    url: blobUrl,
    pathname,
    size: file.size,
    contentType: file.type || "application/octet-stream",
  });
}
