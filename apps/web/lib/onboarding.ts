// Pure logic for the first-run flow: the draft shape, validation, the exercise-line parser and
// the invite text. No React and no storage, so every rule here can be unit tested on its own.

import type { PlanDay } from "./data";

export type Exercise = PlanDay["exercises"][number];

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const COACHING_FOCUS = [
  "Fat loss",
  "Strength and muscle",
  "General fitness",
  "Endurance",
  "Sport performance",
  "Return from injury",
] as const;

export type ProfileDraft = { name: string; email: string; focus: string; checkInDay: Weekday };
export type ClientDraft = { name: string; email: string; goal: string; checkInDay: Weekday; feeInr: string };
export type WeekDraft = { templateId: string | null; days: PlanDay[] };
export type InviteDraft = { message: string; copied: boolean };

export type OnboardingDraft = {
  step: StepKey;
  profile: ProfileDraft;
  client: ClientDraft;
  week: WeekDraft;
  invite: InviteDraft;
};

export const STEPS = [
  { key: "profile", label: "Your profile", hint: "How clients will see you" },
  { key: "client", label: "First client", hint: "Who you coach first" },
  { key: "week", label: "First week", hint: "Their training days" },
  { key: "invite", label: "Invite", hint: "Get them on the app" },
  { key: "review", label: "Review", hint: "Check and finish" },
] as const;
export type StepKey = (typeof STEPS)[number]["key"];

export function emptyDraft(): OnboardingDraft {
  return {
    step: "profile",
    profile: { name: "", email: "", focus: "", checkInDay: "Monday" },
    client: { name: "", email: "", goal: "", checkInDay: "Monday", feeInr: "" },
    week: { templateId: null, days: [] },
    invite: { message: "", copied: false },
  };
}

/* ---------------------------------------------------------------- validation */

export type Errors<T> = Partial<Record<keyof T, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateProfile(p: ProfileDraft): Errors<ProfileDraft> {
  const e: Errors<ProfileDraft> = {};
  if (!p.name.trim()) e.name = "Enter your name. Clients see it on every message.";
  if (!p.email.trim()) e.email = "Enter your email.";
  else if (!EMAIL.test(p.email.trim())) e.email = "This doesn't look like an email address.";
  if (!p.focus) e.focus = "Pick what you mostly coach.";
  return e;
}

export function validateClient(c: ClientDraft): Errors<ClientDraft> {
  const e: Errors<ClientDraft> = {};
  if (!c.name.trim()) e.name = "Enter the client's name.";
  if (!c.email.trim()) e.email = "Enter the client's email. Their invite goes here.";
  else if (!EMAIL.test(c.email.trim())) e.email = "This doesn't look like an email address.";
  if (!c.goal.trim()) e.goal = "Add a goal, even a rough one. You can change it later.";
  if (c.feeInr.trim()) {
    const n = Number(c.feeInr.replace(/[,\s₹]/g, ""));
    if (!Number.isInteger(n) || n <= 0) e.feeInr = "Enter the monthly fee in whole rupees, or leave it empty.";
  }
  return e;
}

export function validateWeek(w: WeekDraft): string | null {
  if (w.days.length === 0) return "Pick a starting point to create at least one training day.";
  if (w.days.every((d) => d.exercises.length === 0)) return "Add at least one exercise.";
  return null;
}

export const isClean = (e: object) => Object.keys(e).length === 0;

/** Fee as a number for display, or null when the coach left it empty. */
export function parseFee(raw: string): number | null {
  const n = Number(raw.replace(/[,\s₹]/g, ""));
  return raw.trim() && Number.isInteger(n) && n > 0 ? n : null;
}

/** Which steps are complete, derived from the draft. Nothing is stored twice. */
export function completedSteps(d: OnboardingDraft): Record<StepKey, boolean> {
  const profile = isClean(validateProfile(d.profile));
  const client = isClean(validateClient(d.client));
  const week = validateWeek(d.week) === null;
  return { profile, client, week, invite: d.invite.copied, review: profile && client && week };
}

/** A step is reachable when every step before it, except the optional invite, is complete. */
export function canOpen(d: OnboardingDraft, key: StepKey): boolean {
  const done = completedSteps(d);
  const order = STEPS.map((s) => s.key);
  return order.slice(0, order.indexOf(key)).every((k) => k === "invite" || done[k]);
}

export function nextStep(key: StepKey): StepKey {
  const i = STEPS.findIndex((s) => s.key === key);
  return STEPS[Math.min(i + 1, STEPS.length - 1)]!.key;
}

