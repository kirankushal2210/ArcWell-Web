import Link from "next/link";
import { AdherenceMeter, Avatar, Card, Empty, PageTitle, SectionTitle, Stat, buttonClass } from "@/components/ui";
import { Icon } from "@/components/icons";
import { CHECK_INS, CLIENTS, LEADS, MESSAGES, PLANS } from "@/lib/data";
import { daysUntil, inr, needsAttention, recentActivity, relativeDay } from "@/lib/domain";

type Severity = "act" | "plan" | "watch";

/** Severity decides the edge colour, so red keeps meaning "act on this first". */
function severity(reason: string | undefined): Severity {
  const r = (reason ?? "").toLowerCase();
  if (r.includes("adherence") || r.includes("missed") || r.includes("flat")) return "act";
  if (r.includes("plan change")) return "plan";
  return "watch";
}

const EDGE: Record<Severity, { edge: string; dot: string; label: string }> = {
  act: { edge: "before:bg-brand", dot: "bg-brand", label: "Act today" },
  plan: { edge: "before:bg-recovery", dot: "bg-recovery", label: "Plan change" },
  watch: { edge: "before:bg-warning", dot: "bg-warning", label: "Keep an eye" },
};

export default function TodayPage() {
  const attentionAll = CLIENTS.filter(needsAttention);
  const attention = attentionAll.slice(0, 8);
  const toReviewAll = CHECK_INS.filter((k) => !k.reviewed);
  const toReview = toReviewAll.slice(0, 6);
  const renewals = CLIENTS.filter((c) => c.nextRenewal)
    .sort((a, b) => (a.nextRenewal ?? "").localeCompare(b.nextRenewal ?? ""))
    .slice(0, 5);
  const renewingThisWeek = CLIENTS.filter((c) => {
    const d = daysUntil(c.nextRenewal);
    return d !== null && d <= 7;
  });
  const dueThisWeekInr = renewingThisWeek.reduce((n, c) => n + (c.feeInr ?? 0), 0);
  const unplanned = PLANS.filter((p) => p.status === "none").slice(0, 5);
  const leadsDue = LEADS.filter((l) => (daysUntil(l.due) ?? 99) <= 2);
  const activity = recentActivity(CHECK_INS, MESSAGES, 6);

  return (
    <>
      <PageTitle title="Today" sub="What needs you first, in one screen" />

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-card p-4 shadow-sm">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-tintBrand text-brandInk" aria-hidden>
          <Icon name="users" size={18} />
        </span>
        <div className="min-w-[200px] flex-1">
          <p className="text-md font-semibold">New to Arcwell?</p>
          <p className="text-base text-muted">Set up your profile, add your first client, build their first week and invite them. About five minutes.</p>
        </div>
        <Link href="/coach/get-started" className={buttonClass("primary")}>
          Get started
          <Icon name="chevron" size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat tone="brand" label="Need attention" value={String(attentionAll.length)} sub={`of ${CLIENTS.length} clients`} />
        <Stat label="Check-ins to review" value={String(toReviewAll.length)} sub="oldest first in Progress" />
        <Stat label="Renewing this week" value={String(renewingThisWeek.length)} sub={dueThisWeekInr ? `${inr(dueThisWeekInr)} due` : "no fees recorded"} />
        <Stat label="Leads to follow up" value={String(leadsDue.length)} sub="due within two days" />
      </div>

      <div className="mt-2 grid grid-cols-1 gap-x-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <SectionTitle right={<Link href="/coach" className="hover:text-brandInk">See all {attentionAll.length}</Link>}>Needs attention</SectionTitle>
          {attention.length === 0 ? (
            <Empty title="Nobody needs you right now" body="Every client is on track this week." />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {attention.map((c) => {
                const s = EDGE[severity(c.attention)];
                return (
                  <Link
                    key={c.id}
                    href={`/coach/clients/${c.id}`}
                    className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border border-line bg-card p-4 pl-5 shadow-sm transition-[border-color,transform] duration-[120ms] ease-quiet before:absolute before:inset-y-0 before:left-0 before:w-1 hover:border-strong active:scale-[0.99] ${s.edge}`}
                  >
                    <Avatar name={c.name} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-md font-medium group-hover:text-brandInk">{c.name}</p>
                      <p className="flex items-center gap-1.5 truncate text-sm text-muted">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} aria-hidden />
                        <span className="truncate">{c.attention ?? (c.unread ? "Unread message" : "Adherence dropped")}</span>
                      </p>
                    </div>
                    <AdherenceMeter value={c.adherence} showValue={false} />
                  </Link>
                );
              })}
            </div>
          )}

          <SectionTitle right={<Link href="/coach/plans" className="hover:text-brandInk">Open Plans</Link>}>Clients without a plan</SectionTitle>
          {unplanned.length === 0 ? (
            <Empty title="Everyone has a plan" body="New clients appear here until their first block is built." />
          ) : (
            <Card className="divide-y divide-line p-0">
              {unplanned.map((p) => (
                <div key={p.clientId} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={p.clientName} size={30} />
                  <span className="flex-1 text-base font-medium">{p.clientName}</span>
                  <Link href="/coach/plans" className={buttonClass("secondary")}>
                    Build a plan
                  </Link>
                </div>
              ))}
            </Card>
          )}
        </section>

        <aside>
          <SectionTitle>Recent activity</SectionTitle>
          <Card className="p-0">
            <ol className="relative px-4 py-2">
              {activity.map((a, i) => (
                <li key={a.id} className="relative flex gap-3 py-2.5">
                  {i < activity.length - 1 ? (
                    <span className="absolute left-[15px] top-11 h-[calc(100%-32px)] w-px bg-line" aria-hidden />
                  ) : null}
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                      a.kind === "checkin" ? "bg-tintBrand text-brandInk" : "bg-tintInfo text-recovery"
                    }`}
                    aria-hidden
                  >
                    <Icon name={a.kind === "checkin" ? "check" : "message"} size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base">
                      <Link href={`/coach/clients/${a.clientId}`} className="font-medium hover:text-brandInk">
                        {a.clientName}
                      </Link>{" "}
                      <span className="text-muted">{a.text}</span>
                    </p>
                    {a.detail ? <p className="truncate text-sm text-muted">{a.detail}</p> : null}
                    <p className="tnum font-mono text-2xs text-faint">{relativeDay(a.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <SectionTitle right={<Link href="/coach/check-ins" className="hover:text-brandInk">Review all</Link>}>Check-ins to review</SectionTitle>
          <Card className="divide-y divide-line p-0">
            {toReview.map((k) => (
              <Link
                key={k.id}
                href="/coach/check-ins"
                className="group flex items-center gap-3 px-4 py-3 transition-colors duration-[120ms] ease-quiet hover:bg-surface"
              >
                <Avatar name={k.clientName} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium group-hover:text-brandInk">{k.clientName}</span>
                  <span className="tnum block font-mono text-xs text-muted">
                    Week {k.week} · {relativeDay(k.submittedAt)}
                  </span>
                </span>
                {k.photos ? (
                  <span className="tnum inline-flex items-center gap-1 font-mono text-xs text-muted">
                    <Icon name="camera" size={13} />
                    {k.photos}
                    <span className="sr-only"> photos</span>
                  </span>
                ) : null}
                <Icon name="chevron" size={14} className="text-faint" />
              </Link>
            ))}
          </Card>

          <SectionTitle>Renewals due</SectionTitle>
          <Card className="divide-y divide-line p-0">
            {renewals.map((c) => {
              const soon = (daysUntil(c.nextRenewal) ?? 99) <= 7;
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-base">
                  <span className="truncate">{c.name}</span>
                  <span className="tnum shrink-0 font-mono text-sm">
                    <span className={soon ? "font-medium text-brandInk" : "text-muted"}>{relativeDay(c.nextRenewal)}</span>
                    <span className="text-faint"> · </span>
                    <span className="text-muted">{c.feeInr ? inr(c.feeInr) : "fee not set"}</span>
                  </span>
                </div>
              );
            })}
          </Card>

          <SectionTitle right={<Link href="/coach/business" className="hover:text-brandInk">Open Business</Link>}>Leads</SectionTitle>
          <Card className="divide-y divide-line p-0">
            {LEADS.slice(0, 4).map((l) => (
              <div key={l.name} className="flex items-center justify-between gap-3 px-4 py-3 text-base">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{l.name}</span>
                  <span className="block text-xs text-muted">
                    {l.stage} · {l.source}
                  </span>
                </span>
                <span className="tnum shrink-0 font-mono text-sm text-muted">{relativeDay(l.due)}</span>
              </div>
            ))}
          </Card>
        </aside>
      </div>
    </>
  );
}
