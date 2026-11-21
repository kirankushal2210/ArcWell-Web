"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { PlanDay, PlanTemplate } from "@/lib/data";
import {
  COACHING_FOCUS,
  STEPS,
  WEEKDAYS,
  canOpen,
  completedSteps,
  emptyDraft,
  exerciseCount,
  formatRest,
  inviteMessage,
  nextStep,
  parseExerciseLines,
  parseFee,
  prevStep,
  validateClient,
  validateProfile,
  validateWeek,
  whatsappHref,
  type ClientDraft,
  type Errors,
  type OnboardingDraft,
  type ProfileDraft,
  type StepKey,
  type WeekDraft,
  type Weekday,
} from "@/lib/onboarding";
import { inr } from "@/lib/domain";
import { Button, Card, Field, Skeleton, describe, inputClass } from "./ui";
import { Icon } from "./icons";

/** The draft lives for this browser session only, so a refresh never wipes a half-typed step. */
const DRAFT_KEY = "arcwell.onboarding.v1";

function readDraft(): OnboardingDraft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    return raw ? ({ ...emptyDraft(), ...JSON.parse(raw) } as OnboardingDraft) : null;
  } catch {
    return null;
  }
}

function writeDraft(d: OnboardingDraft) {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    // Storage can be blocked (private windows, strict settings). The flow still works without it.
  }
}

