// Pure helpers: sorting, filtering and the numbers the screens show. No React, no data fetching,
// so these are the functions a unit test suite would cover first.

import type { CheckIn, Client, ClientStatus, FormerClient, Journey, JourneyStage, Message } from "./data";

export const STATUS_ORDER: Record<ClientStatus, number> = {
  active: 0,
  leaving: 1,
  paused: 2,
  completed: 3,
};

export type SortKey = "name" | "status" | "adherence" | "renewal";
export type SortDir = "asc" | "desc";
/** The five filters from the clients-list spec. */
export type Filter = "all" | "attention" | "overdue" | "renewing" | "paused";

export const FILTER_LABELS: Record<Filter, string> = {
  all: "Everyone",
  attention: "Needs attention",
  overdue: "Overdue check-ins",
  renewing: "Renewing this week",
  paused: "Paused",
};

/** A weekly check-in is overdue once the last one is more than seven days old, or never came. */
export function checkInOverdue(client: Client, today: Date = new Date()): boolean {
  if (client.status !== "active") return false;
  const d = daysUntil(client.lastCheckIn, today);
  return d === null ? client.journey.started.transformation !== null : d < -7;
}

export function renewingThisWeek(client: Client, today: Date = new Date()): boolean {
  const d = daysUntil(client.nextRenewal, today);
  return d !== null && d >= 0 && d <= 7;
}

export function matches(client: Client, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    client.name.toLowerCase().includes(q) ||
    client.goal.toLowerCase().includes(q) ||
    client.email.toLowerCase().includes(q)
  );
}

export function needsAttention(client: Client): boolean {
  return !!client.attention || (client.adherence !== null && client.adherence < 60) || client.unread > 0;
}

function passes(c: Client, filter: Filter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "attention":
      return needsAttention(c);
    case "overdue":
      return checkInOverdue(c);
    case "renewing":
      return renewingThisWeek(c);
    case "paused":
      return c.status === "paused";
  }
}

/** Filter, journey stage and search combine: a client must pass all three. */
export function filterClients(clients: Client[], filter: Filter, query: string, stage: JourneyStage | "all" = "all"): Client[] {
  return clients.filter(
    (c) => matches(c, query) && passes(c, filter) && (stage === "all" || journeyView(c.journey).stage === stage),
  );
}

export function sortClients(clients: Client[], key: SortKey, dir: SortDir): Client[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...clients].sort((a, b) => {
    switch (key) {
      case "name":
        return factor * a.name.localeCompare(b.name);
      case "status":
        return factor * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
      case "adherence": {
        if (a.adherence === null && b.adherence === null) return 0;
        if (a.adherence === null) return 1; // unknown always last
        if (b.adherence === null) return -1;
        return factor * (a.adherence - b.adherence);
      }
      case "renewal": {
        if (!a.nextRenewal && !b.nextRenewal) return 0;
        if (!a.nextRenewal) return 1;
        if (!b.nextRenewal) return -1;
        return factor * a.nextRenewal.localeCompare(b.nextRenewal);
      }
    }
  });
}

export function counts(clients: Client[]): Record<Filter, number> {
  return {
    all: clients.length,
    attention: clients.filter(needsAttention).length,
    overdue: clients.filter((c) => checkInOverdue(c)).length,
    renewing: clients.filter((c) => renewingThisWeek(c)).length,
    paused: clients.filter((c) => c.status === "paused").length,
  };
}

/** Weight change since the first recorded weigh-in. */
export function weightChange(weights: number[]): number {
  if (weights.length < 2) return 0;
  const first = weights[0] as number;
  const last = weights[weights.length - 1] as number;
  return Math.round((last - first) * 10) / 10;
}

export const signed = (n: number, unit = "") =>
  `${n > 0 ? "+" : ""}${n.toFixed(1)}${unit}`;

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function relativeDay(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `in ${diff} days`;
}

/* ------------------------------------------------------------ adherence band */

export type Band = "strong" | "slipping" | "behind";

/** The three adherence bands every meter, chart and badge agrees on. */
export function adherenceBand(pct: number): Band {
  if (pct >= 75) return "strong";
  if (pct >= 50) return "slipping";
  return "behind";
}

export const BAND_LABEL: Record<Band, string> = {
  strong: "On track",
  slipping: "Slipping",
  behind: "Behind",
};

/** Ten plates on the bar: how many are loaded for a percentage. */
export const platesFor = (pct: number, total = 10) => Math.max(0, Math.min(total, Math.round((pct / 100) * total)));

