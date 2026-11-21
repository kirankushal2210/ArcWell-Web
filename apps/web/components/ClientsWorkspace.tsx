"use client";

import { useMemo, useState } from "react";
import type { Client, FormerClient, JourneyStage } from "@/lib/data";
import { JOURNEY_STAGES, journeyFlag, journeyView, longDate, retentionSummary } from "@/lib/domain";
import { ClientsTable } from "./ClientsTable";
import { JourneyBoard } from "./JourneyBoard";
import { Icon } from "./icons";

type View = "table" | "journey";

/**
 * The coach's client CRM: a stage strip that doubles as a filter, the retention figures that
 * matter after a transformation, and two views of the same people, a table and a journey board.
 */
export function ClientsWorkspace({ clients, former }: { clients: Client[]; former: FormerClient[] }) {
  const [view, setView] = useState<View>("table");
  const [stage, setStage] = useState<JourneyStage | "all">("all");

  const strip = useMemo(() => {
    const counts: Record<JourneyStage, { total: number; urgent: number }> = {
      onboarding: { total: 0, urgent: 0 },
      transformation: { total: 0, urgent: 0 },
      maintenance: { total: 0, urgent: 0 },
      ongoing: { total: 0, urgent: 0 },
    };
    for (const c of clients) {
      const v = journeyView(c.journey);
      counts[v.stage].total += 1;
      if (journeyFlag(v)) counts[v.stage].urgent += 1;
    }
    return counts;
  }, [clients]);
  const retention = useMemo(() => retentionSummary(clients, former), [clients, former]);

  const urgentLabel: Record<JourneyStage, string> = {
    onboarding: "need a first plan",
    transformation: "ending within 3 weeks",
    maintenance: "ending soon",
    ongoing: "",
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Clients</h1>
          <p className="mt-1 text-md text-muted">Everyone you coach, where they are in their journey, and who needs you</p>
        </div>
        <div className="inline-flex rounded-xl border border-line bg-card p-1 shadow-sm" role="tablist" aria-label="View">
          {(["table", "journey"] as View[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-base transition-[background-color,color,transform] duration-[120ms] ease-quiet active:scale-[0.97] ${
                view === v ? "bg-ink font-medium text-card" : "text-muted hover:bg-surface hover:text-ink"
              }`}
            >
              <Icon name={v === "table" ? "table" : "board"} size={15} />
              {v === "table" ? "Table" : "Journey board"}
            </button>
          ))}
        </div>
      </div>

      {/* Stage strip: counts per stage. In the table view each one filters the list. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {JOURNEY_STAGES.map((s) => {
          const on = stage === s.key;
          const c = strip[s.key];
          const body = (
            <>
              <span className="flex items-center justify-between gap-2 text-sm text-muted">
                {s.label}
                {on ? <Icon name="check" size={14} className="text-brandInk" /> : null}
              </span>
              <span className="tnum mt-1 block font-mono text-2xl font-medium">{c.total}</span>
              <span className={`mt-0.5 block text-xs ${c.urgent ? "font-medium text-brandInk" : "text-muted"}`}>
                {c.urgent ? `${c.urgent} ${urgentLabel[s.key]}` : s.hint}
              </span>
            </>
          );
          return view === "table" ? (
            <button
              key={s.key}
              type="button"
              aria-pressed={on}
              onClick={() => setStage(on ? "all" : s.key)}
              className={`rounded-xl border px-4 py-3 text-left shadow-sm transition-[border-color,background-color,transform] duration-[120ms] ease-quiet active:scale-[0.98] ${
                on ? "border-brand bg-tintBrand" : "border-line bg-card hover:border-strong"
              }`}
            >
              {body}
            </button>
          ) : (
            <div key={s.key} className="rounded-xl border border-line bg-card px-4 py-3 shadow-sm">
              {body}
            </div>
          );
        })}
        <div className="col-span-2 rounded-xl border border-ink bg-ink px-4 py-3 text-card shadow-sm md:col-span-1">
          <span className="block text-sm opacity-75">Stayed after transformation</span>
          <span className="tnum mt-1 block font-mono text-2xl font-medium">
            {retention.stayedAfterTransformationPct === null ? "—" : `${retention.stayedAfterTransformationPct}%`}
          </span>
          <span className="mt-0.5 block text-xs opacity-75">
            {retention.finishedTransformation
              ? `${retention.stayedAfterTransformation} of ${retention.finishedTransformation} who finished · ${retention.former} left in total`
              : "Nobody has finished a transformation yet"}
          </span>
        </div>
      </div>

      <div className="mb-5 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        {retention.longest ? (
          <span>
            With you longest: <span className="font-medium text-ink">{retention.longest.name}</span>, since{" "}
            <span className="tnum font-mono">{longDate(retention.longest.since)}</span>
          </span>
        ) : null}
        {view === "table" && stage !== "all" ? (
          <button type="button" onClick={() => setStage("all")} className="inline-flex items-center gap-1 font-medium text-brandInk hover:underline">
            <Icon name="close" size={13} /> Showing {JOURNEY_STAGES.find((s) => s.key === stage)?.label.toLowerCase()} only
          </button>
        ) : null}
      </div>

      {view === "table" ? <ClientsTable clients={clients} stage={stage} /> : <JourneyBoard clients={clients} former={former} />}
    </div>
  );
}
