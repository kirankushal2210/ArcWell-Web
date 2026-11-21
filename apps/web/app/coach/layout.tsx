import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { MobileNav, OfflineBanner } from "@/components/MobileNav";
import { CLIENTS, COACH } from "@/lib/data";
import { planUsage } from "@/lib/domain";

// Every coach screen shows relative dates and journey weeks, so it renders per request rather
// than once at build time, which would freeze "today" to the day of the build.
export const dynamic = "force-dynamic";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const usage = planUsage(CLIENTS, COACH.clientLimit);
  return (
    <div className="flex h-screen overflow-hidden print:block print:h-auto print:overflow-visible">
      <a href="#main" className="sr-only z-50 rounded-lg bg-ink px-3 py-2 text-card focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <div className="hidden lg:flex print:hidden">
        <Sidebar coach={COACH} usage={usage} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden print:overflow-visible">
        <Topbar coachName={COACH.name} />
        <OfflineBanner />
        <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto outline-none print:overflow-visible">
          <div className="mx-auto w-full max-w-[1360px] px-4 py-6 pb-24 sm:px-8 sm:py-8 lg:pb-8">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
