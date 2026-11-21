"use client";

import { useMemo, useState } from "react";
import type { Client, FormerClient, Lead, LeadStage } from "@/lib/data";
import {
  JOURNEY_STAGES,
  LEAD_STAGES,
  churnByMonth,
  churnByReason,
  daysUntil,
  inr,
  inrCompact,
  leadDue,
  longDate,
  pctChange,
  relativeDay,
} from "@/lib/domain";
import { Avatar, Button, Card, Empty, Pills, SectionTitle, Stat, inputClass } from "./ui";
import { Bars } from "./charts";
import { Icon } from "./icons";
import { useOnline } from "./hooks";

type Tab = "overview" | "leads" | "money" | "churn";
const TAB_LABELS: Record<Tab, string> = { overview: "Overview", leads: "Leads", money: "Payments and income", churn: "Churn" };

const STAGE_STYLE: Record<LeadStage, { pill: string; dot: string }> = {
  New: { pill: "bg-surface text-muted", dot: "bg-faint" },
  Contacted: { pill: "bg-tintWarning text-warning", dot: "bg-warning" },
  "Call booked": { pill: "bg-tintInfo text-recovery", dot: "bg-recovery" },
  Trial: { pill: "bg-tintSuccess text-success", dot: "bg-success" },
  Converted: { pill: "bg-ink text-card", dot: "bg-ink" },
  Lost: { pill: "bg-tintBrand text-brandInk", dot: "bg-brand" },
};

const LOST_REASONS = ["Price", "Chose another coach", "Not ready", "No reply", "Wanted in-person only"];

