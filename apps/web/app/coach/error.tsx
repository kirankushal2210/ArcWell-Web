"use client";

import Link from "next/link";
import { Button, buttonClass } from "@/components/ui";

/** A screen failed to load. Say what happened and offer the two useful next steps. */
export default function CoachError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center" role="alert">
      <p className="text-xl font-semibold">This screen didn&apos;t load</p>
      <p className="mt-2 text-base text-muted">Something went wrong while loading it. Your data is safe. Try again, or go back to Today.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/coach/today" className={buttonClass("secondary")}>
          Go to Today
        </Link>
      </div>
    </div>
  );
}
