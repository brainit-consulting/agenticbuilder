"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotesError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("notes error boundary:", error);
  }, [error]);

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-xl font-semibold">Something went wrong loading notes.</h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {error.message || "Unknown error."}
      </p>
      <div className="flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/dashboard">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
