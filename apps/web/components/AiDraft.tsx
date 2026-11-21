"use client";

import Link from "next/link";
import { useState } from "react";
import type { DraftCheck, DraftLine } from "@/lib/domain";
import { Button, Card, SectionTitle, buttonClass, inputClass } from "./ui";
import { Icon } from "./icons";

type Decision = "pending" | "accepted" | "rejected";

/**
 * Reviewing an AI draft of a client's next block. Every line is a proposal: the coach accepts,
 * edits or rejects each one, and nothing reaches the client until the coach sends the approved
 * lines. Drafting is Elite only and refused on the server for every other plan.
 */
export function AiDraft({
  clientId,
  clientName,
  lines,
  checks,
  elite,
  used,
  cap,
}: {
  clientId: string;
  clientName: string;
  lines: DraftLine[];
  checks: DraftCheck[];
  elite: boolean;
  used: number;
  cap: number;
}) {
  const [decision, setDecision] = useState<Record<string, Decision>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const first = clientName.split(" ")[0];
  const accepted = lines.filter((l) => decision[l.id] === "accepted");
  const pending = lines.filter((l) => (decision[l.id] ?? "pending") === "pending");
  const nearCap = used >= cap * 0.8;

  return (
    <div>
      {!elite ? (
        <p className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning bg-tintWarning px-4 py-3 text-base text-warning">
          <span>AI drafting is part of Elite. This is how reviewing a draft works; requesting new drafts unlocks on Elite.</span>
          <Link href="/coach/billing" className={buttonClass("secondary")}>
            See plans
          </Link>
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <Card className="mb-5 flex flex-wrap items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-tintBrand text-brandInk" aria-hidden>
              <Icon name="list" size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold">Next block for {first}</p>
              <p className="text-sm text-muted">
                {lines.length} proposed changes · {accepted.length} accepted · {pending.length} to review
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setDecision(Object.fromEntries(lines.map((l) => [l.id, "accepted" as Decision])))}>
                Accept all
              </Button>
              <Button variant="secondary" disabled={!elite}>
                New draft
              </Button>
            </div>
          </Card>

          {sent ? (
            <p role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-success bg-tintSuccess px-4 py-2.5 text-base text-success">
              <Icon name="check" size={15} /> {accepted.length} approved changes added to {first}&apos;s plan. Rejected lines were discarded.
            </p>
          ) : null}

          {lines.length === 0 ? (
            <Card>
              <p className="text-md font-semibold">Nothing to change</p>
              <p className="mt-1 text-base text-muted">The current week already meets the rules. Request a new draft after the next check-in.</p>
            </Card>
          ) : (
            <ol className="space-y-3">
              {lines.map((l) => {
                const d = decision[l.id] ?? "pending";
                const after = edits[l.id] ?? l.after;
                return (
                  <li
                    key={l.id}
                    className={`rounded-xl border bg-card p-4 shadow-sm transition-colors duration-[120ms] ease-quiet ${
                      d === "accepted" ? "border-success" : d === "rejected" ? "border-line opacity-60" : "border-line"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${l.kind === "added" ? "bg-tintSuccess text-success" : l.kind === "removed" ? "bg-tintBrand text-brandInk" : "bg-tintWarning text-warning"}`}>{l.kind}</span>
                      <span className="text-sm text-muted">{l.day}</span>
                      {d !== "pending" ? (
                        <span className={`ml-auto text-sm font-medium ${d === "accepted" ? "text-success" : "text-muted"}`}>{d === "accepted" ? "Accepted" : "Rejected"}</span>
                      ) : null}
                    </div>
                    <div className="mt-2 space-y-1 font-mono text-sm">
                      {l.before ? (
                        <p className="text-muted line-through decoration-[var(--text-faint)]">
                          <span className="sr-only">Before: </span>
                          {l.before}
                        </p>
                      ) : null}
                      {editing === l.id ? (
                        <form
                          className="flex gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            setEditing(null);
                            setDecision((s) => ({ ...s, [l.id]: "accepted" }));
                          }}
                        >
                          <label htmlFor={`edit-${l.id}`} className="sr-only">
                            Edit this line
                          </label>
                          <input id={`edit-${l.id}`} autoFocus value={after} onChange={(e) => setEdits((s) => ({ ...s, [l.id]: e.target.value }))} className={`${inputClass} h-9 font-mono`} />
                          <Button type="submit" className="py-1">
                            Accept
                          </Button>
                        </form>
                      ) : (
                        <p className="text-ink">
                          <span className="sr-only">After: </span>
                          {after}
                          {edits[l.id] ? <span className="ml-2 font-sans text-xs text-muted">edited</span> : null}
                        </p>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted">{l.reason}</p>
                    {editing !== l.id ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant={d === "accepted" ? "primary" : "secondary"} className="py-1" onClick={() => setDecision((s) => ({ ...s, [l.id]: "accepted" }))}>
                          <Icon name="check" size={13} /> Accept
                        </Button>
                        <Button variant="secondary" className="py-1" onClick={() => setEditing(l.id)}>
                          Edit
                        </Button>
                        <Button variant="quiet" className="py-1" onClick={() => setDecision((s) => ({ ...s, [l.id]: "rejected" }))}>
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={() => setSent(true)} disabled={accepted.length === 0 || sent}>
              Add {accepted.length} approved {accepted.length === 1 ? "change" : "changes"} to the plan
            </Button>
            <Link href={`/coach/clients/${clientId}`} className={buttonClass("quiet")}>
              Back to {first}
            </Link>
            <p className="w-full text-sm text-muted">Nothing reaches {first}&apos;s app until you add approved changes to the plan and save it.</p>
          </div>
        </div>

        <aside className="space-y-4">
          <SectionTitle>Checks on this draft</SectionTitle>
          <Card className="space-y-3">
            {checks.map((c) => (
              <div key={c.label} className="flex gap-3">
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${c.ok ? "bg-tintSuccess text-success" : "bg-tintBrand text-brandInk"}`} aria-hidden>
                  <Icon name={c.ok ? "check" : "close"} size={12} />
                </span>
                <div>
                  <p className="text-base font-medium">
                    {c.label}
                    <span className="sr-only">{c.ok ? ": passed" : ": failed"}</span>
                  </p>
                  <p className="text-sm text-muted">{c.detail}</p>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <div className="flex items-baseline justify-between">
              <p className="text-md font-semibold">Drafts this month</p>
              <p className="tnum font-mono text-sm">
                {used} / {cap}
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-raised" aria-hidden>
              <div className={`h-full rounded-full ${nearCap ? "bg-brand" : "bg-ink"}`} style={{ width: `${Math.min(100, (used / cap) * 100)}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted">{nearCap ? `${cap - used} left this month. The count resets on the 1st.` : "Each draft records the model and prompt version used."}</p>
          </Card>
          <p className="text-sm text-muted">The assistant only uses training and nutrition rules and your exercise library. It never gives medical advice, diagnoses injuries or suggests supplements.</p>
        </aside>
      </div>
    </div>
  );
}
