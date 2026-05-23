import { listAttachmentsForNote } from "@/lib/db/queries";
import { AttachmentsUploader } from "./AttachmentsUploader";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function Attachments({
  noteId,
  userId,
}: {
  noteId: string;
  userId: string;
}) {
  const attachments = await listAttachmentsForNote(noteId, userId);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">Attachments</h2>

      {attachments.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No attachments yet.
        </p>
      ) : (
        <ul className="space-y-1 text-sm">
          {attachments.map((a) => {
            const filename = a.pathname.split("/").pop() ?? a.pathname;
            return (
              <li key={a.id}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  {filename}
                </a>
                <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                  {formatBytes(a.size)} · {a.contentType || "unknown"}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <AttachmentsUploader noteId={noteId} />
    </section>
  );
}
