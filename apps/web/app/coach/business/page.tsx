import { Avatar, Card, PageTitle, SectionTitle, Stat } from "@/components/ui";
import { Bars } from "@/components/charts";
import { Icon } from "@/components/icons";
import { CLIENTS, LEADS, REVENUE } from "@/lib/data";
import { daysUntil, inr, inrCompact, pctChange, relativeDay } from "@/lib/domain";

const STAGE: Record<string, { pill: string; dot: string }> = {
  New: { pill: "bg-surface text-muted", dot: "bg-faint" },
  Contacted: { pill: "bg-tintWarning text-warning", dot: "bg-warning" },
  "Call booked": { pill: "bg-tintInfo text-recovery", dot: "bg-recovery" },
  Trial: { pill: "bg-tintSuccess text-success", dot: "bg-success" },
};

export default function BusinessPage() {
  const paying = CLIENTS.filter((c) => c.feeInr);
  const fees = paying.reduce((n, c) => n + (c.feeInr ?? 0), 0);
  const renewals = CLIENTS.filter((c) => c.nextRenewal)
    .sort((a, b) => (a.nextRenewal ?? "").localeCompare(b.nextRenewal ?? ""))
    .slice(0, 6);
  const in30 = CLIENTS.filter((c) => (daysUntil(c.nextRenewal) ?? 99) <= 30).length;
  const unpaid = CLIENTS.filter((c) => !c.feeInr).length;
  const now = REVENUE[REVENUE.length - 1];
  const prev = REVENUE[REVENUE.length - 2];
  const change = pctChange(prev?.inr, now?.inr);

  return (
    <>
      <PageTitle title="Business" sub="Leads, renewals and the money you have recorded" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Revenue recorded in {now?.month}</p>
              <p className="tnum mt-1 font-mono text-4xl font-medium tracking-[-0.03em]">{now ? inr(now.inr) : "—"}</p>
            </div>
            {change !== null ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium ${
                  change >= 0 ? "bg-tintSuccess text-success" : "bg-tintBrand text-brandInk"
                }`}
              >
                <Icon name={change >= 0 ? "arrowUp" : "arrowDown"} size={13} />
                {Math.abs(change)}% vs {prev?.month}
              </span>
            ) : null}
          </div>
          <div className="mt-5">
            <Bars values={REVENUE.map((r) => r.inr)} labels={REVENUE.map((r) => r.month)} format={inrCompact} height={220} label="Revenue by month" />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <Stat label="Monthly fees on record" value={inr(fees)} sub={`${paying.length} paying clients`} />
          <Stat label="Renewals in 30 days" value={String(in30)} sub="send a payment request from the client" />
          <Stat label="Fees not recorded" value={String(unpaid)} sub="these clients count nowhere until you add a fee" />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-x-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <SectionTitle right={<span className="tnum font-mono">{LEADS.length} open</span>}>Leads</SectionTitle>
          <div className="overflow-x-auto rounded-xl border border-line bg-card shadow-sm">
            <table className="w-full min-w-[560px] text-base">
              <thead className="border-b border-line bg-surface text-left text-sm text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Name</th>
                  <th className="px-5 py-2.5 font-medium">Source</th>
                  <th className="px-5 py-2.5 font-medium">Stage</th>
                  <th className="px-5 py-2.5 text-right font-medium">Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {LEADS.map((l) => {
                  const s = STAGE[l.stage] ?? STAGE.New!;
                  const due = (daysUntil(l.due) ?? 99) <= 0;
                  return (
                    <tr key={l.name} className="transition-colors duration-[120ms] ease-quiet hover:bg-surface">
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-3">
                          <Avatar name={l.name} size={30} />
                          <span className="font-medium">{l.name}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted">{l.source}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-sm font-medium ${s.pill}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
                          {l.stage}
                        </span>
                      </td>
                      <td className={`tnum px-5 py-3 text-right font-mono text-sm ${due ? "font-medium text-brandInk" : "text-muted"}`}>
                        {relativeDay(l.due)}
                        {due ? <span className="sr-only"> (due)</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside>
          <SectionTitle>Renewals due</SectionTitle>
          <Card className="divide-y divide-line p-0">
            {renewals.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={c.name} size={30} />
                <span className="min-w-0 flex-1 truncate text-base font-medium">{c.name}</span>
                <span className="tnum shrink-0 text-right font-mono text-sm">
                  <span className="block text-ink">{c.feeInr ? inr(c.feeInr) : "fee not set"}</span>
                  <span className="block text-xs text-muted">{relativeDay(c.nextRenewal)}</span>
                </span>
              </div>
            ))}
          </Card>
        </aside>
      </div>
    </>
  );
}
