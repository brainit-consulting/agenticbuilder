"use client";

import { useRouter } from "next/navigation";
import { FileUpload } from "@/app/(app)/_components/FileUpload";

export function AttachmentsUploader({ noteId }: { noteId: string }) {
  const router = useRouter();
  return (
    <FileUpload
      endpoint={`/api/upload?noteId=${encodeURIComponent(noteId)}`}
      onUploaded={() => {
        router.refresh();
      }}
    />
  );
}
