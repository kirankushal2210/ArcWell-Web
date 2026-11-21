"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Activity, Client, TeamMember } from "@/lib/data";
import { contrastRatio, inr, relativeDay, validDomain, type PlanUsage } from "@/lib/domain";
import { Avatar, Button, Card, Pills, SectionTitle, buttonClass, inputClass } from "./ui";
import { Icon } from "./icons";

type Tab = "profile" | "team" | "branding";
const TABS: Record<Tab, string> = { profile: "Profile", team: "Team", branding: "Branding" };

type Coach = { name: string; email: string; plan: string; feeInr: number; nextCharge: string };

export function SettingsWorkspace({ coach, usage, team, activity, clients }: { coach: Coach; usage: PlanUsage; team: TeamMember[]; activity: Activity[]; clients: Client[] }) {
  const [tab, setTab] = useState<Tab>("profile");
  const premium = coach.plan === "Business" || coach.plan === "Elite";
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Settings</h1>
          <p className="mt-1 text-md text-muted">Your profile, your team, and how clients see your workspace</p>
        </div>
        <Pills<Tab> value={tab} onChange={setTab} label="Settings sections" options={(Object.keys(TABS) as Tab[]).map((k) => ({ key: k, label: TABS[k] }))} />
      </div>
      {tab === "profile" ? <Profile coach={coach} usage={usage} /> : null}
      {tab === "team" ? <Team team={team} activity={activity} clients={clients} premium={premium} owner={coach.name} /> : null}
      {tab === "branding" ? <Branding premium={premium} /> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- profile */

const NOTIFICATIONS = [
  { name: "Check-ins", hint: "When a client submits their weekly check-in" },
  { name: "Messages", hint: "New messages from clients" },
  { name: "Lead follow-ups", hint: "On the day a follow-up is due" },
  { name: "Renewals and payments", hint: "Seven days before a renewal, and when a payment lands" },
];

function Profile({ coach, usage }: { coach: Coach; usage: PlanUsage }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <SectionTitle>Profile</SectionTitle>
        <Card>
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={coach.name} size={56} />
            <div>
              <p className="text-lg font-semibold">{coach.name}</p>
              <p className="text-sm text-muted">Shown on every plan, message and report</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Row id="s-name" label="Name">
              <input id="s-name" defaultValue={coach.name} className={`${inputClass} h-10`} />
            </Row>
            <Row id="s-email" label="Email">
              <input id="s-email" type="email" defaultValue={coach.email} className={`${inputClass} h-10`} />
            </Row>
            <div className="sm:col-span-2">
              <Row id="s-booking" label="Session booking link">
                <input id="s-booking" placeholder="https://calendly.com/yourname/session" aria-describedby="s-booking-hint" className={`${inputClass} h-10`} />
              </Row>
              <p id="s-booking-hint" className="mt-1.5 text-sm text-muted">
                Clients see a “Book a session” button that opens this link.
              </p>
            </div>
          </div>
        </Card>

        <SectionTitle>Notifications</SectionTitle>
        <Card className="divide-y divide-line p-0">
          {NOTIFICATIONS.map((n) => (
            <Toggle key={n.name} label={n.name} hint={n.hint} />
          ))}
        </Card>
      </div>
      <aside>
        <SectionTitle>Subscription</SectionTitle>
        <div className="overflow-hidden rounded-xl border border-brand bg-brand text-onBrand shadow-md">
          <div className="p-5">
            <p className="text-sm opacity-80">Current plan</p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{coach.plan}</p>
            <p className="tnum mt-1 font-mono text-md">{inr(coach.feeInr)} / month</p>
          </div>
          <div className="border-t border-brandHover bg-brandHover px-5 py-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="opacity-80">Active clients</span>
              <span className="tnum font-mono font-medium">
                {usage.active} / {usage.limit}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brandPress" aria-hidden>
              <div className="h-full rounded-full bg-card" style={{ width: `${usage.pct}%` }} />
            </div>
          </div>
        </div>
        <Link href="/coach/billing" className={`${buttonClass("secondary")} mt-3 w-full`}>
          Change plan and invoices
        </Link>
      </aside>
    </div>
  );
}

function Toggle({ label, hint }: { label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
      <span>
        <span className="block text-base font-medium">{label}</span>
        <span className="block text-sm text-muted">{hint}</span>
      </span>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" defaultChecked className="peer sr-only" />
        <span className="h-6 w-10 rounded-full bg-raised transition-colors duration-[120ms] ease-quiet peer-checked:bg-brand peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]" aria-hidden />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-card shadow-md transition-transform duration-[220ms] ease-quiet peer-checked:translate-x-4" aria-hidden />
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ team */

const PERMISSIONS: [string, boolean, boolean][] = [
  ["See and coach assigned clients", true, true],
  ["Review check-ins and reply to messages", true, true],
  ["Build and edit plans", true, true],
  ["See every client", true, false],
  ["Billing, plan and invoices", true, false],
  ["Workspace settings and branding", true, false],
  ["Delete clients", true, false],
  ["Invite or remove team members", true, false],
];

function Team({ team: initial, activity: initialActivity, clients, premium, owner }: { team: TeamMember[]; activity: Activity[]; clients: Client[]; premium: boolean; owner: string }) {
  const [team, setTeam] = useState(initial);
  const [activity, setActivity] = useState(initialActivity);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [assigning, setAssigning] = useState<TeamMember | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const log = (what: string, client?: string) => setActivity((a) => [{ id: `a-${Date.now()}`, who: owner, what, client, at: today }, ...a]);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim());
  const assigned = new Set(team.flatMap((m) => m.clientIds));

  return (
    <div className="grid grid-cols-1 gap-x-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        {!premium ? (
          <p className="mb-2 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning bg-tintWarning px-4 py-3 text-base text-warning">
            <span>Assistant coaches come with Business and Elite. You can set up your team here; invites go out once you upgrade.</span>
            <Link href="/coach/billing" className={buttonClass("secondary")}>
              See plans
            </Link>
          </p>
        ) : null}
        <SectionTitle right={<span className="tnum font-mono">{team.length} people · {assigned.size} clients assigned</span>}>Your team</SectionTitle>
        <Card className="divide-y divide-line p-0">
          {team.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <Avatar name={m.name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-base font-medium">
                  {m.name}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.role === "Owner" ? "bg-ink text-card" : "bg-surface text-muted"}`}>{m.role}</span>
                  {m.status === "Invited" ? <span className="rounded-full bg-tintWarning px-2 py-0.5 text-xs font-medium text-warning">Invite pending</span> : null}
                </p>
                <p className="text-sm text-muted">
                  {m.email}
                  {m.lastActive ? ` · active ${relativeDay(m.lastActive).toLowerCase()}` : ""}
                </p>
              </div>
              {m.role === "Assistant" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tnum font-mono text-sm text-muted">{m.clientIds.length} clients</span>
                  <Button variant="secondary" onClick={() => setAssigning(m)}>
                    Assign clients
                  </Button>
                  {confirmRevoke === m.id ? (
                    <>
                      <Button variant="quiet" onClick={() => setConfirmRevoke(null)}>
                        Keep
                      </Button>
                      <Button
                        onClick={() => {
                          setTeam((t) => t.filter((x) => x.id !== m.id));
                          log(`removed ${m.name}'s access`);
                          setConfirmRevoke(null);
                        }}
                      >
                        Remove access now
                      </Button>
                    </>
                  ) : (
                    <Button variant="quiet" onClick={() => setConfirmRevoke(m.id)}>
                      Revoke
                    </Button>
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted">Full access</span>
              )}
            </div>
          ))}
        </Card>

        <SectionTitle>Invite an assistant coach</SectionTitle>
        <Card>
          <form
            className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (!inviteName.trim() || !emailOk) return;
              setTeam((t) => [...t, { id: `t-${Date.now()}`, name: inviteName.trim(), email: inviteEmail.trim(), role: "Assistant", status: "Invited", clientIds: [], lastActive: null }]);
              log(`invited ${inviteName.trim()} as an assistant`);
              setInviteName("");
              setInviteEmail("");
            }}
          >
            <Row id="inv-name" label="Name">
              <input id="inv-name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} className={`${inputClass} h-10`} />
            </Row>
            <Row id="inv-email" label="Email">
              <input id="inv-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} aria-invalid={inviteEmail && !emailOk ? true : undefined} className={`${inputClass} h-10`} />
            </Row>
            <Button type="submit" disabled={!inviteName.trim() || !emailOk}>
              Send invite
            </Button>
          </form>
          <p className="mt-3 text-sm text-muted">Assistants see only the clients you assign them, in every list and screen. Removing access takes effect immediately.</p>
        </Card>

        <SectionTitle>What each role can do</SectionTitle>
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[440px] text-base">
            <thead className="border-b border-line bg-surface text-left text-sm text-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">Permission</th>
                <th className="px-5 py-2.5 text-center font-medium">Owner</th>
                <th className="px-5 py-2.5 text-center font-medium">Assistant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {PERMISSIONS.map(([what, o, a]) => (
                <tr key={what}>
                  <td className="px-5 py-2.5">{what}</td>
                  {[o, a].map((yes, i) => (
                    <td key={i} className="px-5 py-2.5 text-center">
                      {yes ? <Icon name="check" size={15} className="inline text-success" /> : <Icon name="close" size={15} className="inline text-faint" />}
                      <span className="sr-only">{yes ? "Yes" : "No"}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <aside>
        <SectionTitle>Activity</SectionTitle>
        <Card className="p-0">
          <ol className="divide-y divide-line">
            {activity.slice(0, 12).map((a) => (
              <li key={a.id} className="flex gap-3 px-4 py-3">
                <Avatar name={a.who} size={28} />
                <div className="min-w-0 flex-1 text-base">
                  <p>
                    <span className="font-medium">{a.who}</span> <span className="text-muted">{a.what}</span>
                    {a.client ? <span className="font-medium"> · {a.client}</span> : null}
                  </p>
                  <p className="tnum font-mono text-xs text-muted">{relativeDay(a.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <p className="mt-3 text-sm text-muted">Every action is recorded with who did it. On a client&apos;s profile you can see who last touched them.</p>
      </aside>

      {assigning ? (
        <AssignDialog
          member={assigning}
          clients={clients}
          takenBy={(id) => team.find((m) => m.id !== assigning.id && m.clientIds.includes(id))?.name}
          onClose={() => setAssigning(null)}
          onSave={(ids) => {
            setTeam((t) => t.map((m) => (m.id === assigning.id ? { ...m, clientIds: ids } : m)));
            log(`assigned ${ids.length} clients to ${assigning.name}`);
            setAssigning(null);
          }}
        />
      ) : null}
    </div>
  );
}

function AssignDialog({ member, clients, takenBy, onClose, onSave }: { member: TeamMember; clients: Client[]; takenBy: (id: string) => string | undefined; onClose: () => void; onSave: (ids: string[]) => void }) {
  const [ids, setIds] = useState<string[]>(member.clientIds);
  const [q, setQ] = useState("");
  const shown = clients.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Dialog title={`Clients for ${member.name}`} onClose={onClose}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients" aria-label="Search clients" className={`${inputClass} h-10`} />
      <ul className="mt-3 max-h-80 divide-y divide-line overflow-y-auto rounded-lg border border-line">
        {shown.map((c) => {
          const other = takenBy(c.id);
          return (
            <li key={c.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-surface">
                <input type="checkbox" checked={ids.includes(c.id)} onChange={() => setIds((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))} className="h-4 w-4 accent-[var(--brand)]" />
                <Avatar name={c.name} size={26} />
                <span className="min-w-0 flex-1 text-base">{c.name}</span>
                {other ? <span className="text-xs text-muted">with {other.split(" ")[0]}</span> : null}
              </label>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="tnum font-mono text-sm text-muted">{ids.length} selected</span>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(ids)}>Save</Button>
        </div>
      </div>
    </Dialog>
  );
}

/* --------------------------------------------------------------- branding */

function cssColor(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function Branding({ premium }: { premium: boolean }) {
  const [defaults, setDefaults] = useState({ primary: "", accent: "", onPrimary: "" });
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState("");
  const [accent, setAccent] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [domain, setDomain] = useState("");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Defaults come from the live design tokens, so "reset" always means the Arcwell brand.
  useEffect(() => {
    const d = { primary: cssColor("--brand"), accent: cssColor("--accent-2"), onPrimary: cssColor("--on-brand") };
    setDefaults(d);
    setPrimary(d.primary);
    setAccent(d.accent);
  }, []);

  const shownName = name.trim() || "Arcwell";
  const ratio = primary && defaults.onPrimary ? contrastRatio(defaults.onPrimary, primary) : null;
  const lowContrast = ratio !== null && ratio < 4.5;
  const domainOk = !domain.trim() || validDomain(domain);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        {!premium ? (
          <p className="mb-2 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning bg-tintWarning px-4 py-3 text-base text-warning">
            <span>White-label is part of Business and Elite. Design your brand here; it goes live when you upgrade.</span>
            <Link href="/coach/billing" className={buttonClass("secondary")}>
              See plans
            </Link>
          </p>
        ) : null}
        <SectionTitle>Your brand</SectionTitle>
        <Card className="space-y-5">
          <Row id="b-name" label="Workspace name">
            <input id="b-name" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder="Arcwell" className={`${inputClass} h-10`} />
          </Row>
          <div>
            <p className="mb-1.5 text-sm font-medium">Logo</p>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg border border-line bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {logo ? <img src={logo} alt="Your logo" className="h-full w-full object-contain" /> : <span className="text-xs text-faint">None</span>}
              </span>
              <input ref={fileRef} type="file" accept="image/png,image/svg+xml,image/jpeg" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { setLogo(URL.createObjectURL(f)); setSaved(false); } }} />
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                Upload logo
              </Button>
              {logo ? (
                <Button variant="quiet" onClick={() => setLogo(null)}>
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ColorField id="b-primary" label="Primary colour" value={primary} onChange={(v) => { setPrimary(v); setSaved(false); }} />
            <ColorField id="b-accent" label="Accent colour" value={accent} onChange={(v) => { setAccent(v); setSaved(false); }} />
          </div>
          {ratio !== null ? (
            <p className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${lowContrast ? "bg-tintBrand text-danger" : "bg-tintSuccess text-success"}`} role="status">
              <Icon name={lowContrast ? "close" : "check"} size={14} className="mt-0.5 shrink-0" />
              {lowContrast
                ? `White text on this colour has a contrast of ${ratio}:1. Buttons need at least 4.5:1 to stay readable; pick a darker shade.`
                : `White text on this colour has a contrast of ${ratio}:1, readable for buttons and the active menu item.`}
            </p>
          ) : null}
          <Row id="b-domain" label="Your own domain">
            <input id="b-domain" value={domain} onChange={(e) => { setDomain(e.target.value); setSaved(false); }} placeholder="coach.yourname.in" aria-invalid={!domainOk ? true : undefined} className={`${inputClass} h-10`} />
          </Row>
          <p className="-mt-3 text-sm text-muted">{!domainOk ? "That doesn't look like a domain." : "Optional. Your Arcwell platform address keeps working either way."}</p>
          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <Button onClick={() => setSaved(true)} disabled={lowContrast || !domainOk}>
              Save brand
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setName("");
                setLogo(null);
                setPrimary(defaults.primary);
                setAccent(defaults.accent);
                setDomain("");
                setSaved(false);
              }}
            >
              Reset to Arcwell
            </Button>
          </div>
          {saved ? (
            <p role="status" className="flex items-center gap-2 text-sm text-success">
              <Icon name="check" size={14} /> Saved. Sign-in, the sidebar, PDF reports and client emails will carry this brand.
            </p>
          ) : null}
        </Card>
      </div>

      <div>
        <SectionTitle>Preview</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr]" style={{ ["--p" as string]: primary || undefined, ["--a" as string]: accent || undefined }}>
          <div className="rounded-xl bg-nav p-3 text-navText">
            <div className="flex items-center gap-2 px-1">
              <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-lg" style={{ background: "var(--p)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {logo ? <img src={logo} alt="" className="h-full w-full object-contain" /> : <span className="text-xs font-semibold text-onBrand">{shownName[0]}</span>}
              </span>
              <span className="truncate text-sm font-semibold">{shownName}</span>
            </div>
            <ul className="mt-4 space-y-1 text-sm">
              {["Today", "Clients", "Progress", "Plans"].map((n, i) => (
                <li key={n} className="rounded-lg px-2.5 py-1.5" style={i === 1 ? { background: "var(--p)", color: "var(--on-brand)" } : undefined}>
                  <span className={i === 1 ? "" : "text-navMuted"}>{n}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-bg p-5">
            <p className="text-xs text-muted">Sign-in page</p>
            <div className="mx-auto mt-3 max-w-[240px] rounded-xl border border-line bg-card p-4 text-center shadow-sm">
              <span className="mx-auto grid h-9 w-9 place-items-center overflow-hidden rounded-lg" style={{ background: "var(--p)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {logo ? <img src={logo} alt="" className="h-full w-full object-contain" /> : <span className="text-sm font-semibold text-onBrand">{shownName[0]}</span>}
              </span>
              <p className="mt-2 text-sm font-semibold">Sign in to {shownName}</p>
              <span className="mt-3 block rounded-md border border-line px-2 py-1.5 text-left text-xs text-faint">you@email.com</span>
              <span className="mt-2 block rounded-md py-1.5 text-xs font-medium" style={{ background: "var(--p)", color: "var(--on-brand)" }}>
                Email me a code
              </span>
              <span className="mt-3 block text-xs" style={{ color: "var(--a)" }}>
                Coached by {shownName}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">The client&apos;s phone app keeps the Arcwell brand for now.</p>
      </div>
    </div>
  );
}

function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {value ? (
          <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-card p-1" />
        ) : (
          <span className="h-10 w-12 rounded-lg bg-surface" aria-hidden />
        )}
        <span className="tnum font-mono text-sm uppercase text-muted">{value}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- shared */

function Row({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input, select, button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[color-mix(in_srgb,var(--text)_50%,transparent)] p-6" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div ref={ref} className="w-full max-w-md rounded-xl border border-line bg-card p-5 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
