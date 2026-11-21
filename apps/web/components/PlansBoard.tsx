"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Plan, PlanDay, PlanTemplate } from "@/lib/data";
import {
  PLAN_FILTER_LABELS,
  cloneDays,
  moveItem,
  planDiff,
  planNextAction,
  sortPlans,
  type PlanFilter,
} from "@/lib/domain";
import { parseExerciseLines } from "@/lib/onboarding";
import { Avatar, Button, Card, Empty, Pills, inputClass } from "./ui";
import { Icon } from "./icons";
import { useOnline, useUnsavedGuard } from "./hooks";

type LibraryItem = { name: string; muscle: string; equipment: string; demo: boolean };

const STATUS: Record<Plan["status"], { label: string; pill: string }> = {
  none: { label: "Needs a plan", pill: "bg-tintBrand text-brandInk" },
  draft: { label: "Draft", pill: "bg-surface text-muted" },
  active: { label: "Active", pill: "bg-tintSuccess text-success" },
  ending: { label: "Ending", pill: "bg-tintWarning text-warning" },
};

const DRAFT_KEY = (id: string) => `arcwell.plan-draft.${id}`;
const same = (a: PlanDay[], b: PlanDay[]) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Plans board and builder. The board lists every client by who needs planning first; the
 * builder edits a week as day columns. Edits autosave as a draft in this browser and only
 * count once saved; a saved plan is what the client sees in the Arcwell app.
 */
