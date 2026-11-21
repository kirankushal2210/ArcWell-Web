"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CheckIn, Client } from "@/lib/data";
import { QUICK_REPLIES, longDate, nextDueDate, queueOrder, relativeDay, reviewOverdue } from "@/lib/domain";
import { AdherenceMeter, Avatar, Button, Card, Empty, Kbd, inputClass } from "./ui";
import { Icon } from "./icons";
import { Lightbox, PhotoFrame } from "./Lightbox";
import { LineChart } from "./charts";

/**
 * The review queue: clear a week of check-ins with the keyboard. J/K move, R replies,
 * Ctrl/Cmd+Enter sends and marks reviewed, Esc leaves the reply box, ? lists the keys.
 * Bulk mark-reviewed only changes state; it never sends a reply.
 */
export function CheckInReview({ checkIns, clients }: { checkIns: CheckIn[]; clients: Client[] }) {
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(() => new Set(checkIns.filter((k) => k.reviewed).map((k) => k.id)));
  const isReviewed = useCallback((k: CheckIn) => reviewedIds.has(k.id), [reviewedIds]);
  const queue = useMemo(() => queueOrder(checkIns, isReviewed), [checkIns, isReviewed]);
  const waiting = queue.filter((k) => !isReviewed(k));
  const done = queue.filter(isReviewed);

  const [activeId, setActiveId] = useState(waiting[0]?.id ?? queue[0]?.id);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showDone, setShowDone] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<Record<string, string>>({});
  const [help, setHelp] = useState(false);
  const [photo, setPhoto] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const active = queue.find((k) => k.id === activeId) ?? queue[0];
  const client = clients.find((c) => c.id === active?.clientId);
  const reply = active ? drafts[active.id] ?? "" : "";

  const visibleOrder = showDone ? queue : waiting;
  const move = useCallback(
    (by: number) => {
      if (!visibleOrder.length) return;
      const i = Math.max(0, visibleOrder.findIndex((k) => k.id === active?.id));
      const next = visibleOrder[Math.max(0, Math.min(visibleOrder.length - 1, i + by))];
      if (next) setActiveId(next.id);
    },
    [visibleOrder, active?.id],
  );

  const markReviewed = (ids: string[]) =>
    setReviewedIds((s) => {
      const n = new Set(s);
      ids.forEach((id) => n.add(id));
      return n;
    });

  const sendAndReview = useCallback(() => {
    if (!active || !reply.trim()) return;
    setSent((s) => ({ ...s, [active.id]: reply.trim() }));
    setDrafts((d) => ({ ...d, [active.id]: "" }));
    markReviewed([active.id]);
    setNotice(`Reply sent to ${active.clientName} and marked reviewed`);
    // Move on to the next waiting check-in, which is what a coach clearing the queue wants.
    const next = waiting.find((k) => k.id !== active.id);
    if (next) setActiveId(next.id);
    replyRef.current?.blur();
  }, [active, reply, waiting]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (photo !== null) return;
      const typing = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;
      if (typing) {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && e.target === replyRef.current) {
          e.preventDefault();
          sendAndReview();
        }
        return;
      }
      if (e.key === "j") move(1);
      else if (e.key === "k") move(-1);
      else if (e.key === "r") {
        e.preventDefault();
        replyRef.current?.focus();
      } else if (e.key === "?") setHelp((h) => !h);
      else if (e.key === "Escape") setHelp(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [move, sendAndReview, photo]);

  if (!active) {
    return <Empty title="No check-ins waiting" body="Check-ins appear here as clients submit them from the app." />;
  }

  if (waiting.length === 0 && !showDone) {
    const soonest = clients
      .filter((c) => c.status === "active")
      .map((c) => nextDueDate(c.checkInDay))
      .sort()[0];
    return (
      <Empty
        title="No check-ins waiting"
        body={`Every check-in is reviewed. The next one is due ${soonest ? longDate(soonest) : "soon"}.`}
        action={
          <Button variant="secondary" onClick={() => setShowDone(true)}>
            Show reviewed
          </Button>
        }
      />
    );
  }

  const photos = Array.from({ length: active.photos }, (_, i) => ({
    title: ["Front", "Side", "Back"][i % 3] as string,
    caption: `Week ${active.week} · ${longDate(active.submittedAt)}`,
  }));

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="flex max-h-[calc(100vh-220px)] flex-col overflow-hidden rounded-xl border border-line bg-card shadow-sm">
        {selected.size > 0 ? (
          <div className="flex items-center justify-between gap-2 border-b border-line bg-tintBrand px-4 py-2">
            <span className="tnum text-sm font-medium">{selected.size} selected</span>
            <div className="flex gap-1">
              <Button variant="quiet" onClick={() => setSelected(new Set())} className="px-2 py-1">
                Clear
              </Button>
              <Button
                className="px-2.5 py-1"
                onClick={() => {
                  markReviewed([...selected]);
                  setNotice(`${selected.size} check-ins marked reviewed. No replies were sent.`);
                  setSelected(new Set());
                }}
              >
                Mark reviewed
              </Button>
            </div>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <QueueGroup
            title="Waiting"
            items={waiting}
            activeId={active.id}
            onPick={setActiveId}
            selected={selected}
            onToggle={toggle}
            isReviewed={isReviewed}
          />
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            aria-expanded={showDone}
            className="flex w-full items-center justify-between border-b border-line bg-surface px-4 py-2 text-sm font-medium text-muted hover:text-ink"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="chevron" size={13} className={`transition-transform duration-[120ms] ease-quiet ${showDone ? "rotate-90" : ""}`} />
              Reviewed
            </span>
            <span className="tnum font-mono text-xs">{done.length}</span>
          </button>
          {showDone ? (
            <QueueGroup items={done} activeId={active.id} onPick={setActiveId} selected={selected} onToggle={toggle} isReviewed={isReviewed} />
          ) : null}
        </div>
      </div>

      <div className="min-w-0">
        <p className="sr-only" role="status" aria-live="polite">
          {notice}
        </p>
        {notice ? (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-success bg-tintSuccess px-4 py-2.5 text-base text-success" aria-hidden>
            <span className="flex items-center gap-2">
              <Icon name="check" size={15} /> {notice}
            </span>
            <button type="button" onClick={() => setNotice("")} className="text-success" aria-label="Dismiss">
              <Icon name="close" size={14} />
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="p-0">
            <div className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-5">
              <Avatar name={active.clientName} size={48} />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-semibold tracking-[-0.015em]">{active.clientName}</p>
                <p className="tnum font-mono text-sm text-muted">
                  Week {active.week} · submitted {relativeDay(active.submittedAt)}
                </p>
              </div>
              {isReviewed(active) ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-tintSuccess px-2.5 py-1 text-sm font-medium text-success">
                  <Icon name="check" size={13} /> Reviewed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-tintBrand px-2.5 py-1 text-sm font-medium text-brandInk">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                  {reviewOverdue(active, false) ? "Overdue" : "Waiting"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 border-b border-line px-6 py-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted">Weigh-in</p>
                <p className="tnum font-mono text-lg font-medium">{active.weightKg ? `${active.weightKg} kg` : "—"}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-muted">Plan adherence</p>
                <AdherenceMeter value={client?.adherence ?? null} />
              </div>
              <div>
                <p className="text-sm text-muted">Goal</p>
                <p className="truncate text-base">{client?.goal ?? "—"}</p>
              </div>
            </div>

            {client && client.weights.length > 1 ? (
              <div className="border-b border-line px-6 py-4">
                <p className="mb-1 text-sm font-medium text-muted">Weekly weights</p>
                <LineChart values={client.weights} target={client.targetKg} height={130} startLabel="8 weeks ago" endLabel="This week" />
              </div>
            ) : null}

            <dl className="divide-y divide-line">
              {active.answers.map((a) => (
                <div key={a.question} className="grid grid-cols-1 gap-1 px-6 py-4 md:grid-cols-[200px_1fr] md:gap-6">
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
                  {photos.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPhoto(i)}
                      aria-label={`${p.title} photo, open full size`}
                      className="grid h-32 w-24 place-items-center rounded-lg border border-line bg-surface transition-[border-color,transform] duration-[120ms] ease-quiet hover:border-strong active:scale-[0.97]"
                    >
                      <PhotoFrame label={p.title} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-4 2xl:sticky 2xl:top-20 2xl:self-start">
            <Card>
              <label htmlFor="checkin-reply" className="mb-2 block text-md font-semibold">
                Reply to {active.clientName.split(" ")[0]}
              </label>
              <textarea
                id="checkin-reply"
                ref={replyRef}
                value={reply}
                onChange={(e) => setDrafts((d) => ({ ...d, [active.id]: e.target.value }))}
                rows={5}
                placeholder="What you want them to change this week"
                className={`${inputClass} resize-y py-2.5 leading-6`}
              />
              <p className="mb-2 mt-3 text-sm font-medium text-muted">Quick replies</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setDrafts((d) => ({ ...d, [active.id]: [reply.trim(), q].filter(Boolean).join(" ") }));
                      replyRef.current?.focus();
                    }}
                    className="rounded-lg border border-line px-2 py-1 text-left text-sm text-muted transition-colors duration-[120ms] ease-quiet hover:border-strong hover:text-ink"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={sendAndReview} disabled={!reply.trim()}>
                  <Icon name="send" size={14} /> Send and mark reviewed
                </Button>
                {!isReviewed(active) ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      markReviewed([active.id]);
                      setNotice(`${active.clientName}'s check-in marked reviewed. No reply sent.`);
                    }}
                  >
                    Mark reviewed
                  </Button>
                ) : null}
              </div>
              {sent[active.id] ? (
                <div className="mt-4 rounded-lg bg-surface px-3 py-2.5">
                  <p className="text-xs text-muted">You replied</p>
                  <p className="text-base">{sent[active.id]}</p>
                </div>
              ) : null}
            </Card>
            <button type="button" onClick={() => setHelp(true)} className="flex items-center gap-2 text-sm text-muted hover:text-ink">
              <Kbd>?</Kbd> Keyboard shortcuts
            </button>
          </div>
        </div>
      </div>

      {help ? <ShortcutHelp onClose={() => setHelp(false)} /> : null}
      {photo !== null ? <Lightbox items={photos} index={photo} onIndex={setPhoto} onClose={() => setPhoto(null)} /> : null}
    </div>
  );
}

function QueueGroup({
  title,
  items,
  activeId,
  onPick,
  selected,
  onToggle,
  isReviewed,
}: {
  title?: string;
  items: CheckIn[];
  activeId: string;
  onPick: (id: string) => void;
  selected: Set<string>;
  onToggle: (id: string) => void;
  isReviewed: (k: CheckIn) => boolean;
}) {
  return (
    <div>
      {title ? (
        <p className="sticky top-0 z-[1] flex items-center justify-between border-b border-line bg-surface px-4 py-2 text-sm font-medium text-muted">
          {title}
          <span className="tnum font-mono text-xs">{items.length}</span>
        </p>
      ) : null}
      {items.length === 0 ? <p className="px-4 py-4 text-sm text-muted">Nothing here.</p> : null}
      <ul>
        {items.map((k) => {
          const on = k.id === activeId;
          const done = isReviewed(k);
          const overdue = reviewOverdue(k, done);
          return (
            <li key={k.id} className={`relative flex items-center border-b border-line transition-colors duration-[120ms] ease-quiet ${on ? "bg-tintBrand" : "hover:bg-surface"}`}>
              {on ? <span className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden /> : null}
              {!done ? (
                <input
                  type="checkbox"
                  checked={selected.has(k.id)}
                  onChange={() => onToggle(k.id)}
                  aria-label={`Select ${k.clientName}'s check-in`}
                  className="ml-4 h-4 w-4 shrink-0 accent-[var(--brand)]"
                />
              ) : (
                <span className="ml-4 w-4 shrink-0" aria-hidden />
              )}
              <button onClick={() => onPick(k.id)} aria-current={on ? "true" : undefined} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left">
                <Avatar name={k.clientName} size={32} />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-base ${done ? "text-muted" : "font-medium"}`}>{k.clientName}</span>
                  <span className="tnum flex items-center gap-2 whitespace-nowrap font-mono text-xs text-muted">
                    Week {k.week} · {relativeDay(k.submittedAt)}
                    {k.photos ? (
                      <span className="inline-flex items-center gap-0.5">
                        <Icon name="camera" size={11} />
                        {k.photos}
                        <span className="sr-only"> photos</span>
                      </span>
                    ) : null}
                  </span>
                </span>
                {done ? (
                  <Icon name="check" size={14} className="text-success" />
                ) : overdue ? (
                  <span className="rounded-full bg-brand px-1.5 py-0.5 text-2xs font-medium text-onBrand">Overdue</span>
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

const SHORTCUTS: [string[], string][] = [
  [["J"], "Next check-in"],
  [["K"], "Previous check-in"],
  [["R"], "Write a reply"],
  [["Ctrl", "Enter"], "Send the reply and mark reviewed (⌘ on a Mac)"],
  [["Esc"], "Leave the reply box"],
  [["?"], "Show or hide this list"],
];

function ShortcutHelp({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[color-mix(in_srgb,var(--text)_50%,transparent)] p-6" role="dialog" aria-modal="true" aria-labelledby="kb-title" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-line bg-card p-5 shadow-md" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 id="kb-title" className="text-lg font-semibold">
            Keyboard shortcuts
          </h2>
          <button ref={ref} type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface hover:text-ink">
            <Icon name="close" size={16} />
          </button>
        </div>
        <dl className="space-y-2.5">
          {SHORTCUTS.map(([keys, what]) => (
            <div key={what} className="flex items-center justify-between gap-4 text-base">
              <dt className="text-muted">{what}</dt>
              <dd className="flex shrink-0 gap-1">
                {keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