/* ------------------------------------------------------------------ avatars */

export type Tone = "brand" | "success" | "info" | "warning" | "neutral";
const TONES: Tone[] = ["brand", "success", "info", "warning", "neutral"];

/** A stable tone per person, so the same client always reads as the same colour. */
export function toneFor(name: string): Tone {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length] as Tone;
}

export const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();

/* -------------------------------------------------------------------- dates */

export function daysUntil(iso: string | null, now: Date = new Date()): number | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

/** "Sun 22 Nov" for the top bar. */
export function shortDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/* -------------------------------------------------------------------- money */

/** Compact rupees for axis labels: ₹68k, ₹1.2L. */
export function inrCompact(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${Math.round(n / 1000)}k`;
  return `₹${n}`;
}

/** Percentage change from the previous value, rounded, or null with nothing to compare. */
export function pctChange(prev: number | undefined, now: number | undefined): number | null {
  if (prev === undefined || now === undefined || prev === 0) return null;
  return Math.round(((now - prev) / prev) * 100);
}

/* --------------------------------------------------------------- plan usage */

export type PlanUsage = { active: number; limit: number; pct: number; over: boolean };

/** Active clients against the plan's limit. Only active clients count toward it. */
export function planUsage(clients: Client[], limit: number): PlanUsage {
  const active = clients.filter((c) => c.status === "active").length;
  return { active, limit, pct: Math.min(100, Math.round((active / limit) * 100)), over: active > limit };
}

/* ------------------------------------------------------------ goal progress */

/**
 * How far a client has come from their first weigh-in toward the target, 0–100, or null when
 * there is no target or not enough weigh-ins. Moving away from the goal counts as 0, not negative.
 */
export function goalProgress(weights: number[], target: number | null): number | null {
  if (target == null || weights.length < 2) return null;
  const start = weights[0] as number;
  const now = weights[weights.length - 1] as number;
  const total = start - target;
  if (total === 0) return 100;
  return Math.max(0, Math.min(100, Math.round(((start - now) / total) * 100)));
}

/** Whether a weight change moves toward the target. */
export function towardGoal(weights: number[], target: number | null): boolean | null {
  if (target == null || weights.length < 2) return null;
  const start = weights[0] as number;
  const now = weights[weights.length - 1] as number;
  return Math.abs(now - target) < Math.abs(start - target);
}

/* ------------------------------------------------------------ activity feed */

export type Activity = {
  id: string;
  clientId: string;
  clientName: string;
  kind: "checkin" | "message";
  text: string;
  detail: string;
  at: string;
};

/** What clients did most recently: check-ins submitted and messages sent, newest first. */
export function recentActivity(checkIns: CheckIn[], messages: Message[], limit = 8): Activity[] {
  const fromCheckIns: Activity[] = checkIns.map((k) => ({
    id: `a-${k.id}`,
    clientId: k.clientId,
    clientName: k.clientName,
    kind: "checkin",
    text: `submitted the week ${k.week} check-in`,
    detail: [k.weightKg ? `${k.weightKg} kg` : null, k.photos ? `${k.photos} ${k.photos === 1 ? "photo" : "photos"}` : null]
      .filter(Boolean)
      .join(" · "),
    at: k.submittedAt,
  }));
  const fromMessages: Activity[] = messages
    .filter((m) => m.from === "client")
    .map((m) => ({
      id: `a-${m.id}`,
      clientId: m.clientId,
      clientName: m.clientName,
      kind: "message",
      text: "sent a message",
      detail: m.text,
      at: m.at,
    }));
  return [...fromCheckIns, ...fromMessages].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/* ------------------------------------------------------------------ journey */

export const JOURNEY_STAGES: { key: JourneyStage; label: string; hint: string }[] = [
  { key: "onboarding", label: "Onboarding", hint: "Plan, app and first check-in" },
  { key: "transformation", label: "Transformation", hint: "The main block toward the goal" },
  { key: "maintenance", label: "Maintenance", hint: "Holding the result" },
  { key: "ongoing", label: "Ongoing coaching", hint: "Long-term, after the result" },
];

export type StageState = "done" | "current" | "upcoming";

export type StageView = {
  key: JourneyStage;
  label: string;
  hint: string;
  state: StageState;
  /** When it began, or when it is planned to begin; null when it cannot be planned yet. */
  start: string | null;
  planned: boolean;
  /** Planned length in weeks, for the blocks that have one. */
  weeks: number | null;
};

export type JourneyView = {
  stage: JourneyStage;
  stages: StageView[];
  /** Week within the current block, and its planned length (null for open-ended stages). */
  week: number;
  totalWeeks: number | null;
  pct: number | null;
  weeksLeft: number | null;
  next: { text: string; urgent: boolean };
  milestones: Milestone[];
};

export type Milestone = { date: string; label: string; detail?: string; state: "done" | "upcoming" };

const DAY = 86400000;
const toDate = (iso: string) => new Date(`${iso}T00:00:00`);
// Calendar arithmetic in UTC, so the result never slips a day in timezones ahead of UTC.
const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
const weeksBetween = (fromIso: string, to: Date) => Math.floor((to.getTime() - toDate(fromIso).getTime()) / (7 * DAY));

/** Short date for timelines: "3 Mar 2026". */
export const longDate = (iso: string) =>
  toDate(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Where a client is in their journey, and what that means for the coach today. */
export function journeyView(j: Journey, today: Date = new Date()): JourneyView {
  const order: JourneyStage[] = ["onboarding", "transformation", "maintenance", "ongoing"];
  const stage = [...order].reverse().find((k) => j.started[k] !== null) ?? "onboarding";
  const currentIndex = order.indexOf(stage);

  // Planned starts for stages not reached yet, chained from the last known date.
  const tStart = j.started.transformation;
  const mStart = j.started.maintenance ?? (tStart ? addDays(tStart, j.transformationWeeks * 7) : null);
  const oStart = j.started.ongoing ?? (mStart ? addDays(mStart, j.maintenanceWeeks * 7) : null);
  const starts: Record<JourneyStage, string | null> = {
    onboarding: j.started.onboarding,
    transformation: tStart,
    maintenance: mStart,
    ongoing: oStart,
  };
  const lengths: Record<JourneyStage, number | null> = {
    onboarding: null, // open-ended: it lasts until the first plan starts the transformation
    transformation: j.transformationWeeks,
    maintenance: j.maintenanceWeeks,
    ongoing: null,
  };

  const stages: StageView[] = JOURNEY_STAGES.map((s, i) => ({
    ...s,
    state: i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming",
    start: starts[s.key],
    planned: j.started[s.key] === null && starts[s.key] !== null,
    weeks: lengths[s.key],
  }));

  const since = starts[stage] as string;
  const total = lengths[stage];
  const week = Math.max(1, weeksBetween(since, today) + 1);
  const pct = total ? Math.min(100, Math.round((Math.min(week, total) / total) * 100)) : null;
  const weeksLeft = total ? Math.max(0, total - week + 1) : null;

  return { stage, stages, week, totalWeeks: total, pct, weeksLeft, next: nextFor(stage, week, weeksLeft, j), milestones: milestonesFor(j, starts, today) };
}

function nextFor(stage: JourneyStage, week: number, weeksLeft: number | null, j: Journey): { text: string; urgent: boolean } {
  switch (stage) {
    case "onboarding":
      return { text: "Build their first plan so the transformation can start", urgent: true };
    case "transformation":
      if (weeksLeft !== null && weeksLeft <= 3)
        return { text: `Transformation ends in ${weeksLeft} ${weeksLeft === 1 ? "week" : "weeks"}. Plan their maintenance block now`, urgent: true };
      if (week === Math.ceil(j.transformationWeeks / 2))
        return { text: "Halfway through. A good week for progress photos and a review call", urgent: false };
      return { text: `Keep them logging. Maintenance is planned after week ${j.transformationWeeks}`, urgent: false };
    case "maintenance":
      if (weeksLeft !== null && weeksLeft <= 2)
        return { text: "Maintenance is nearly done. Agree what ongoing coaching looks like", urgent: true };
      return { text: "Hold the result: keep calories and training steady, and check-ins weekly", urgent: false };
    case "ongoing":
      return { text: `Coached for ${week} weeks since maintenance. Keep check-ins regular so they stay`, urgent: false };
  }
}

function milestonesFor(j: Journey, starts: Record<JourneyStage, string | null>, today: Date): Milestone[] {
  const out: Milestone[] = [];
  const state = (iso: string): Milestone["state"] => (toDate(iso).getTime() <= today.getTime() ? "done" : "upcoming");
  const push = (date: string | null, label: string, detail?: string) => {
    if (date) out.push({ date, label, detail, state: state(date) });
  };

  push(starts.onboarding, "Enrolled through your link", "Onboarding began");
  push(starts.transformation, "Transformation started", `${j.transformationWeeks}-week block`);
  if (starts.transformation) push(addDays(starts.transformation, Math.round((j.transformationWeeks / 2) * 7)), "Halfway point", "Photos and a review call");
  push(starts.maintenance, "Transformation ends", "Maintenance begins");
  push(starts.ongoing, "Maintenance ends", "Ongoing coaching begins");
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** How many clients sit in each stage. */
export function stageCounts(clients: Client[]): Record<JourneyStage, number> {
  const counts: Record<JourneyStage, number> = { onboarding: 0, transformation: 0, maintenance: 0, ongoing: 0 };
  for (const c of clients) counts[journeyView(c.journey).stage] += 1;
  return counts;
}

/* ---------------------------------------------------------------- retention */

export type RetentionSummary = {
  current: number;
  former: number;
  /** Of everyone who finished a transformation, how many are still coached. Null with nobody yet. */
  stayedAfterTransformationPct: number | null;
  stayedAfterTransformation: number;
  finishedTransformation: number;
  leftByStage: Record<JourneyStage, number>;
  /** The client who has been with the coach longest, and since when. */
  longest: { name: string; since: string } | null;
};

export function retentionSummary(clients: Client[], former: FormerClient[], today: Date = new Date()): RetentionSummary {
  const stages = clients.map((c) => journeyView(c.journey, today).stage);
  const stayed = stages.filter((s) => s === "maintenance" || s === "ongoing").length;
  const leftAfter = former.filter((f) => f.stageAtExit === "maintenance" || f.stageAtExit === "ongoing").length;
  const finished = stayed + leftAfter;
  const leftByStage: Record<JourneyStage, number> = { onboarding: 0, transformation: 0, maintenance: 0, ongoing: 0 };
  for (const f of former) leftByStage[f.stageAtExit] += 1;
  const oldest = [...clients].sort((a, b) => a.joined.localeCompare(b.joined))[0];
  return {
    current: clients.length,
    former: former.length,
    stayedAfterTransformation: stayed,
    finishedTransformation: finished,
    stayedAfterTransformationPct: finished ? Math.round((stayed / finished) * 100) : null,
    leftByStage,
    longest: oldest ? { name: oldest.name, since: oldest.joined } : null,
  };
}

/** Whole months between two dates, for "with you 7 months". */
export function monthsBetween(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00`);
  const b = new Date(`${toIso}T00:00:00`);
  return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) - (b.getDate() < a.getDate() ? 1 : 0));
}

