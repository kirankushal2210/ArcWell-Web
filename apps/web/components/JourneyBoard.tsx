"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Client, FormerClient, JourneyStage } from "@/lib/data";
import { JOURNEY_STAGES, journeyFlag, journeyView, longDate, monthsBetween, tenureLabel, type JourneyView } from "@/lib/domain";
import { AdherenceMeter, Avatar } from "./ui";

/* ------------------------------------------------------------------
   The coach's CRM view of every journey: one column per stage, plus
   the people who left and where. Cards that need the coach soon sort
   to the top and carry the brand.
   ------------------------------------------------------------------ */

const today = () => new Date().toISOString().slice(0, 10);

export function JourneyBoard({ clients, former }: { clients: Client[]; former: FormerClient[] }) {
  const columns = useMemo(() => {
    const byStage: Record<JourneyStage, { client: Client; view: JourneyView }[]> = {
      onboarding: [],
      transformation: [],
      maintenance: [],
      ongoing: [],
    };
    for (const c of clients) {
      const view = journeyView(c.journey);
      byStage[view.stage].push({ client: c, view });
    }
    // Urgent first, then furthest along.
    for (const k of Object.keys(byStage) as JourneyStage[]) {
      byStage[k].sort((a, b) => Number(b.view.next.urgent) - Number(a.view.next.urgent) || b.view.week - a.view.week);
    }
    return byStage;
  }, [clients]);

  const now = today();

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1040px] grid-cols-5 gap-3">
        {JOURNEY_STAGES.map((s) => (
          <section key={s.key} aria-labelledby={`col-${s.key}`} className="flex min-w-0 flex-col rounded-xl border border-line bg-surface">
            <header className="border-b border-line px-4 py-3">
              <h2 id={`col-${s.key}`} className="flex items-baseline justify-between gap-2 text-md font-semibold">
                {s.label}
                <span className="tnum font-mono text-sm font-normal text-muted">{columns[s.key].length}</span>
              </h2>
              <p className="text-xs text-muted">{s.hint}</p>
            </header>
            <ul className="max-h-[calc(100vh-430px)] min-h-[240px] space-y-2 overflow-y-auto p-2">
              {columns[s.key].length === 0 ? (
                <li className="px-2 py-6 text-center text-sm text-muted">Nobody at this stage</li>
              ) : (
                columns[s.key].map(({ client, view }) => {
                  const flag = journeyFlag(view);
                  return (
                    <li key={client.id}>
                      <Link
                        href={`/coach/clients/${client.id}`}
                        className={`group block rounded-lg border bg-card p-3 shadow-sm transition-[border-color,transform] duration-[120ms] ease-quiet hover:border-strong active:scale-[0.99] ${
                          flag ? "border-brand" : "border-line"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar name={client.name} size={30} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-medium group-hover:text-brandInk">{client.name}</p>
                            <p className="truncate text-xs text-muted">{client.goal}</p>
                          </div>
                        </div>
                        {view.totalWeeks ? (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised" aria-hidden>
                              <span className={`block h-full rounded-full ${flag ? "bg-brand" : "bg-ink"}`} style={{ width: `${view.pct ?? 0}%` }} />
                            </span>
                            <span className="tnum font-mono text-2xs text-muted">
                              wk {Math.min(view.week, view.totalWeeks)}/{view.totalWeeks}
                            </span>
                          </div>
                        ) : null}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="tnum font-mono text-2xs text-muted">with you {tenureLabel(monthsBetween(client.joined, now))}</span>
                          <AdherenceMeter value={client.adherence} showValue={false} />
                        </div>
                        {flag ? (
                          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-tintBrand px-2 py-0.5 text-xs font-medium text-brandInk">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                            {flag}
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        ))}

        <section aria-labelledby="col-left" className="flex min-w-0 flex-col rounded-xl border border-dashed border-strong bg-bg">
          <header className="border-b border-line px-4 py-3">
            <h2 id="col-left" className="flex items-baseline justify-between gap-2 text-md font-semibold">
              Left
              <span className="tnum font-mono text-sm font-normal text-muted">{former.length}</span>
            </h2>
            <p className="text-xs text-muted">Who stopped, at which stage, and why</p>
          </header>
          <ul className="max-h-[calc(100vh-430px)] min-h-[240px] space-y-2 overflow-y-auto p-2">
            {former.length === 0 ? (
              <li className="px-2 py-6 text-center text-sm text-muted">Nobody has left</li>
            ) : (
              [...former]
                .sort((a, b) => b.left.localeCompare(a.left))
                .map((f) => {
                  const stage = JOURNEY_STAGES.find((s) => s.key === f.stageAtExit)?.label ?? f.stageAtExit;
                  return (
                    <li key={f.id} className="rounded-lg border border-line bg-card p-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={f.name} size={30} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-medium text-muted">{f.name}</p>
                          <p className="truncate text-xs text-muted">{f.goal}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-ink">
                        Left during <span className="font-medium">{stage}</span>
                      </p>
                      <p className="mt-1 inline-flex rounded-full bg-surface px-2 py-0.5 text-xs text-muted">{f.reason}</p>
                      <p className="tnum mt-2 font-mono text-2xs text-faint">
                        {longDate(f.left)} · {tenureLabel(monthsBetween(f.joined, f.left))} with you
                      </p>
                    </li>
                  );
                })
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