export function BusinessWorkspace({
  clients,
  leads: initialLeads,
  revenue,
  former,
}: {
  clients: Client[];
  leads: Lead[];
  revenue: { month: string; inr: number }[];
  former: FormerClient[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [leads, setLeads] = useState(initialLeads);
  const open = leads.filter((l) => l.stage !== "Converted" && l.stage !== "Lost");
  const due = leads.filter((l) => leadDue(l));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Business</h1>
          <p className="mt-1 text-md text-muted">Leads, renewals, income and who left: the business side of coaching</p>
        </div>
        <Pills<Tab> value={tab} onChange={setTab} label="Business sections" options={(Object.keys(TAB_LABELS) as Tab[]).map((k) => ({ key: k, label: TAB_LABELS[k], count: k === "leads" ? due.length || undefined : undefined }))} />
      </div>

      {tab === "overview" ? <Overview clients={clients} revenue={revenue} openLeads={open.length} dueLeads={due.length} former={former} /> : null}
      {tab === "leads" ? <LeadsBoard leads={leads} setLeads={setLeads} /> : null}
      {tab === "money" ? <Money clients={clients} /> : null}
      {tab === "churn" ? <Churn former={former} clients={clients} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------- overview */

function Overview({ clients, revenue, openLeads, dueLeads, former }: { clients: Client[]; revenue: { month: string; inr: number }[]; openLeads: number; dueLeads: number; former: FormerClient[] }) {
  const paying = clients.filter((c) => c.feeInr);
  const fees = paying.reduce((n, c) => n + (c.feeInr ?? 0), 0);
  const in30 = clients.filter((c) => (daysUntil(c.nextRenewal) ?? 99) <= 30).length;
  const unpaid = clients.filter((c) => !c.feeInr).length;
  const now = revenue[revenue.length - 1];
  const prev = revenue[revenue.length - 2];
  const change = pctChange(prev?.inr, now?.inr);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Revenue recorded in {now?.month}</p>
              <p className="tnum mt-1 font-mono text-4xl font-medium tracking-[-0.03em]">{now ? inr(now.inr) : "—"}</p>
            </div>
            {change !== null ? (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium ${change >= 0 ? "bg-tintSuccess text-success" : "bg-tintBrand text-brandInk"}`}>
                <Icon name={change >= 0 ? "arrowUp" : "arrowDown"} size={13} />
                {Math.abs(change)}% vs {prev?.month}
              </span>
            ) : null}
          </div>
          <div className="mt-5">
            <Bars values={revenue.map((r) => r.inr)} labels={revenue.map((r) => r.month)} format={inrCompact} height={220} label="Revenue by month" />
          </div>
        </Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <Stat label="Monthly fees on record" value={inr(fees)} sub={`${paying.length} paying clients`} />
          <Stat label="Renewals in 30 days" value={String(in30)} sub="request payment from Payments" />
          <Stat label="Fees not recorded" value={String(unpaid)} sub="these count nowhere until you add a fee" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Open leads" value={String(openLeads)} sub={dueLeads ? `${dueLeads} follow-ups due today` : "no follow-ups due"} />
        <Stat label="Active clients" value={String(clients.filter((c) => c.status === "active").length)} sub={`of ${clients.length} on your books`} />
        <Stat label="Left in total" value={String(former.length)} sub="see Churn for reasons" />
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- leads */

function LeadsBoard({ leads, setLeads }: { leads: Lead[]; setLeads: (fn: (l: Lead[]) => Lead[]) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const lead = leads.find((l) => l.id === openId);

  const update = (id: string, patch: Partial<Lead>, note?: string) =>
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch, history: note ? [...l.history, { date: today, text: note }] : l.history } : l)));

  return (
    <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1120px] grid-cols-6 gap-3">
          {LEAD_STAGES.map((stage) => {
            const items = leads.filter((l) => l.stage === stage);
            return (
              <section key={stage} aria-labelledby={`lead-${stage}`} className="flex min-w-0 flex-col rounded-xl border border-line bg-surface">
                <header className="flex items-center justify-between border-b border-line px-3 py-2.5">
                  <h2 id={`lead-${stage}`} className="flex items-center gap-2 text-base font-semibold">
                    <span className={`h-2 w-2 rounded-full ${STAGE_STYLE[stage].dot}`} aria-hidden />
                    {stage}
                  </h2>
                  <span className="tnum font-mono text-sm text-muted">{items.length}</span>
                </header>
                <ul className="min-h-[200px] space-y-2 p-2">
                  {items.length === 0 ? <li className="px-2 py-4 text-center text-xs text-muted">None</li> : null}
                  {items.map((l) => {
                    const isDue = leadDue(l);
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => setOpenId(l.id)}
                          aria-current={openId === l.id ? "true" : undefined}
                          className={`block w-full rounded-lg border bg-card p-3 text-left shadow-sm transition-[border-color,transform] duration-[120ms] ease-quiet hover:border-strong active:scale-[0.99] ${
                            openId === l.id ? "border-brand" : isDue ? "border-brand" : "border-line"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Avatar name={l.name} size={26} />
                            <span className="min-w-0 truncate text-base font-medium">{l.name}</span>
                          </span>
                          <span className="mt-1.5 block truncate text-xs text-muted">{l.goal}</span>
                          <span className="mt-2 flex items-center justify-between gap-2 text-xs">
                            <span className="text-muted">{l.source}</span>
                            {l.stage === "Lost" ? (
                              <span className="text-brandInk">{l.lostReason}</span>
                            ) : l.stage === "Converted" ? (
                              <span className="text-success">Client</span>
                            ) : (
                              <span className={`tnum font-mono ${isDue ? "font-medium text-brandInk" : "text-muted"}`}>{relativeDay(l.due)}</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      <aside>
        {lead ? (
          <LeadDetail key={lead.id} lead={lead} onUpdate={update} onClose={() => setOpenId(null)} />
        ) : (
          <Empty title="Pick a lead" body="Open a card to see its history, log a touch, move it along or convert it to a client." />
        )}
      </aside>
    </div>
  );
}

function LeadDetail({ lead, onUpdate, onClose }: { lead: Lead; onUpdate: (id: string, patch: Partial<Lead>, note?: string) => void; onClose: () => void }) {
  const [note, setNote] = useState("");
  const [lostReason, setLostReason] = useState(LOST_REASONS[0] as string);
  const idx = LEAD_STAGES.indexOf(lead.stage);
  const next = LEAD_STAGES[idx + 1];
  const closed = lead.stage === "Converted" || lead.stage === "Lost";
  const followUp = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

  return (
    <Card className="2xl:sticky 2xl:top-20">
      <div className="flex items-start gap-3">
        <Avatar name={lead.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">{lead.name}</p>
          <p className="text-sm text-muted">
            {lead.goal} · {lead.source}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close lead" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface hover:text-ink">
          <Icon name="close" size={15} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${STAGE_STYLE[lead.stage].pill}`}>{lead.stage}</span>
        {!closed ? (
          <span className={`tnum font-mono text-sm ${leadDue(lead) ? "font-medium text-brandInk" : "text-muted"}`}>Follow up {relativeDay(lead.due).toLowerCase()}</span>
        ) : null}
      </div>

      {!closed ? (
        <div className="mt-4 space-y-2">
          {next && next !== "Lost" ? (
            <Button className="w-full" onClick={() => onUpdate(lead.id, { stage: next, due: followUp }, next === "Converted" ? "Converted to a client" : `Moved to ${next}`)}>
              {next === "Converted" ? "Convert to client" : `Move to ${next}`}
            </Button>
          ) : null}
          <div className="flex gap-2">
            <label htmlFor="lost-reason" className="sr-only">
              Reason lost
            </label>
            <select id="lost-reason" value={lostReason} onChange={(e) => setLostReason(e.target.value)} className={`${inputClass} h-10`}>
              {LOST_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <Button variant="secondary" onClick={() => onUpdate(lead.id, { stage: "Lost", lostReason }, `Lost: ${lostReason}`)}>
              Mark lost
            </Button>
          </div>
        </div>
      ) : lead.stage === "Converted" ? (
        <p className="mt-4 rounded-lg bg-surface px-3 py-2.5 text-base">Now a client. This history stays with them.</p>
      ) : (
        <Button variant="secondary" className="mt-4 w-full" onClick={() => onUpdate(lead.id, { stage: "New", lostReason: undefined, due: followUp }, "Reopened")}>
          Reopen lead
        </Button>
      )}

      <SectionTitle>History</SectionTitle>
      <ol className="space-y-3">
        {lead.history.map((h, i) => (
          <li key={i} className="flex gap-3 text-base">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-strong" aria-hidden />
            <span className="min-w-0 flex-1">
              {h.text}
              <span className="tnum block font-mono text-xs text-muted">{longDate(h.date)}</span>
            </span>
          </li>
        ))}
      </ol>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (note.trim()) onUpdate(lead.id, {}, note.trim());
          setNote("");
        }}
      >
        <label htmlFor="lead-note" className="sr-only">
          Log a touch
        </label>
        <input id="lead-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Called, sent pricing…" className={`${inputClass} h-10`} />
        <Button variant="secondary" type="submit" disabled={!note.trim()}>
          Log
        </Button>
      </form>
    </Card>
  );
}

/* ---------------------------------------------------------------- money */

type PayState = "idle" | "requested" | "paid" | "failed";

function Money({ clients }: { clients: Client[] }) {
  const online = useOnline();
  const [pay, setPay] = useState<Record<string, PayState>>({});
  const renewals = useMemo(
    () =>
      clients
        .filter((c) => {
          const d = daysUntil(c.nextRenewal);
          return d !== null && d <= 30;
        })
        .sort((a, b) => (a.nextRenewal ?? "").localeCompare(b.nextRenewal ?? "")),
    [clients],
  );
  const paying = clients.filter((c) => c.feeInr).sort((a, b) => (b.feeInr ?? 0) - (a.feeInr ?? 0));
  const total = paying.reduce((n, c) => n + (c.feeInr ?? 0), 0);
  const requested = Object.values(pay).filter((s) => s === "requested").length;
  const collected = renewals.filter((c) => pay[c.id] === "paid").reduce((n, c) => n + (c.feeInr ?? 0), 0);

  const request = (c: Client) => setPay((p) => ({ ...p, [c.id]: online ? "requested" : "failed" }));

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <section>
        <SectionTitle right={<span className="tnum font-mono">{requested} requested · {inr(collected)} collected</span>}>Renewals in the next 30 days</SectionTitle>
        {renewals.length === 0 ? (
          <Empty title="No renewals due" body="Clients with a renewal in the next 30 days appear here." />
        ) : (
          <Card className="divide-y divide-line p-0">
            {renewals.map((c) => {
              const state = pay[c.id] ?? "idle";
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Avatar name={c.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium">{c.name}</p>
                    <p className="tnum font-mono text-xs text-muted">
                      {c.feeInr ? inr(c.feeInr) : "fee not set"} · renews {relativeDay(c.nextRenewal).toLowerCase()}
                    </p>
                  </div>
                  {state === "idle" ? (
                    <Button variant="secondary" onClick={() => request(c)} disabled={!c.feeInr}>
                      Request payment
                    </Button>
                  ) : state === "requested" ? (
                    <span className="flex items-center gap-2">
                      <span className="text-sm text-muted">UPI request sent</span>
                      <Button variant="secondary" onClick={() => setPay((p) => ({ ...p, [c.id]: "paid" }))}>
                        Mark paid
                      </Button>
                    </span>
                  ) : state === "paid" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-tintSuccess px-2.5 py-1 text-sm font-medium text-success">
                      <Icon name="check" size={13} /> Paid
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-sm text-danger">
                      Couldn&apos;t send. Check your connection.
                      <Button variant="secondary" onClick={() => request(c)}>
                        Retry
                      </Button>
                    </span>
                  )}
                </div>
              );
            })}
          </Card>
        )}
      </section>

      <section>
        <SectionTitle right={<span className="tnum font-mono">{inr(total)} / month</span>}>Income by client</SectionTitle>
        <Card className="p-0">
          <table className="w-full text-base">
            <thead className="border-b border-line bg-surface text-left text-sm text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Client</th>
                <th className="px-4 py-2.5 text-right font-medium">Monthly fee</th>
                <th className="px-4 py-2.5 text-right font-medium">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {paying.slice(0, 12).map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5">{c.name}</td>
                  <td className="tnum px-4 py-2.5 text-right font-mono">{inr(c.feeInr ?? 0)}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center justify-end gap-2">
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-raised" aria-hidden>
                        <span className="block h-full rounded-full bg-ink" style={{ width: `${((c.feeInr ?? 0) / (paying[0]?.feeInr ?? 1)) * 100}%` }} />
                      </span>
                      <span className="tnum w-10 text-right font-mono text-xs text-muted">{(((c.feeInr ?? 0) / total) * 100).toFixed(1)}%</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-line bg-surface">
              <tr>
                <td className="px-4 py-2.5 text-sm text-muted">
                  {paying.length > 12 ? `and ${paying.length - 12} more · ` : ""}
                  {paying.length} paying clients
                </td>
                <td className="tnum px-4 py-2.5 text-right font-mono font-medium">{inr(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </Card>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- churn */

function Churn({ former, clients }: { former: FormerClient[]; clients: Client[] }) {
  const reasons = churnByReason(former);
  const months = churnByMonth(former);
  const max = Math.max(1, ...reasons.map((r) => r.count));
  const rate = Math.round((former.length / (former.length + clients.length)) * 100);

  if (former.length === 0) return <Empty title="Nobody has left" body="When a client stops, record why. Reasons roll up here." />;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="p-6">
        <p className="text-sm text-muted">Clients who left, by month</p>
        <p className="tnum mt-1 font-mono text-4xl font-medium tracking-[-0.03em]">{former.length}</p>
        <p className="mt-1 text-sm text-muted">{rate}% of everyone you have coached</p>
        <div className="mt-5">
          <Bars values={months.map((m) => m.count)} labels={months.map((m) => m.month)} height={200} label="Departures by month" />
        </div>
      </Card>
      <div className="space-y-5">
        <Card>
          <p className="mb-3 text-md font-semibold">Why they left</p>
          <ul className="space-y-3">
            {reasons.map((r, i) => (
              <li key={r.reason}>
                <div className="flex items-baseline justify-between gap-3 text-base">
                  <span>{r.reason}</span>
                  <span className="tnum font-mono text-sm text-muted">{r.count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised" aria-hidden>
                  <div className={`h-full rounded-full ${i === 0 ? "bg-brand" : "bg-strong"}`} style={{ width: `${(r.count / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="mb-3 text-md font-semibold">Where in the journey</p>
          <ul className="space-y-2">
            {JOURNEY_STAGES.map((s) => {
              const n = former.filter((f) => f.stageAtExit === s.key).length;
              return (
                <li key={s.key} className="flex items-baseline justify-between text-base">
                  <span className="text-muted">{s.label}</span>
                  <span className="tnum font-mono">{n}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