export function Onboarding({ templates, goals }: { templates: PlanTemplate[]; goals: readonly string[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<OnboardingDraft>(emptyDraft);
  const [ready, setReady] = useState(false);
  const [tried, setTried] = useState<Partial<Record<StepKey, boolean>>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const saved = readDraft();
    if (saved) setDraft(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeDraft(draft);
  }, [draft, ready]);

  const done = completedSteps(draft);
  const step = draft.step;
  const index = STEPS.findIndex((s) => s.key === step);

  const go = (key: StepKey) => {
    if (!canOpen(draft, key)) return;
    setDraft((d) => {
      // The invite text is written once, from the finished steps, and then belongs to the coach.
      const invite =
        key === "invite" && !d.invite.message ? { ...d.invite, message: inviteMessage(d) } : d.invite;
      return { ...d, step: key, invite };
    });
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const stepValid: Record<StepKey, boolean> = {
    profile: done.profile,
    client: done.client,
    week: done.week,
    invite: true,
    review: done.review,
  };

  const onContinue = () => {
    if (!stepValid[step]) {
      setTried((t) => ({ ...t, [step]: true }));
      // Take keyboard and screen-reader users straight to the first thing to fix.
      requestAnimationFrame(() => {
        const first = document.querySelector<HTMLElement>(
          '[aria-labelledby="step-title"] [aria-invalid="true"], [aria-labelledby="step-title"] [role="alert"]',
        );
        if (first?.getAttribute("role") === "alert") first.scrollIntoView({ block: "center" });
        else first?.focus();
      });
      return;
    }
    go(nextStep(step));
  };

  if (!ready) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]" aria-busy="true">
        <Skeleton lines={5} />
        <Skeleton lines={6} />
      </div>
    );
  }

  const meta = STEPS[index]!;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <Stepper draft={draft} done={done} onGo={go} />

      <section aria-labelledby="step-title" className="min-w-0">
        <p className="text-sm text-muted lg:hidden">
          Step {index + 1} of {STEPS.length} · {meta.label}
        </p>
        <h2 id="step-title" ref={headingRef} tabIndex={-1} className="text-xl font-semibold tracking-[-0.01em] outline-none">
          {TITLES[step]}
        </h2>
        <p className="mt-1 max-w-xl text-base text-muted">{INTROS[step]}</p>

        <div className="mt-5">
          {step === "profile" ? (
            <ProfileStep
              value={draft.profile}
              errors={tried.profile ? validateProfile(draft.profile) : {}}
              onChange={(profile) =>
                setDraft((d) => ({
                  ...d,
                  profile,
                  // Until the coach picks a client's day, it follows the coach's usual day.
                  client: d.client.name ? d.client : { ...d.client, checkInDay: profile.checkInDay },
                }))
              }
            />
          ) : step === "client" ? (
            <ClientStep
              value={draft.client}
              goals={goals}
              errors={tried.client ? validateClient(draft.client) : {}}
              onChange={(client) => setDraft((d) => ({ ...d, client }))}
            />
          ) : step === "week" ? (
            <WeekStep
              value={draft.week}
              clientName={draft.client.name}
              templates={templates}
              error={tried.week ? validateWeek(draft.week) : null}
              onChange={(week) => setDraft((d) => ({ ...d, week }))}
            />
          ) : step === "invite" ? (
            <InviteStep
              value={draft.invite}
              clientName={draft.client.name}
              onChange={(invite) => setDraft((d) => ({ ...d, invite }))}
              onReset={() => setDraft((d) => ({ ...d, invite: { ...d.invite, message: inviteMessage(d) } }))}
            />
          ) : (
            <ReviewStep draft={draft} onEdit={go} />
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {index > 0 ? (
            <Button variant="secondary" onClick={() => go(prevStep(step))}>
              Back
            </Button>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {step === "invite" && !draft.invite.copied ? (
              <Button variant="quiet" onClick={() => go("review")}>
                Skip for now
              </Button>
            ) : null}
            {step === "review" ? (
              <Button onClick={() => router.push("/coach/today")}>Finish and go to Today</Button>
            ) : (
              <Button onClick={onContinue}>Continue</Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const TITLES: Record<StepKey, string> = {
  profile: "Tell clients who you are",
  client: "Add your first client",
  week: "Build their first week",
  invite: "Invite them to the app",
  review: "Check everything",
};

const INTROS: Record<StepKey, string> = {
  profile: "Your name appears on every plan and message. Your check-in day becomes the default for new clients.",
  client: "Start with one person you coach today. You can add the rest from the Clients screen.",
  week: "Start from a template and adjust it, or type your own exercises. Nothing reaches the client until you invite them.",
  invite: "Send this message however you usually talk to them. Edit it first if you like.",
  review: "Make sure this is right before you start. Every part can be changed later.",
};

/* -------------------------------------------------------------------- stepper */

function Stepper({
  draft,
  done,
  onGo,
}: {
  draft: OnboardingDraft;
  done: Record<StepKey, boolean>;
  onGo: (k: StepKey) => void;
}) {
  return (
    <nav aria-label="Setup steps" className="hidden lg:block">
      <ol className="space-y-1">
        {STEPS.map((s, i) => {
          const current = s.key === draft.step;
          const open = canOpen(draft, s.key);
          const complete = done[s.key] && s.key !== "review";
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => onGo(s.key)}
                disabled={!open}
                aria-current={current ? "step" : undefined}
                className={`flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left transition-colors duration-[120ms] ease-quiet disabled:cursor-not-allowed ${
                  current ? "bg-white shadow-[inset_0_0_0_1px_var(--border)]" : open ? "hover:bg-surface" : ""
                }`}
              >
                <span
                  className={`tnum mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-medium ${
                    complete ? "bg-success text-white" : current ? "bg-ink text-white" : "bg-raised text-muted"
                  }`}
                  aria-hidden
                >
                  {complete ? <Icon name="check" size={12} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block text-base ${current ? "font-medium text-ink" : open ? "text-ink" : "text-faint"}`}>
                    {s.label}
                    {complete ? <span className="sr-only"> (done)</span> : null}
                  </span>
                  <span className="block text-sm text-muted">
                    {s.key === "invite" && !done.invite ? "Optional" : s.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* -------------------------------------------------------------------- steps */

function ProfileStep({
  value,
  errors,
  onChange,
}: {
  value: ProfileDraft;
  errors: Errors<ProfileDraft>;
  onChange: (v: ProfileDraft) => void;
}) {
  const id = useId();
  const set = <K extends keyof ProfileDraft>(k: K, v: ProfileDraft[K]) => onChange({ ...value, [k]: v });
  return (
    <Card className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field id={`${id}-name`} label="Your name" error={errors.name}>
        <input
          {...describe(`${id}-name`, errors.name)}
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          autoComplete="name"
          className={`${inputClass} h-9`}
        />
      </Field>
      <Field id={`${id}-email`} label="Email" error={errors.email}>
        <input
          {...describe(`${id}-email`, errors.email)}
          type="email"
          value={value.email}
          onChange={(e) => set("email", e.target.value)}
          autoComplete="email"
          className={`${inputClass} h-9`}
        />
      </Field>
      <fieldset className="sm:col-span-2">
        <legend className="mb-1 text-sm font-medium">What do you mostly coach?</legend>
        <div className="flex flex-wrap gap-2" aria-describedby={errors.focus ? `${id}-focus-error` : undefined}>
          {COACHING_FOCUS.map((f) => (
            <ChoiceChip key={f} name={`${id}-focus`} checked={value.focus === f} onChange={() => set("focus", f)}>
              {f}
            </ChoiceChip>
          ))}
        </div>
        {errors.focus ? (
          <p id={`${id}-focus-error`} className="mt-1 text-sm text-danger">
            {errors.focus}
          </p>
        ) : null}
      </fieldset>
      <Field id={`${id}-day`} label="Usual check-in day" hint="New clients start with this day. You can change it per client.">
        <DaySelect {...describe(`${id}-day`, undefined, "hint")} value={value.checkInDay} onChange={(d) => set("checkInDay", d)} />
      </Field>
    </Card>
  );
}

function ClientStep({
  value,
  goals,
  errors,
  onChange,
}: {
  value: ClientDraft;
  goals: readonly string[];
  errors: Errors<ClientDraft>;
  onChange: (v: ClientDraft) => void;
}) {
  const id = useId();
  const set = <K extends keyof ClientDraft>(k: K, v: ClientDraft[K]) => onChange({ ...value, [k]: v });
  return (
    <Card className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field id={`${id}-name`} label="Client's name" error={errors.name}>
        <input
          {...describe(`${id}-name`, errors.name)}
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          autoComplete="off"
          className={`${inputClass} h-9`}
        />
      </Field>
      <Field id={`${id}-email`} label="Client's email" error={errors.email} hint="They sign in to the app with this.">
        <input
          {...describe(`${id}-email`, errors.email, "hint")}
          type="email"
          value={value.email}
          onChange={(e) => set("email", e.target.value)}
          autoComplete="off"
          className={`${inputClass} h-9`}
        />
      </Field>
      <Field id={`${id}-goal`} label="Goal" error={errors.goal} className="sm:col-span-2">
        <input
          {...describe(`${id}-goal`, errors.goal)}
          value={value.goal}
          onChange={(e) => set("goal", e.target.value)}
          placeholder="For example, lose 6 kg by March"
          className={`${inputClass} h-9`}
        />
      </Field>
      <div className="-mt-2 flex flex-wrap gap-1.5 sm:col-span-2" aria-label="Common goals">
        {goals.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => set("goal", g)}
            className="rounded-md border border-line px-2 py-0.5 text-sm text-muted transition-colors duration-[120ms] ease-quiet hover:bg-surface hover:text-ink"
          >
            {g}
          </button>
        ))}
      </div>
      <Field id={`${id}-day`} label="Check-in day">
        <DaySelect {...describe(`${id}-day`)} value={value.checkInDay} onChange={(d) => set("checkInDay", d)} />
      </Field>
      <Field
        id={`${id}-fee`}
        label="Monthly fee"
        optional
        error={errors.feeInr}
        hint="In rupees. Used for renewals and income on the Business screen."
      >
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted" aria-hidden>
            ₹
          </span>
          <input
            {...describe(`${id}-fee`, errors.feeInr, "hint")}
            inputMode="numeric"
            value={value.feeInr}
            onChange={(e) => set("feeInr", e.target.value)}
            className={`${inputClass} tnum h-9 pl-7`}
          />
        </div>
      </Field>
    </Card>
  );
}

function WeekStep({
  value,
  clientName,
  templates,
  error,
  onChange,
}: {
  value: WeekDraft;
  clientName: string;
  templates: PlanTemplate[];
  error: string | null;
  onChange: (v: WeekDraft) => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);

  const start = (t: PlanTemplate | null) =>
    onChange({
      templateId: t?.id ?? "blank",
      days: t ? t.days.map((d) => ({ name: d.name, exercises: d.exercises.map((e) => ({ ...e })) })) : [{ name: "Day 1", exercises: [] }],
    });

  const setDay = (i: number, day: PlanDay) => onChange({ ...value, days: value.days.map((d, k) => (k === i ? day : d)) });
  const removeDay = (i: number) => onChange({ ...value, days: value.days.filter((_, k) => k !== i) });
  const addDay = () => onChange({ ...value, days: [...value.days, { name: `Day ${value.days.length + 1}`, exercises: [] }] });

  if (value.days.length === 0) {
    return (
      <div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {templates.map((t) => (
            <StartOption
              key={t.id}
              title={t.name}
              body={t.summary}
              meta={`${t.days.length} days · ${exerciseCount(t.days)} exercises`}
              onPick={() => start(t)}
            />
          ))}
          <StartOption title="Start blank" body="One empty day. Type or paste your own exercises." meta="Your own program" onPick={() => start(null)} />
        </div>
        {error ? <p className="mt-3 text-sm text-danger" role="alert">{error}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <p className="tnum text-base text-muted">
          {clientName.trim() || "This client"}: {value.days.length} {value.days.length === 1 ? "day" : "days"} · {exerciseCount(value.days)} exercises
        </p>
        <div className="ml-auto flex gap-2">
          {confirmReset ? (
            <>
              <Button variant="quiet" onClick={() => setConfirmReset(false)}>Keep this week</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmReset(false);
                  onChange({ templateId: null, days: [] });
                }}
              >
                Discard and pick again
              </Button>
            </>
          ) : (
            <Button variant="quiet" onClick={() => setConfirmReset(true)}>Change starting point</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {value.days.map((day, i) => (
          <DayCard
            key={i}
            day={day}
            index={i}
            canRemove={value.days.length > 1}
            onChange={(d) => setDay(i, d)}
            onRemove={() => removeDay(i)}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button variant="secondary" onClick={addDay} disabled={value.days.length >= 7}>
          <Icon name="plus" size={14} /> Add a day
        </Button>
        {value.days.length >= 7 ? <p className="text-sm text-muted">A week has seven days at most.</p> : null}
      </div>
      {error ? <p className="mt-3 text-sm text-danger" role="alert">{error}</p> : null}
    </div>
  );
}

function DayCard({
  day,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  day: PlanDay;
  index: number;
  canRemove: boolean;
  onChange: (d: PlanDay) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const [line, setLine] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const add = (text: string) => {
    const { exercises, errors: errs } = parseExerciseLines(text);
    if (exercises.length) onChange({ ...day, exercises: [...day.exercises, ...exercises] });
    setErrors(errs);
    if (!errs.length) setLine("");
  };

  const dayLabel = day.name.trim() || `Day ${index + 1}`;

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <label htmlFor={`${id}-name`} className="sr-only">Name of day {index + 1}</label>
        <input
          id={`${id}-name`}
          value={day.name}
          onChange={(e) => onChange({ ...day, name: e.target.value })}
          className="min-w-0 flex-1 rounded-md border border-transparent px-1.5 py-0.5 text-md font-medium outline-none transition-colors duration-[120ms] ease-quiet hover:border-line focus:border-strong"
        />
        {canRemove ? (
          <Button variant="quiet" onClick={onRemove} className="px-2">
            Remove day<span className="sr-only"> {dayLabel}</span>
          </Button>
        ) : null}
      </div>

      {day.exercises.length === 0 ? (
        <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-sm text-muted">
          No exercises yet. Add one below.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line">
          {day.exercises.map((e, k) => (
            <li key={`${e.name}-${k}`} className="flex items-center gap-3 px-3 py-2 text-base">
              <span className="min-w-0 flex-1 truncate">{e.name}</span>
              <span className="tnum shrink-0 text-muted">
                {e.sets} × {e.reps}
              </span>
              <span className="tnum w-14 shrink-0 text-right text-muted">{formatRest(e.restSec)}</span>
              <button
                type="button"
                onClick={() => onChange({ ...day, exercises: day.exercises.filter((_, j) => j !== k) })}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-faint transition-colors duration-[120ms] ease-quiet hover:bg-surface hover:text-ink"
                aria-label={`Remove ${e.name} from ${dayLabel}`}
              >
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add(line);
        }}
      >
        <label htmlFor={`${id}-line`} className="sr-only">Add an exercise to {dayLabel}</label>
        <input
          id={`${id}-line`}
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
          aria-describedby={errors.length ? `${id}-errors` : `${id}-help`}
          aria-invalid={errors.length ? true : undefined}
          className={`${inputClass} h-8 text-sm`}
        />
        <Button variant="secondary" type="submit">Add</Button>
      </form>
      {errors.length ? (
        <ul id={`${id}-errors`} className="mt-1 space-y-0.5 text-sm text-danger" role="alert">
          {errors.map((er, k) => (
            <li key={k}>{er}</li>
          ))}
        </ul>
      ) : (
        <p id={`${id}-help`} className="mt-1 text-sm text-faint">
          Name, sets x reps, rest. Paste several rows from a sheet at once.
        </p>
      )}
    </Card>
  );
}

function InviteStep({
  value,
  clientName,
  onChange,
  onReset,
}: {
  value: OnboardingDraft["invite"];
  clientName: string;
  onChange: (v: OnboardingDraft["invite"]) => void;
  onReset: () => void;
}) {
  const id = useId();
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const name = clientName.trim() || "your client";

  const copy = async () => {
    const field = document.getElementById(`${id}-msg`) as HTMLTextAreaElement | null;
    if (await copyText(value.message, field)) {
      onChange({ ...value, copied: true });
      setStatus("copied");
    } else {
      // Leave the text selected so the coach only has to press the copy shortcut.
      field?.focus();
      field?.select();
      setStatus("failed");
    }
  };

  return (
    <Card>
      <Field id={`${id}-msg`} label={`Message to ${name}`}>
        <textarea
          id={`${id}-msg`}
          value={value.message}
          onChange={(e) => onChange({ ...value, message: e.target.value })}
          rows={7}
          className={`${inputClass} resize-y py-2 leading-6`}
        />
      </Field>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={copy} disabled={!value.message.trim()}>
          {status === "copied" ? <Icon name="check" size={14} /> : null}
          {status === "copied" ? "Copied" : "Copy message"}
        </Button>
        <a
          href={whatsappHref(value.message)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onChange({ ...value, copied: true })}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-base font-medium text-ink transition-colors duration-[120ms] ease-quiet hover:bg-surface"
        >
          Open in WhatsApp<span className="sr-only"> (opens a new tab)</span>
        </a>
        <Button variant="quiet" onClick={onReset}>Reset text</Button>
      </div>
      <p className="mt-2 text-sm text-muted" role="status" aria-live="polite">
        {status === "copied"
          ? `Copied. Paste it into your chat with ${name}.`
          : status === "failed"
            ? "Your browser blocked copying. The message is selected: press Ctrl+C (⌘C on a Mac) to copy it."
            : value.copied
              ? `You've already shared this with ${name}.`
              : ""}
      </p>
    </Card>
  );
}

function ReviewStep({ draft, onEdit }: { draft: OnboardingDraft; onEdit: (k: StepKey) => void }) {
  const fee = parseFee(draft.client.feeInr);
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <ReviewCard title="You" onEdit={() => onEdit("profile")}>
        <Row label="Name" value={draft.profile.name} />
        <Row label="Email" value={draft.profile.email} />
        <Row label="Coaching" value={draft.profile.focus} />
        <Row label="Check-in day" value={draft.profile.checkInDay} />
      </ReviewCard>
      <ReviewCard title="First client" onEdit={() => onEdit("client")}>
        <Row label="Name" value={draft.client.name} />
        <Row label="Email" value={draft.client.email} />
        <Row label="Goal" value={draft.client.goal} />
        <Row label="Check-in day" value={draft.client.checkInDay} />
        <Row label="Monthly fee" value={fee === null ? "—" : inr(fee)} note={fee === null ? "Not set" : undefined} />
      </ReviewCard>
      <ReviewCard title="First week" onEdit={() => onEdit("week")}>
        {draft.week.days.map((d, i) => (
          <Row
            key={i}
            label={d.name.trim() || `Day ${i + 1}`}
            value={`${d.exercises.length} ${d.exercises.length === 1 ? "exercise" : "exercises"}`}
          />
        ))}
      </ReviewCard>
      <ReviewCard title="Invite" onEdit={() => onEdit("invite")}>
        <Row label="Status" value={draft.invite.copied ? "Shared" : "Not shared yet"} />
        {!draft.invite.copied ? (
          <p className="text-sm text-muted">Come back to the invite step whenever you're ready to send it.</p>
        ) : null}
      </ReviewCard>
    </div>
  );
}

/* -------------------------------------------------------------------- bits */

/**
 * Copies text, resolving true only when the copy really happened. Some browsers leave the
 * clipboard promise pending when permission is withheld, so it gets a short deadline, then the
 * older selection-based copy is tried before giving up.
 */
async function copyText(text: string, field: HTMLTextAreaElement | null): Promise<boolean> {
  try {
    await Promise.race([
      navigator.clipboard.writeText(text),
      new Promise((_, reject) => setTimeout(() => reject(new Error("clipboard timed out")), 1500)),
    ]);
    return true;
  } catch {
    if (!field) return false;
    try {
      field.focus();
      field.select();
      return document.execCommand("copy");
    } catch {
      return false;
    }
  }
}

function ReviewCard({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-md font-medium">{title}</h3>
        <Button variant="quiet" onClick={onEdit} className="px-2">
          Edit<span className="sr-only"> {title.toLowerCase()}</span>
        </Button>
      </div>
      <dl className="space-y-1.5">{children}</dl>
    </Card>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-base">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right">
        {value}
        {note ? <span className="ml-1.5 text-sm text-faint">{note}</span> : null}
      </dd>
    </div>
  );
}

function StartOption({ title, body, meta, onPick }: { title: string; body: string; meta: string; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex h-full flex-col rounded-lg border border-line bg-white p-4 text-left transition-colors duration-[120ms] ease-quiet hover:border-strong hover:bg-surface"
    >
      <span className="text-md font-medium">{title}</span>
      <span className="mt-1 flex-1 text-base text-muted">{body}</span>
      <span className="tnum mt-3 text-sm text-faint">{meta}</span>
    </button>
  );
}

function ChoiceChip({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-base transition-colors duration-[120ms] ease-quiet focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus)] ${
        checked ? "border-ink bg-white font-medium text-ink" : "border-line text-muted hover:bg-surface hover:text-ink"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {checked ? <Icon name="check" size={14} /> : null}
      {children}
    </label>
  );
}

function DaySelect({
  value,
  onChange,
  ...aria
}: {
  value: Weekday;
  onChange: (d: Weekday) => void;
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}) {
  return (
    <select {...aria} value={value} onChange={(e) => onChange(e.target.value as Weekday)} className={`${inputClass} h-9`}>
      {WEEKDAYS.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
    </select>
  );
}