export function prevStep(key: StepKey): StepKey {
  const i = STEPS.findIndex((s) => s.key === key);
  return STEPS[Math.max(i - 1, 0)]!.key;
}

/* ------------------------------------------------------------ exercise lines */

export type ParseResult = { ok: true; exercise: Exercise } | { ok: false; error: string };

const DEFAULT_REST = 90;

/** Rest written as "90s", "90", "2m", "1.5 min" or "2:00", in seconds. */
function parseRest(raw: string | undefined): number | null {
  if (!raw) return DEFAULT_REST;
  const t = raw.trim().toLowerCase();
  const clock = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  const unit = /^(\d+(?:\.\d+)?)\s*(s|sec|secs|m|min|mins)?$/.exec(t);
  if (!unit) return null;
  const n = Number(unit[1]);
  const minutes = unit[2]?.startsWith("m");
  const sec = Math.round(minutes ? n * 60 : n);
  return sec > 0 && sec <= 900 ? sec : null;
}

/**
 * One exercise from a typed line, e.g. "Bench press 3x8-10 90s", "Plank 3 x 45s", or a
 * spreadsheet row "Bench press<TAB>3<TAB>8-10<TAB>90".
 */
export function parseExerciseLine(line: string): ParseResult {
  const raw = line.trim();
  if (!raw) return { ok: false, error: "Type an exercise, for example “Bench press 3x8-10 90s”." };

  if (raw.includes("\t")) {
    const [name = "", sets = "", reps = "", rest] = raw.split("\t").map((c) => c.trim());
    return build(name, sets, reps, rest, raw);
  }

  const m = /^(.*?)\s+(\d{1,2})\s*[x×]\s*([0-9][0-9\-–/a-z ]*?)(?:\s+(\d+(?:\.\d+)?\s*(?:s|sec|secs|m|min|mins)?|\d{1,2}:\d{2}))?$/i.exec(raw);
  if (!m) return { ok: false, error: `Couldn't read “${raw}”. Write it as name, sets x reps, rest: “Bench press 3x8-10 90s”.` };
  return build(m[1] ?? "", m[2] ?? "", m[3] ?? "", m[4], raw);
}

function build(name: string, setsRaw: string, repsRaw: string, restRaw: string | undefined, raw: string): ParseResult {
  const sets = Number(setsRaw);
  const reps = repsRaw.trim().replace(/–/g, "-");
  const restSec = parseRest(restRaw);
  if (!name.trim()) return { ok: false, error: `“${raw}” is missing the exercise name.` };
  if (!Number.isInteger(sets) || sets < 1 || sets > 20) return { ok: false, error: `“${raw}” needs between 1 and 20 sets.` };
  if (!reps) return { ok: false, error: `“${raw}” is missing reps.` };
  if (restSec === null) return { ok: false, error: `Couldn't read the rest in “${raw}”. Use seconds like 90s or minutes like 2m.` };
  return { ok: true, exercise: { name: tidyName(name), sets, reps, restSec } };
}

const tidyName = (s: string) => {
  const t = s.trim().replace(/\s+/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Several lines at once, e.g. pasted from a sheet. Blank lines are ignored. */
export function parseExerciseLines(text: string): { exercises: Exercise[]; errors: string[] } {
  const exercises: Exercise[] = [];
  const errors: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const r = parseExerciseLine(line);
    if (r.ok) exercises.push(r.exercise);
    else errors.push(r.error);
  }
  return { exercises, errors };
}

export function formatRest(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

export const exerciseCount = (days: PlanDay[]) => days.reduce((n, d) => n + d.exercises.length, 0);

/* -------------------------------------------------------------------- invite */

export const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? "";

/** The default invite. Uses only what the coach typed; nothing is assumed about links or stores. */
export function inviteMessage(d: Pick<OnboardingDraft, "profile" | "client" | "week">): string {
  const client = firstName(d.client.name) || "there";
  const coach = d.profile.name.trim();
  const days = d.week.days.length;
  return [
    `Hi ${client}, it's ${coach}.`,
    ``,
    `I'm coaching you through Arcwell. Your first week is ready: ${days} training ${days === 1 ? "day" : "days"}, built around your goal (${d.client.goal.trim()}).`,
    ``,
    `Install the Arcwell app and sign in with ${d.client.email.trim()} to see it. Your check-ins are due every ${d.client.checkInDay}.`,
  ].join("\n");
}

/** A WhatsApp share address carrying only the message text. */
export const whatsappHref = (message: string) => `https://wa.me/?text=${encodeURIComponent(message)}`;