export function PlansBoard({ plans, templates, library }: { plans: Plan[]; templates: PlanTemplate[]; library: LibraryItem[] }) {
  const online = useOnline();
  const [filter, setFilter] = useState<PlanFilter>("all");
  const list = useMemo(() => sortPlans(plans, filter), [plans, filter]);
  const [openId, setOpenId] = useState<string | null>(list[0]?.clientId ?? null);
  const [saved, setSaved] = useState<Record<string, PlanDay[]>>(() =>
    Object.fromEntries(plans.map((p) => [p.clientId, p.status === "none" ? [] : cloneDays(p.days)])),
  );
  const [drafts, setDrafts] = useState<Record<string, PlanDay[]>>({});
  const [weekOverride, setWeekOverride] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<{ kind: "saved" | "failed" | "info"; text: string } | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);

  const open = plans.find((p) => p.clientId === openId);
  const base = open ? saved[open.clientId] ?? [] : [];
  const days = open ? drafts[open.clientId] ?? base : [];
  const dirty = open ? !same(days, base) : false;
  const anyDirty = plans.some((p) => drafts[p.clientId] && !same(drafts[p.clientId] as PlanDay[], saved[p.clientId] ?? []));
  useUnsavedGuard(anyDirty);

  // Restore an autosaved draft for this client from the browser, if one is there.
  useEffect(() => {
    if (!open || drafts[open.clientId]) return;
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY(open.clientId));
      if (raw) setDrafts((d) => ({ ...d, [open.clientId]: JSON.parse(raw) as PlanDay[] }));
    } catch {
      // Storage can be unavailable; the builder still works without the autosave.
    }
    setShowDiff(false);
    setStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.clientId]);

  const setDays = (next: PlanDay[]) => {
    if (!open) return;
    setDrafts((d) => ({ ...d, [open.clientId]: next }));
    setStatus(null);
    try {
      window.sessionStorage.setItem(DRAFT_KEY(open.clientId), JSON.stringify(next));
    } catch {
      // See above.
    }
  };

  const save = () => {
    if (!open) return;
    if (!online) {
      setStatus({ kind: "failed", text: "Couldn't save: you're offline. Your edits are kept here; save again when you're back online." });
      return;
    }
    setSaved((s) => ({ ...s, [open.clientId]: cloneDays(days) }));
    setDrafts((d) => {
      const n = { ...d };
      delete n[open.clientId];
      return n;
    });
    try {
      window.sessionStorage.removeItem(DRAFT_KEY(open.clientId));
    } catch {
      // See above.
    }
    setStatus({ kind: "saved", text: `Saved. This week now shows in ${open.clientName.split(" ")[0]}'s Arcwell app.` });
  };

  const diff = useMemo(() => planDiff(base, days), [base, days]);
  const exerciseTotal = days.reduce((n, d) => n + d.exercises.length, 0);
  const week = open ? weekOverride[open.clientId] ?? open.week : 0;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="flex max-h-[calc(100vh-200px)] flex-col overflow-hidden rounded-xl border border-line bg-card shadow-sm">
        <div className="border-b border-line p-2">
          <Pills<PlanFilter>
            value={filter}
            onChange={setFilter}
            label="Filter plans"
            options={(Object.keys(PLAN_FILTER_LABELS) as PlanFilter[]).map((k) => ({ key: k, label: PLAN_FILTER_LABELS[k], count: sortPlans(plans, k).length }))}
          />
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {list.length === 0 ? <li className="px-4 py-6 text-center text-sm text-muted">Nobody in this filter.</li> : null}
          {list.map((p) => {
            const on = p.clientId === openId;
            const s = STATUS[p.status];
            const next = planNextAction(p);
            const unsaved = drafts[p.clientId] && !same(drafts[p.clientId] as PlanDay[], saved[p.clientId] ?? []);
            return (
              <li key={p.clientId}>
                <button
                  onClick={() => setOpenId(p.clientId)}
                  aria-current={on ? "true" : undefined}
                  className={`relative flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors duration-[120ms] ease-quiet ${on ? "bg-tintBrand" : "hover:bg-surface"}`}
                >
                  {on ? <span className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden /> : null}
                  <Avatar name={p.clientName} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-base font-medium">{p.clientName}</span>
                      {unsaved ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" title="Unsaved changes" aria-label="Unsaved changes" /> : null}
                    </span>
                    <span className={`block text-xs ${next.urgent ? "font-medium text-brandInk" : "text-muted"}`}>
                      {next.label}
                      {p.status !== "none" ? <span className="tnum font-mono font-normal text-muted"> · wk {weekOverride[p.clientId] ?? p.week}/{p.weeks}</span> : null}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${s.pill}`}>{s.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {open ? (
        <div className="min-w-0 space-y-4">
          <Card className="flex flex-wrap items-center gap-4">
            <Avatar name={open.clientName} size={44} />
            <div className="min-w-0 flex-1">
              <p className="text-xl font-semibold tracking-[-0.015em]">{open.clientName}</p>
              <p className="tnum font-mono text-sm text-muted">
                {days.length === 0 ? "No block yet" : `Week ${week} of ${open.weeks} · ${days.length} days · ${exerciseTotal} exercises`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-sm ${dirty ? "font-medium text-warning" : "text-muted"}`} role="status">
                {dirty ? "Unsaved changes · draft kept in this browser" : "All changes saved"}
              </span>
              {days.length > 0 ? (
                <>
                  <Button variant="secondary" onClick={() => setShowDiff((v) => !v)} disabled={!dirty}>
                    {showDiff ? "Hide changes" : `Changes${dirty ? ` (${diff.length})` : ""}`}
                  </Button>
                  <Button variant="secondary" onClick={() => setCloneOpen(true)}>
                    Clone to…
                  </Button>
                  {planNextAction(open).label === "Start next block" ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setDays(cloneDays(days));
                        setWeekOverride((w) => ({ ...w, [open.clientId]: 1 }));
                        setStatus({ kind: "info", text: "Next block started from this one at week 1. Adjust it, then save." });
                      }}
                    >
                      Start next block
                    </Button>
                  ) : null}
                </>
              ) : null}
              <Button onClick={save} disabled={!dirty}>
                Save plan
              </Button>
            </div>
          </Card>

          {status ? (
            <p
              role="status"
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-base ${
                status.kind === "failed" ? "border-danger bg-tintBrand text-danger" : status.kind === "saved" ? "border-success bg-tintSuccess text-success" : "border-line bg-surface text-ink"
              }`}
            >
              <span>{status.text}</span>
              {status.kind === "failed" ? (
                <Button variant="secondary" onClick={save} className="py-1">
                  Retry
                </Button>
              ) : null}
            </p>
          ) : null}

          {showDiff && dirty ? <DiffPanel changes={diff} /> : null}

          {days.length === 0 ? (
            <StartOptions
              templates={templates}
              plans={plans.filter((p) => p.clientId !== open.clientId && (saved[p.clientId]?.length ?? 0) > 0)}
              onStart={(d) => setDays(cloneDays(d))}
              savedFor={(id) => saved[id] ?? []}
            />
          ) : (
            <>
              <div className="overflow-x-auto pb-2">
                <div className="grid auto-cols-[minmax(300px,1fr)] grid-flow-col gap-4">
                  {days.map((day, di) => (
                    <DayColumn
                      key={`${open.clientId}-${di}`}
                      day={day}
                      library={library}
                      canRemove={days.length > 1}
                      onChange={(d) => setDays(days.map((x, k) => (k === di ? d : x)))}
                      onRemove={() => setDays(days.filter((_, k) => k !== di))}
                    />
                  ))}
                  {days.length < 7 ? (
                    <button
                      type="button"
                      onClick={() => setDays([...days, { name: `Day ${days.length + 1}`, exercises: [] }])}
                      className="flex min-h-[200px] w-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-strong text-muted transition-colors duration-[120ms] ease-quiet hover:border-brand hover:text-brandInk"
                    >
                      <Icon name="plus" size={18} /> Add a day
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="text-sm text-muted">
                Drag rows to reorder, or focus a row and press Alt+↑ or Alt+↓. Type “Bench press 3x8-10 90s”, paste rows from a sheet, or add from the library.
              </p>
            </>
          )}
        </div>
      ) : (
        <Empty title="Pick a client" body="Choose a client on the left to open their plan." />
      )}

      {cloneOpen && open ? (
        <CloneDialog
          from={open.clientName}
          targets={plans.filter((p) => p.clientId !== open.clientId)}
          onClose={() => setCloneOpen(false)}
          onClone={(target) => {
            setDrafts((d) => ({ ...d, [target.clientId]: cloneDays(days) }));
            setCloneOpen(false);
            setStatus({ kind: "info", text: `Copied to ${target.clientName} as an unsaved draft. Open their plan to review and save it.` });
          }}
        />
      ) : null}
    </div>
  );
}

function DayColumn({
  day,
  library,
  canRemove,
  onChange,
  onRemove,
}: {
  day: PlanDay;
  library: LibraryItem[];
  canRemove: boolean;
  onChange: (d: PlanDay) => void;
  onRemove: () => void;
}) {
  const [line, setLine] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [picker, setPicker] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const id = `day-${day.name.replace(/\W+/g, "-")}`;
  const rowsRef = useRef<HTMLUListElement>(null);

  const add = (text: string) => {
    const { exercises, errors: errs } = parseExerciseLines(text);
    if (exercises.length) onChange({ ...day, exercises: [...day.exercises, ...exercises] });
    setErrors(errs);
    if (!errs.length) setLine("");
  };

  const setEx = (i: number, patch: Partial<PlanDay["exercises"][number]>) =>
    onChange({ ...day, exercises: day.exercises.map((e, k) => (k === i ? { ...e, ...patch } : e)) });

  const reorder = (from: number, to: number) => {
    onChange({ ...day, exercises: moveItem(day.exercises, from, to) });
    requestAnimationFrame(() => rowsRef.current?.querySelectorAll<HTMLElement>("[data-row]")[to]?.focus());
  };

  return (
    <Card className="flex flex-col p-0">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <label htmlFor={`${id}-name`} className="sr-only">
          Day name
        </label>
        <input
          id={`${id}-name`}
          value={day.name}
          onChange={(e) => onChange({ ...day, name: e.target.value })}
          className="min-w-0 flex-1 rounded-md border border-transparent px-1.5 py-0.5 text-md font-semibold outline-none transition-colors duration-[120ms] ease-quiet hover:border-line focus:border-brand"
        />
        <span className="tnum font-mono text-xs text-muted">{day.exercises.length}</span>
        {canRemove ? (
          <button type="button" onClick={onRemove} aria-label={`Remove ${day.name}`} className="grid h-7 w-7 place-items-center rounded-md text-faint hover:bg-surface hover:text-ink">
            <Icon name="close" size={14} />
          </button>
        ) : null}
      </div>

      {day.exercises.length === 0 ? (
        <p className="m-3 rounded-lg border border-dashed border-line px-3 py-6 text-center text-sm text-muted">No exercises yet. Type one below or add from the library.</p>
      ) : (
        <ul ref={rowsRef} className="divide-y divide-line">
          {day.exercises.map((e, i) => (
            <li
              key={`${e.name}-${i}`}
              data-row
              tabIndex={0}
              draggable
              aria-label={`${e.name}, position ${i + 1} of ${day.exercises.length}. Alt and arrow keys to move.`}
              onDragStart={() => setDragFrom(i)}
              onDragOver={(ev) => {
                ev.preventDefault();
                setDragOver(i);
              }}
              onDragEnd={() => {
                setDragFrom(null);
                setDragOver(null);
              }}
              onDrop={(ev) => {
                ev.preventDefault();
                if (dragFrom !== null) reorder(dragFrom, i);
                setDragFrom(null);
                setDragOver(null);
              }}
              onKeyDown={(ev) => {
                if (ev.target !== ev.currentTarget || !ev.altKey) return;
                if (ev.key === "ArrowUp") {
                  ev.preventDefault();
                  reorder(i, i - 1);
                } else if (ev.key === "ArrowDown") {
                  ev.preventDefault();
                  reorder(i, i + 1);
                }
              }}
              className={`group px-3 py-2.5 outline-none transition-colors duration-[120ms] ease-quiet focus-visible:bg-tintBrand ${dragOver === i && dragFrom !== i ? "bg-tintBrand" : ""} ${dragFrom === i ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="cursor-grab text-faint" aria-hidden>
                  <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                    <circle cx="2" cy="2" r="1.3" />
                    <circle cx="8" cy="2" r="1.3" />
                    <circle cx="2" cy="7" r="1.3" />
                    <circle cx="8" cy="7" r="1.3" />
                    <circle cx="2" cy="12" r="1.3" />
                    <circle cx="8" cy="12" r="1.3" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1 truncate text-base font-medium">{e.name}</span>
                <button type="button" onClick={() => onChange({ ...day, exercises: day.exercises.filter((_, k) => k !== i) })} aria-label={`Remove ${e.name}`} className="grid h-6 w-6 place-items-center rounded-md text-faint opacity-0 transition-opacity duration-[120ms] ease-quiet hover:bg-surface hover:text-ink focus:opacity-100 group-hover:opacity-100">
                  <Icon name="close" size={13} />
                </button>
              </div>
              <div className="mt-1.5 grid grid-cols-[44px_64px_56px_1fr] gap-1.5 pl-[18px]">
                <SmallField label="Sets" value={String(e.sets)} onChange={(v) => setEx(i, { sets: Math.max(1, Math.min(20, Number(v.replace(/\D/g, "")) || 1)) })} />
                <SmallField label="Reps" value={e.reps} onChange={(v) => setEx(i, { reps: v })} />
                <SmallField label="Rest (s)" value={String(e.restSec)} onChange={(v) => setEx(i, { restSec: Math.max(0, Math.min(900, Number(v.replace(/\D/g, "")) || e.restSec)) })} hint="seconds" />
                <SmallField label="Load" value={e.load ?? ""} onChange={(v) => setEx(i, { load: v })} placeholder="60 kg" />
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-auto flex gap-2 border-t border-line p-3"
        onSubmit={(ev) => {
          ev.preventDefault();
          add(line);
        }}
      >
        <label htmlFor={id} className="sr-only">
          Add an exercise to {day.name}
        </label>
        <input
          id={id}
          value={line}
          onChange={(ev) => setLine(ev.target.value)}
          onPaste={(ev) => {
            const text = ev.clipboardData.getData("text");
            if (/\r?\n/.test(text.trim())) {
              ev.preventDefault();
              add(text);
            }
          }}
          placeholder="Bench press 3x8-10 90s"
          aria-invalid={errors.length ? true : undefined}
          aria-describedby={errors.length ? `${id}-errors` : undefined}
          className={`${inputClass} h-9 min-w-0`}
        />
        <Button variant="secondary" type="submit" className="px-2.5">
          <Icon name="plus" size={14} />
          <span className="sr-only">Add</span>
        </Button>
        <Button variant="secondary" onClick={() => setPicker(true)} className="px-2.5">
          <Icon name="dumbbell" size={14} />
          <span className="sr-only">Add from library</span>
        </Button>
      </form>
      {errors.length ? (
        <ul id={`${id}-errors`} className="space-y-0.5 px-4 pb-3 text-sm text-danger" role="alert">
          {errors.map((er, k) => (
            <li key={k}>{er}</li>
          ))}
        </ul>
      ) : null}

      {picker ? (
        <LibraryPicker
          library={library}
          dayName={day.name}
          onClose={() => setPicker(false)}
          onPick={(names) => {
            onChange({ ...day, exercises: [...day.exercises, ...names.map((name) => ({ name, sets: 3, reps: "8-12", restSec: 90 }))] });
            setPicker(false);
          }}
        />
      ) : null}
    </Card>
  );
}

function SmallField({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <label className="block min-w-0">
      <span className="block text-2xs text-faint">{label}</span>
      <input
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => local !== value && onChange(local)}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        aria-label={`${label}${hint ? ` in ${hint}` : ""}`}
        className="tnum w-full rounded-md border border-line bg-card px-1.5 py-1 font-mono text-sm outline-none transition-colors duration-[120ms] ease-quiet placeholder:text-faint focus:border-brand"
      />
    </label>
  );
}

function StartOptions({
  templates,
  plans,
  onStart,
  savedFor,
}: {
  templates: PlanTemplate[];
  plans: Plan[];
  onStart: (days: PlanDay[]) => void;
  savedFor: (id: string) => PlanDay[];
}) {
  const [cloneId, setCloneId] = useState(plans[0]?.clientId ?? "");
  return (
    <Card>
      <h2 className="text-lg font-semibold">Start this plan</h2>
      <p className="mt-1 text-base text-muted">Pick a starting point. Nothing reaches the client until you save.</p>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {templates.map((t) => (
          <button key={t.id} type="button" onClick={() => onStart(t.days)} className="flex flex-col rounded-xl border border-line bg-card p-4 text-left transition-colors duration-[120ms] ease-quiet hover:border-strong hover:bg-surface">
            <span className="text-md font-semibold">{t.name}</span>
            <span className="mt-1 flex-1 text-base text-muted">{t.summary}</span>
            <span className="tnum mt-3 font-mono text-sm text-faint">{t.days.length} days</span>
          </button>
        ))}
        <button type="button" onClick={() => onStart([{ name: "Day 1", exercises: [] }])} className="flex flex-col rounded-xl border border-dashed border-strong p-4 text-left transition-colors duration-[120ms] ease-quiet hover:border-brand">
          <span className="text-md font-semibold">Start blank</span>
          <span className="mt-1 flex-1 text-base text-muted">One empty day. Type, paste or add from the library.</span>
        </button>
      </div>
      {plans.length ? (
        <div className="mt-5 flex flex-wrap items-end gap-2 border-t border-line pt-4">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="clone-from" className="mb-1.5 block text-sm font-medium">
              Or copy another client&apos;s plan
            </label>
            <select id="clone-from" value={cloneId} onChange={(e) => setCloneId(e.target.value)} className={`${inputClass} h-10`}>
              {plans.map((p) => (
                <option key={p.clientId} value={p.clientId}>
                  {p.clientName}
                </option>
              ))}
            </select>
          </div>
          <Button variant="secondary" onClick={() => onStart(savedFor(cloneId))}>
            Copy plan
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function DiffPanel({ changes }: { changes: ReturnType<typeof planDiff> }) {
  const tone = { added: "bg-tintSuccess text-success", removed: "bg-tintBrand text-brandInk", changed: "bg-tintWarning text-warning" } as const;
  return (
    <Card>
      <h2 className="text-md font-semibold">Changes since the last save</h2>
      <p className="text-sm text-muted">Use this to explain the update to your client.</p>
      {changes.length === 0 ? (
        <p className="mt-3 text-base text-muted">No changes.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {changes.map((c, i) => (
            <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-base">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tone[c.kind]}`}>{c.kind}</span>
              <span className="text-muted">{c.day}</span>
              <span className="font-medium">{c.name}</span>
              <span className="tnum font-mono text-sm text-muted">{c.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input, select, button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[color-mix(in_srgb,var(--text)_50%,transparent)] p-6" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div ref={ref} className="w-full max-w-md rounded-xl border border-line bg-card p-5 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function LibraryPicker({ library, dayName, onClose, onPick }: { library: LibraryItem[]; dayName: string; onClose: () => void; onPick: (names: string[]) => void }) {
  const [q, setQ] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const items = library.filter((e) => `${e.name} ${e.muscle} ${e.equipment}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Dialog title={`Add to ${dayName}`} onClose={onClose}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercise, muscle or equipment" aria-label="Search the library" className={`${inputClass} h-10`} />
      <ul className="mt-3 max-h-72 divide-y divide-line overflow-y-auto rounded-lg border border-line">
        {items.length === 0 ? <li className="px-3 py-4 text-center text-sm text-muted">Nothing matches.</li> : null}
        {items.map((e) => (
          <li key={e.name}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-surface">
              <input
                type="checkbox"
                checked={chosen.includes(e.name)}
                onChange={() => setChosen((c) => (c.includes(e.name) ? c.filter((n) => n !== e.name) : [...c, e.name]))}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium">{e.name}</span>
                <span className="block text-xs text-muted">
                  {e.muscle} · {e.equipment}
                  {e.demo ? " · demo video" : ""}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => onPick(chosen)} disabled={!chosen.length}>
          Add {chosen.length || ""}
        </Button>
      </div>
    </Dialog>
  );
}

function CloneDialog({ from, targets, onClose, onClone }: { from: string; targets: Plan[]; onClose: () => void; onClone: (p: Plan) => void }) {
  const [id, setId] = useState(targets[0]?.clientId ?? "");
  const target = targets.find((t) => t.clientId === id);
  return (
    <Dialog title={`Copy ${from.split(" ")[0]}'s week to…`} onClose={onClose}>
      <label htmlFor="clone-to" className="mb-1.5 block text-sm font-medium">
        Client
      </label>
      <select id="clone-to" value={id} onChange={(e) => setId(e.target.value)} className={`${inputClass} h-10`}>
        {targets.map((t) => (
          <option key={t.clientId} value={t.clientId}>
            {t.clientName}
          </option>
        ))}
      </select>
      <p className="mt-2 text-sm text-muted">Their current plan is replaced by an unsaved draft you can review before saving.</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => target && onClone(target)} disabled={!target}>
          Copy week
        </Button>
      </div>
    </Dialog>
  );
}
