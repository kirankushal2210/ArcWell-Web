"use client";

import Link from "next/link";
import { useState } from "react";
import type { Client, CheckIn, Measurement, Message, PhotoSet, Plan, SAMPLE_WEEK } from "@/lib/data";
import { goalProgress, inr, journeyView, relativeDay, signed, towardGoal, weightChange } from "@/lib/domain";
import { JourneyDetail, JourneyTrack } from "./Journey";
import { AdherenceMeter, Avatar, Button, Card, SectionTitle, StatusBadge, buttonClass } from "./ui";
import { Bars, ProgressRing } from "./charts";
import { Measurements, PhotoStrip, ReportLink, WeightCard } from "./Progress";
import { Icon, type IconName } from "./icons";
import { formatRest } from "@/lib/onboarding";

const TABS = ["Overview", "Journey", "Progress", "Training", "Nutrition", "Recovery"] as const;

/** Each pillar keeps its own icon and colour wherever it appears. */
const TAB_META: Record<(typeof TABS)[number], { icon: IconName; color: string }> = {
  Overview: { icon: "chart", color: "text-ink" },
  Journey: { icon: "calendar", color: "text-brandInk" },
  Progress: { icon: "camera", color: "text-ink" },
  Training: { icon: "dumbbell", color: "text-training" },
  Nutrition: { icon: "list", color: "text-nutrition" },
  Recovery: { icon: "clock", color: "text-recovery" },
};

