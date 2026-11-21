"use client";

import Link from "next/link";
import { useState } from "react";
import type { Client, Measurement, PhotoSet } from "@/lib/data";
import { RANGE_LABELS, inRange, longDate, measurementChange, weighInDates, type Range } from "@/lib/domain";
import { Card, Pills, buttonClass } from "./ui";
import { LineChart } from "./charts";
import { Icon } from "./icons";
import { Lightbox, PhotoFrame } from "./Lightbox";

/** The weight chart with a range selector: 4 weeks, 12 weeks or everything logged. */
export function WeightCard({ client }: { client: Client }) {
  const [range, setRange] = useState<Range>("12w");
  const dates = weighInDates(client);
  const view = inRange(client.weights, dates, range);
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Weight trend</h2>
          <p className="text-sm text-muted">
            {view.values.length} weigh-ins logged in the app · dashed line is the goal
            {view.short ? ` · only ${client.weights.length} logged so far` : ""}
          </p>
        </div>
        <Pills<Range>
          value={range}
          onChange={setRange}
          label="Range"
          options={(Object.keys(RANGE_LABELS) as Range[]).map((k) => ({ key: k, label: RANGE_LABELS[k] }))}
        />
      </div>
      <LineChart
        key={range}
        values={view.values}
        target={client.targetKg}
        startLabel={view.dates[0] ? longDate(view.dates[0]) : "First weigh-in"}
        endLabel={view.dates[view.dates.length - 1] ? longDate(view.dates[view.dates.length - 1] as string) : "Latest"}
      />
    </Card>
  );
}

/** Each measurement as its own small trend, so waist and arms can move in different directions. */
export function Measurements({ items }: { items: Measurement[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <p className="text-md font-semibold">No measurements yet</p>
        <p className="mt-1 text-base text-muted">Measurements appear here once the client logs them in the app, usually every three weeks from the start of the transformation.</p>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((m) => {
        const change = measurementChange(m);
        const last = m.entries[m.entries.length - 1];
        return (
          <Card key={m.label} className="pb-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-md font-semibold">{m.label}</p>
              <p className="tnum font-mono text-sm">
                <span className="text-lg font-medium">{last?.value}</span> {m.unit}
                {change !== null && change !== 0 ? (
                  <span className={`ml-2 ${change < 0 ? "text-success" : "text-muted"}`}>
                    {change > 0 ? "+" : ""}
                    {change} {m.unit}
                  </span>
                ) : null}
              </p>
            </div>
            <LineChart
              values={m.entries.map((e) => e.value)}
              height={130}
              unit={m.unit}
              label={`${m.label} trend`}
              startLabel={m.entries[0] ? longDate(m.entries[0].date) : ""}
              endLabel={last ? longDate(last.date) : ""}
            />
          </Card>
        );
      })}
    </div>
  );
}

/** Progress photos in date order; each opens full size. */
export function PhotoStrip({ sets, name }: { sets: PhotoSet[]; name: string }) {
  const items = sets.flatMap((s) => s.angles.map((a) => ({ title: a, caption: longDate(s.date) })));
  const [open, setOpen] = useState<number | null>(null);
  if (sets.length === 0) {
    return (
      <Card>
        <p className="text-md font-semibold">No progress photos yet</p>
        <p className="mt-1 text-base text-muted">{name} adds photos from the app with each monthly check-in.</p>
      </Card>
    );
  }
  let n = -1;
  return (
    <Card className="p-0">
      <div className="flex gap-6 overflow-x-auto p-5">
        {sets.map((s) => (
          <figure key={s.date} className="shrink-0">
            <figcaption className="tnum mb-2 font-mono text-sm text-muted">{longDate(s.date)}</figcaption>
            <div className="flex gap-2">
              {s.angles.map((a) => {
                n += 1;
                const idx = n;
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setOpen(idx)}
                    aria-label={`${a} photo from ${longDate(s.date)}, open full size`}
                    className="grid h-32 w-24 place-items-center rounded-lg border border-line bg-surface transition-[border-color,transform] duration-[120ms] ease-quiet hover:border-strong active:scale-[0.97]"
                  >
                    <PhotoFrame label={a} />
                  </button>
                );
              })}
            </div>
          </figure>
        ))}
      </div>
      {open !== null ? <Lightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} /> : null}
    </Card>
  );
}

export function ReportLink({ clientId }: { clientId: string }) {
  return (
    <Link href={`/coach/clients/${clientId}/report`} className={buttonClass("secondary")}>
      <Icon name="send" size={14} /> Share progress report
    </Link>
  );
}
