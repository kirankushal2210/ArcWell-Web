import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { CLIENTS, COACH } from "@/lib/data";
import { planUsage } from "@/lib/domain";

// Every coach screen shows relative dates and journey weeks, so it renders per request rather
// than once at build time, which would freeze "today" to the day of the build.
export const dynamic = "force-dynamic";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const usage = planUsage(CLIENTS, COACH.clientLimit);
  return (
    <div className="flex h-screen overflow-hidden print:block print:h-auto print:overflow-visible">
      <div className="hidden lg:flex print:hidden">
        <Sidebar coach={COACH} usage={usage} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden print:overflow-visible">
        <Topbar coachName={COACH.name} />
        <main className="flex-1 overflow-y-auto print:overflow-visible">
          <div className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-8 sm:py-8">{children}</div>
          <div className="h-10" />
        </main>
      </div>
    </div>
  );
}