export const tenureLabel = (months: number) =>
  months < 1 ? "under a month" : `${months} ${months === 1 ? "month" : "months"}`;

/** A short flag for a board card when the stage needs the coach soon, otherwise null. */
export function journeyFlag(v: JourneyView): string | null {
  if (!v.next.urgent) return null;
  if (v.stage === "onboarding") return "Needs a first plan";
  if (v.stage === "transformation") return `Ends in ${v.weeksLeft} ${v.weeksLeft === 1 ? "week" : "weeks"}`;
  if (v.stage === "maintenance") return "Maintenance ending";
  return null;
}

/* ---------------------------------------------------------------- progress */

/**
 * Weigh-ins are weekly; the last one is the latest check-in (or today without one). Returns one
 * ISO date per weight, oldest first.
 */
export function weighInDates(client: Client, today: Date = new Date()): string[] {
  const last = client.lastCheckIn ?? today.toISOString().slice(0, 10);
  const n = client.weights.length;
  return client.weights.map((_, i) => addDays(last, -(n - 1 - i) * 7));
}

export type Range = "4w" | "12w" | "all";
export const RANGE_LABELS: Record<Range, string> = { "4w": "4 weeks", "12w": "12 weeks", all: "All" };

/** The weigh-ins inside a range, with how many exist in total so the chart can say so. */
export function inRange(values: number[], dates: string[], range: Range) {
  const keep = range === "4w" ? 4 : range === "12w" ? 12 : values.length;
  const from = Math.max(0, values.length - keep);
  return { values: values.slice(from), dates: dates.slice(from), short: keep > values.length && range !== "all" };
}

export function measurementChange(m: { entries: { value: number }[] }): number | null {
  if (m.entries.length < 2) return null;
  return Math.round(((m.entries[m.entries.length - 1] as { value: number }).value - (m.entries[0] as { value: number }).value) * 10) / 10;
}
