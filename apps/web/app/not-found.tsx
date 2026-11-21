import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { BrandMark } from "@/components/Sidebar";

export const metadata = { title: "Page not found — Arcwell" };

/** Any unknown address lands here, never on a blank page. */
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6">
      <div className="max-w-md text-center">
        <div className="flex justify-center">
          <BrandMark size={40} />
        </div>
        <p className="tnum mt-6 font-mono text-sm text-muted">404</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">This page doesn&apos;t exist</h1>
        <p className="mt-2 text-md text-muted">The address may be mistyped, or the client or plan it pointed to was removed.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/coach/today" className={buttonClass("primary")}>
            Go to Today
          </Link>
          <Link href="/coach" className={buttonClass("secondary")}>
            All clients
          </Link>
        </div>
      </div>
    </main>
  );
}
