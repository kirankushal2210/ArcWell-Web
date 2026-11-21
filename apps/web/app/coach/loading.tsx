import { Skeleton } from "@/components/ui";

/** Shown while a coach screen loads: the frame stays put, the content area shows its shape. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-6 h-9 w-48 rounded-lg bg-surface" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-surface" />
        ))}
      </div>
      <Skeleton lines={8} />
    </div>
  );
}
