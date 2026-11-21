import type { JourneyView, StageView } from "@/lib/domain";
import { longDate, relativeDay } from "@/lib/domain";
import { Card } from "./ui";
import { Icon } from "./icons";

/* ------------------------------------------------------------------
   The client's journey with the coach: onboarding, transformation,
   maintenance, ongoing coaching. Done stages are ink, the current stage
   carries the brand and fills to how far through it the client is,
   stages ahead stay neutral with their planned start.
   ------------------------------------------------------------------ */

function stageDate(s: StageView): string {
  if (!s.start) return s.key === "transformation" ? "Starts with the first plan" : "Not planned yet";
  if (s.state === "upcoming") return `Planned ${longDate(s.start)}`;
  return `From ${longDate(s.start)}`;
}

/** The compact track for the profile header. */
export function JourneyTrack({ view }: { view: JourneyView }) {
  return (
    <div>
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:gap-2" aria-label="Client journey">
        {view.stages.map((s, i) => {
          const fill = s.state === "done" ? 100 : s.state === "current" ? view.pct ?? 100 : 0;
          return (
            <li key={s.key} aria-current={s.state === "current" ? "step" : undefined} className="min-w-0">
              <div className="h-2 overflow-hidden rounded-full bg-raised" aria-hidden>
                <div
                  className={`h-full rounded-full ${s.state === "done" ? "bg-ink" : "bg-brand"}`}
                  style={{ width: `${fill}%` }}
                />
              </div>
              <div className="mt-2 flex items-start gap-2">
                <span
                  className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full text-2xs font-semibold ${
                    s.state === "done"
                      ? "bg-ink text-card"
                      : s.state === "current"
                        ? "bg-brand text-onBrand"
                        : "border border-strong text-muted"
                  }`}
                  aria-hidden
                >
                  {s.state === "done" ? <Icon name="check" size={11} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block truncate text-base ${s.state === "upcoming" ? "text-muted" : "font-semibold text-ink"}`}>
                    {s.label}
                    <span className="sr-only">
                      {s.state === "done" ? " (done)" : s.state === "current" ? " (current stage)" : " (ahead)"}
                    </span>
                  </span>
                  <span className="tnum block truncate font-mono text-xs text-muted">
                    {s.state === "current" && view.totalWeeks ? `Week ${Math.min(view.week, view.totalWeeks)} of ${view.totalWeeks}` : stageDate(s)}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <p
        className={`mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-base ${
          view.next.urgent ? "bg-tintBrand text-ink" : "bg-surface text-ink"
        }`}
      >
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${view.next.urgent ? "bg-brand" : "bg-success"}`} aria-hidden />
        <span>
          <span className="sr-only">{view.next.urgent ? "Needs action: " : "Next: "}</span>
          {view.next.text}
        </span>
      </p>
    </div>
  );
}

/** The full Journey tab: where they are, each stage in detail, and every milestone by date. */
export function JourneyDetail({ view, startKg, latestKg, targetKg }: { view: JourneyView; startKg: number | null; latestKg: number | null; targetKg: number | null }) {
  const current = view.stages.find((s) => s.state === "current");
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="p-0">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-lg font-semibold">Milestones</h2>
          <p className="text-sm text-muted">Past dates are what happened; the rest is the plan from today</p>
        </div>
        <ol className="px-6 py-4">
          {view.milestones.map((m, i) => {
            const last = i === view.milestones.length - 1;
            const nextUp = m.state === "upcoming" && view.milestones[i - 1]?.state !== "upcoming";
            return (
              <li key={`${m.date}-${m.label}`} className="relative flex gap-4 pb-6 last:pb-0">
                {!last ? (
                  <span
                    className={`absolute left-[9px] top-6 h-[calc(100%-20px)] w-0.5 ${m.state === "done" && view.milestones[i + 1]?.state === "done" ? "bg-ink" : "bg-line"}`}
                    aria-hidden
                  />
                ) : null}
                <span
                  className={`relative mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                    m.state === "done" ? "bg-ink text-card" : nextUp ? "border-2 border-brand bg-card" : "border-2 border-strong bg-card"
                  }`}
                  aria-hidden
                >
                  {m.state === "done" ? <Icon name="check" size={11} /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-3">
                    <span className={`text-md ${m.state === "done" ? "font-medium" : "text-muted"}`}>{m.label}</span>
                    {nextUp ? (
                      <span className="rounded-full bg-tintBrand px-2 py-0.5 text-xs font-medium text-brandInk">Next</span>
                    ) : null}
                  </p>
                  {m.detail ? <p className="text-sm text-muted">{m.detail}</p> : null}
                </div>
                <div className="tnum shrink-0 text-right font-mono text-sm">
                  <p className={m.state === "done" ? "text-ink" : "text-muted"}>{longDate(m.date)}</p>
                  <p className="text-xs text-faint">{relativeDay(m.date)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="space-y-4">
        <Card>
          <p className="text-sm text-muted">Current stage</p>
          <p className="mt-1 text-xl font-semibold tracking-[-0.015em]">{current?.label}</p>
          <p className="text-sm text-muted">{current?.hint}</p>
          {view.totalWeeks ? (
            <>
              <div className="mt-4 flex items-baseline justify-between text-sm">
                <span className="tnum font-mono">
                  Week {Math.min(view.week, view.totalWeeks)} of {view.totalWeeks}
                </span>
                <span className="tnum font-mono text-muted">
                  {view.weeksLeft} {view.weeksLeft === 1 ? "week" : "weeks"} left
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-raised" aria-hidden>
                <div className="h-full rounded-full bg-brand" style={{ width: `${view.pct ?? 0}%` }} />
              </div>
            </>
          ) : (
            <p className="tnum mt-4 font-mono text-sm">
              Week {view.week} of {current?.label.toLowerCase()}
            </p>
          )}
        </Card>

        <Card>
          <p className="mb-3 text-md font-semibold">Result so far</p>
          <dl className="space-y-2.5 text-base">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">First weigh-in</dt>
              <dd className="tnum font-mono">{startKg === null ? "—" : `${startKg} kg`}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Latest</dt>
              <dd className="tnum font-mono">{latestKg === null ? "—" : `${latestKg} kg`}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Goal</dt>
              <dd className="tnum font-mono">{targetKg === null ? "—" : `${targetKg} kg`}</dd>
            </div>
          </dl>
          {startKg === null ? <p className="mt-3 text-sm text-muted">Weigh-ins appear once the client logs them in the app.</p> : null}
        </Card>
      </div>
    </div>
  );
}
