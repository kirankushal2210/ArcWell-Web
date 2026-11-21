"use client";

import { useState } from "react";
import type { CheckIn } from "@/lib/data";
import { relativeDay } from "@/lib/domain";
import { Avatar, Button, Card, Empty, Kbd, inputClass } from "./ui";
import { Icon } from "./icons";

export function CheckInReview({ checkIns }: { checkIns: CheckIn[] }) {
  const [activeId, setActiveId] = useState(checkIns[0]?.id);
  const [reply, setReply] = useState("");
  const active = checkIns.find((k) => k.id === activeId) ?? checkIns[0];

  if (!active) return <Empty title="No check-ins waiting" body="The next one is due on Monday." />;

  const waiting = checkIns.filter((k) => !k.reviewed);
  const done = checkIns.filter((k) => k.reviewed);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="max-h-[calc(100vh-220px)] overflow-y-auto rounded-xl border border-line bg-card shadow-sm">
        <QueueGroup title="Waiting" count={waiting.length} items={waiting} activeId={active.id} onPick={setActiveId} />
        <QueueGroup title="Reviewed" count={done.length} items={done} activeId={active.id} onPick={setActiveId} />
      </div>

      <div className="min-w-0 space-y-5">
        <Card className="p-0">
          <div className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-5">
            <Avatar name={active.clientName} size={48} />
            <div className="min-w-0 flex-1">
              <p className="text-xl font-semibold tracking-[-0.015em]">{active.clientName}</p>
              <p className="tnum font-mono text-sm text-muted">
                Week {active.week} · submitted {relativeDay(active.submittedAt)}
              </p>
            </div>
            {active.weightKg ? (
              <div className="rounded-xl bg-surface px-4 py-2 text-right">
                <p className="text-xs text-muted">Weigh-in</p>
                <p className="tnum font-mono text-lg font-medium">{active.weightKg} kg</p>
              </div>
            ) : null}
            {active.reviewed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-tintSuccess px-2.5 py-1 text-sm font-medium text-success">
                <Icon name="check" size={13} /> Reviewed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-tintBrand px-2.5 py-1 text-sm font-medium text-brandInk">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden /> Waiting
              </span>
            )}
          </div>

          <dl className="divide-y divide-line">
            {active.answers.map((a) => (
              <div key={a.question} className="grid grid-cols-1 gap-1 px-6 py-4 md:grid-cols-[220px_1fr] md:gap-6">
                <dt className="text-sm text-muted">{a.question}</dt>
                <dd className="text-md leading-6">{a.answer}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-line px-6 py-4">
            <p className="mb-3 text-sm font-medium text-muted">Progress photos</p>
            {active.photos === 0 ? (
              <p className="text-base text-muted">No photos this week.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: active.photos }).map((_, i) => (
                  <div
                    key={i}
                    className="grid h-28 w-24 place-items-center rounded-lg border border-line bg-surface text-faint"
                    aria-label={`Photo ${i + 1} of ${active.photos}`}
                    role="img"
                  >
                    <span className="flex flex-col items-center gap-1">
                      <Icon name="camera" size={18} />
                      <span className="tnum font-mono text-2xs">{i + 1}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <label htmlFor="checkin-reply" className="mb-2 block text-md font-semibold">
            Reply to {active.clientName.split(" ")[0]}
          </label>
          <textarea
            id="checkin-reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
            placeholder="What you want them to change this week"
            className={`${inputClass} resize-y py-2.5 leading-6`}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button onClick={() => setReply("")}>
              <Icon name="send" size={14} /> Send and mark reviewed
            </Button>
            <Button variant="secondary">Mark reviewed</Button>
            <span className="ml-auto flex items-center gap-3 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Kbd>J</Kbd>
                <Kbd>K</Kbd> move
              </span>
              <span className="flex items-center gap-1">
                <Kbd>R</Kbd> reply
              </span>
              <span className="flex items-center gap-1">
                <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd> send
              </span>
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function QueueGroup({
  title,
  count,
  items,
  activeId,
  onPick,
}: {
  title: string;
  count: number;
  items: CheckIn[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="sticky top-0 z-[1] flex items-center justify-between border-b border-line bg-surface px-4 py-2 text-sm font-medium text-muted">
        {title}
        <span className="tnum font-mono text-xs">{count}</span>
      </p>
      <ul>
        {items.map((k) => {
          const on = k.id === activeId;
          return (
            <li key={k.id}>
              <button
                onClick={() => onPick(k.id)}
                aria-current={on ? "true" : undefined}
                className={`relative flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors duration-[120ms] ease-quiet ${
                  on ? "bg-tintBrand" : "hover:bg-surface"
                }`}
              >
                {on ? <span className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden /> : null}
                <Avatar name={k.clientName} size={32} />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-base ${k.reviewed ? "text-muted" : "font-medium"}`}>{k.clientName}</span>
                  <span className="tnum block font-mono text-xs text-muted">
                    Week {k.week} · {relativeDay(k.submittedAt)}
                  </span>
                </span>
                {k.reviewed ? (
                  <Icon name="check" size={14} className="text-success" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-brand" aria-label="Not reviewed" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