export function ProfileTabs({
  client,
  plan,
  checkIns,
  messages,
  week,
  measurements,
  photos,
}: {
  client: Client;
  plan: Plan | undefined;
  checkIns: CheckIn[];
  messages: Message[];
  week: typeof SAMPLE_WEEK;
  measurements: Measurement[];
  photos: PhotoSet[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const last = client.weights[client.weights.length - 1] ?? null;
  const change = weightChange(client.weights);
  const toward = towardGoal(client.weights, client.targetKg);
  const progress = goalProgress(client.weights, client.targetKg);
  const toGo = last !== null && client.targetKg !== null ? Math.abs(last - client.targetKg) : null;
  const unreviewed = checkIns.filter((k) => !k.reviewed).length;
  const first = client.name.split(" ")[0];
  const journey = journeyView(client.journey);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        {/* Header: who, what they're working toward, and how it's going. */}
        <Card className="mb-5 p-0">
          <div className="flex flex-wrap items-center gap-5 p-6">
            <Avatar name={client.name} size={64} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-[-0.025em]">{client.name}</h1>
                <StatusBadge status={client.status} />
              </div>
              <p className="mt-1 text-md text-muted">{client.goal}</p>
              <p className="tnum mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-muted">
                <span>Joined {relativeDay(client.joined)}</span>
                <span>Check-in {client.checkInDay}</span>
                <span>{client.email}</span>
              </p>
            </div>
            {progress !== null ? (
              <div className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3">
                <ProgressRing pct={progress} label={`${progress}% of the way to the goal weight`} />
                <div>
                  <p className="text-sm text-muted">To goal</p>
                  <p className="tnum font-mono text-lg font-medium">{toGo?.toFixed(1)} kg</p>
                </div>
              </div>
            ) : null}
          </div>

          <section className="border-t border-line px-6 py-5" aria-labelledby="journey-title">
            <h2 id="journey-title" className="mb-3 text-sm font-medium text-muted">
              Journey
            </h2>
            <JourneyTrack view={journey} />
          </section>

          <div className="flex gap-1 overflow-x-auto border-t border-line px-4" role="tablist" aria-label="Client record">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-base transition-colors duration-[120ms] ease-quiet ${
                  tab === t ? "border-brand font-medium text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                <Icon name={TAB_META[t].icon} size={15} className={tab === t ? TAB_META[t].color : "text-faint"} />
                {t}
              </button>
            ))}
          </div>
        </Card>

        {tab === "Overview" ? (
          <>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="py-4">
                <p className="text-sm text-muted">Adherence, last 4 weeks</p>
                <div className="mt-2">
                  <AdherenceMeter value={client.adherence} size="lg" />
                </div>
              </Card>
              <Card className="py-4">
                <p className="text-sm text-muted">Weight change</p>
                <p className="tnum mt-1 whitespace-nowrap font-mono text-2xl font-medium">
                  {client.weights.length < 2 ? "—" : signed(change, " kg")}
                </p>
                {toward !== null && change !== 0 ? (
                  <span
                    className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium ${
                      toward ? "bg-tintSuccess text-success" : "bg-tintBrand text-brandInk"
                    }`}
                  >
                    <Icon name={change < 0 ? "arrowDown" : "arrowUp"} size={12} />
                    {toward ? "Toward goal" : "Away from goal"}
                  </span>
                ) : (
                  <p className="mt-1 text-sm text-muted">since the first weigh-in</p>
                )}
              </Card>
              <Card className="py-4">
                <p className="text-sm text-muted">Goal weight</p>
                <p className="tnum mt-1 font-mono text-2xl font-medium">{client.targetKg ? `${client.targetKg} kg` : "—"}</p>
                <p className="mt-1 text-sm text-muted">{toGo === null ? "No goal weight set" : `${toGo.toFixed(1)} kg to go`}</p>
              </Card>
            </div>

            <WeightCard client={client} />

            <SectionTitle>This week</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <WeekTile color="bg-training" label="Workouts" value={plan && client.adherence !== null ? `${Math.round(client.adherence / 25)} of 4` : "—"} />
              <WeekTile color="bg-warning" label="Check-ins to review" value={String(unreviewed)} />
              <WeekTile color="bg-recovery" label="Messages" value={String(messages.length)} />
            </div>
          </>
        ) : null}

        {tab === "Journey" ? (
          <JourneyDetail view={journey} startKg={client.weights[0] ?? null} latestKg={last} targetKg={client.targetKg} />
        ) : null}

        {tab === "Progress" ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Measurements</h2>
                <p className="text-sm text-muted">Logged by the client in the app, every three weeks</p>
              </div>
              <ReportLink clientId={client.id} />
            </div>
            <Measurements items={measurements} />
            <div>
              <h2 className="mb-3 text-lg font-semibold">Progress photos</h2>
              <PhotoStrip sets={photos} name={first ?? "The client"} />
            </div>
          </div>
        ) : null}

        {tab === "Training" ? (
          plan && plan.status !== "none" ? (
            <>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">
                  Week {plan.week} <span className="font-normal text-muted">of {plan.weeks}</span>
                </h2>
                <div className="h-2 w-48 overflow-hidden rounded-full bg-raised" aria-hidden>
                  <div className="h-full rounded-full bg-training" style={{ width: `${(plan.week / plan.weeks) * 100}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {plan.days.map((d) => (
                  <Card key={d.name} className="p-0">
                    <p className="border-b border-line px-5 py-3 text-md font-semibold">{d.name}</p>
                    <ul className="divide-y divide-line">
                      {d.exercises.map((e) => (
                        <li key={e.name} className="flex items-center justify-between gap-3 px-5 py-2.5 text-base">
                          <span>{e.name}</span>
                          <span className="tnum font-mono text-sm text-muted">
                            {e.sets} × {e.reps} · {formatRest(e.restSec)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <p className="text-md font-medium">No plan yet</p>
              <p className="mt-1 text-base text-muted">Build the first block from the Plans screen. Their adherence starts counting from the first session.</p>
            </Card>
          )
        ) : null}

        {tab === "Nutrition" ? (
          <Card>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">Calories this week</h2>
              <p className="text-sm text-muted">Red days met the target of {week.calorieTargetKcal.toLocaleString("en-IN")} kcal</p>
            </div>
            <Bars
              values={week.caloriesKcal}
              labels={week.days}
              target={week.calorieTargetKcal}
              highlight="target"
              format={(n) => n.toLocaleString("en-IN")}
              label="Calories per day"
            />
          </Card>
        ) : null}

        {tab === "Recovery" ? (
          <Card>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">Sleep</h2>
              <p className="text-sm text-muted">Hours per night · red nights reached {week.sleepTargetHours} h</p>
            </div>
            <Bars values={week.sleepHours} labels={week.days} target={week.sleepTargetHours} highlight="target" format={(n) => `${n}h`} label="Hours slept" />
          </Card>
        ) : null}
      </div>

      <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <Card>
          <p className="mb-3 text-md font-semibold">Actions</p>
          <div className="space-y-2">
            <Button className="w-full">
              <Icon name="message" size={15} /> Message {first}
            </Button>
            <RailButton icon="check" label="Review check-in" note={unreviewed ? `${unreviewed} waiting` : undefined} />
            <RailButton icon="rupee" label="Renew and request payment" />
            <RailButton icon="list" label="Edit plan" />
            <RailButton icon="send" label="Share progress report" href={`/coach/clients/${client.id}/report`} />
          </div>
        </Card>
        <Card>
          <p className="mb-3 text-md font-semibold">Account</p>
          <dl className="space-y-2.5 text-base">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Fee</dt>
              <dd className="tnum font-mono font-medium">{client.feeInr ? `${inr(client.feeInr)}/mo` : "Not set"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Renews</dt>
              <dd className="tnum font-mono">{relativeDay(client.nextRenewal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Last check-in</dt>
              <dd className="tnum font-mono">{relativeDay(client.lastCheckIn)}</dd>
            </div>
          </dl>
        </Card>
      </aside>
    </div>
  );
}

function WeekTile({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <Card className="py-4">
      <p className="flex items-center gap-2 text-sm text-muted">
        <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden />
        {label}
      </p>
      <p className="tnum mt-1 font-mono text-2xl font-medium">{value}</p>
    </Card>
  );
}

function RailButton({ icon, label, note, href }: { icon: IconName; label: string; note?: string; href?: string }) {
  const inner = (
    <>
      <Icon name={icon} size={15} className="text-muted" />
      <span className="flex-1 text-left">{label}</span>
      {note ? <span className="tnum rounded-full bg-tintBrand px-2 font-mono text-xs text-brandInk">{note}</span> : null}
    </>
  );
  return href ? (
    <Link href={href} className={`${buttonClass("secondary")} w-full justify-start`}>
      {inner}
    </Link>
  ) : (
    <Button variant="secondary" className="w-full justify-start">
      {inner}
    </Button>
  );
}
