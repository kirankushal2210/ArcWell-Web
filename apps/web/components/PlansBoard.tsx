"use client";

import { useState } from "react";
import type { Plan, PlanDay } from "@/lib/data";
import { formatRest, parseExerciseLines } from "@/lib/onboarding";
import { Avatar, Button, Card, Empty, inputClass } from "./ui";
import { Icon } from "./icons";

const STATUS: Record<Plan["status"], { label: string; pill: string }> = {
  none: { label: "Needs a plan", pill: "bg-tintBrand text-brandInk" },
  draft: { label: "Draft", pill: "bg-surface text-muted" },
  active: { label: "Active", pill: "bg-tintSuccess text-success" },
  ending: { label: "Ending", pill: "bg-tintWarning text-warning" },
};

export function PlansBoard({ plans }: { plans: Plan[] }) {
  const [openId, setOpenId] = useState<string | null>(plans.find((p) => p.status === "active")?.clientId ?? null);
  // Edits live in a copy keyed by client, so the shared sample data is never changed in place.
  const [edits, setEdits] = useState<Record<string, PlanDay[]>>({});
  const open = plans.find((p) => p.clientId === openId);
  const days = open ? edits[open.clientId] ?? open.days : [];

  const setDay = (i: number, day: PlanDay) => {
    if (!open) return;
    setEdits((e) => ({ ...e, [open.clientId]: days.map((d, k) => (k === i ? day : d)) }));
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="max-h-[calc(100vh-220px)] overflow-y-auto rounded-xl border border-line bg-card shadow-sm">
        <p className="sticky top-0 z-[1] flex items-center justify-between border-b border-line bg-surface px-4 py-2.5 text-sm font-medium text-muted">
          Clients
          <span className="tnum font-mono text-xs">{plans.length}</span>
        </p>
        <ul>
          {plans.slice(0, 24).map((p) => {
            const on = p.clientId === openId;
            const s = STATUS[p.status];
            return (
              <li key={p.clientId}>
                <button
                  onClick={() => setOpenId(p.clientId)}
                  aria-current={on ? "true" : undefined}
                  className={`relative flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors duration-[120ms] ease-quiet ${
                    on ? "bg-tintBrand" : "hover:bg-surface"
                  }`}
                >
                  {on ? <span className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden /> : null}
                  <Avatar name={p.clientName} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium">{p.clientName}</span>
                    {p.status === "none" ? (
                      <span className="block text-xs text-muted">No block yet</span>
                    ) : (
                      <span className="mt-1 flex items-center gap-2">
                        <span className="h-1 w-16 overflow-hidden rounded-full bg-raised" aria-hidden>
                          <span className="block h-full rounded-full bg-training" style={{ width: `${(p.week / p.weeks) * 100}%` }} />
                        </span>
                        <span className="tnum font-mono text-2xs text-muted">
                          wk {p.week}/{p.weeks}
                        </span>
                      </span>
                    )}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${s.pill}`}>{s.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {open ? (
        <div className="min-w-0 space-y-5">
          <Card className="flex flex-wrap items-center gap-4">
            <Avatar name={open.clientName} size={44} />
            <div className="min-w-0 flex-1">
              <p className="text-xl font-semibold tracking-[-0.015em]">{open.clientName}</p>
              <p className="tnum font-mono text-sm text-muted">
                {open.status === "none" ? "No block yet" : `Week ${open.week} of ${open.weeks}`} · {days.length} days ·{" "}
                {days.reduce((n, d) => n + d.exercises.length, 0)} exercises
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary">Clone</Button>
              <Button>Save plan</Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
            {days.map((day, di) => (
              <DayCard key={`${open.clientId}-${di}`} day={day} onChange={(d) => setDay(di, d)} />
            ))}
          </div>
          <p className="text-sm text-muted">Type a line like “Bench press 3x8-10 90s”, or paste several rows from a sheet at once.</p>
        </div>
      ) : (
        <Empty title="Pick a client" body="Choose a client on the left to open their plan." />
      )}
    </div>
  );
}

function DayCard({ day, onChange }: { day: PlanDay; onChange: (d: PlanDay) => void }) {
  const [line, setLine] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const id = `day-${day.name.replace(/\W+/g, "-")}`;

  const add = (text: string) => {
    const { exercises, errors: errs } = parseExerciseLines(text);
    if (exercises.length) onChange({ ...day, exercises: [...day.exercises, ...exercises] });
    setErrors(errs);
    if (!errs.length) setLine("");
  };

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-md font-semibold">{day.name}</p>
        <span className="tnum font-mono text-xs text-muted">{day.exercises.length} exercises</span>
      </div>
      <ul className="divide-y divide-line">
        {day.exercises.map((e, i) => (
          <li key={`${e.name}-${i}`} className="group flex items-center gap-3 px-5 py-2.5 text-base">
            <span className="tnum w-5 font-mono text-xs text-faint">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate">{e.name}</span>
            <span className="tnum font-mono text-sm text-ink">
              {e.sets} × {e.reps}
            </span>
            <span className="tnum w-14 text-right font-mono text-sm text-muted">{formatRest(e.restSec)}</span>
            <button
              type="button"
              onClick={() => onChange({ ...day, exercises: day.exercises.filter((_, j) => j !== i) })}
              className="grid h-6 w-6 place-items-center rounded-md text-faint opacity-0 transition-[opacity,background-color,color] duration-[120ms] ease-quiet hover:bg-surface hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
              aria-label={`Remove ${e.name} from ${day.name}`}
            >
              <Icon name="close" size={14} />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          add(line);
        }}
      >
        <label htmlFor={id} className="sr-only">
          Add an exercise to {day.name}
        </label>
        <input
          id={id}
          value={line}
          onChange={(e) => setLine(e.target.value)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (/\r?\n/.test(text.trim())) {
              e.preventDefault();
              add(text);
            }
          }}
          placeholder="Bench press 3x8-10 90s"
          aria-invalid={errors.length ? true : undefined}
          aria-describedby={errors.length ? `${id}-errors` : undefined}
          className={`${inputClass} h-9`}
        />
        <Button variant="secondary" type="submit">
          <Icon name="plus" size={14} /> Add
        </Button>
      </form>
      {errors.length ? (
        <ul id={`${id}-errors`} className="space-y-0.5 px-5 pb-3 text-sm text-danger" role="alert">
          {errors.map((er, k) => (
            <li key={k}>{er}</li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
