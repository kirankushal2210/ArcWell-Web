import Link from "next/link";
import { Avatar, Card, PageTitle, SectionTitle, buttonClass, inputClass } from "@/components/ui";
import { BrandMark } from "@/components/Sidebar";
import { CLIENTS, COACH } from "@/lib/data";
import { inr, planUsage } from "@/lib/domain";

const NOTIFICATIONS = [
  { name: "Check-ins", hint: "When a client submits their weekly check-in" },
  { name: "Messages", hint: "New messages from clients" },
  { name: "Lead follow-ups", hint: "On the day a follow-up is due" },
  { name: "Renewals and payments", hint: "Seven days before a renewal, and when a payment lands" },
];

export default function SettingsPage() {
  const usage = planUsage(CLIENTS, COACH.clientLimit);
  return (
    <>
      <PageTitle title="Settings" sub="Your profile, packages, and how clients see you" />

      <div className="grid grid-cols-1 gap-x-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <SectionTitle>Profile</SectionTitle>
          <Card>
            <div className="mb-5 flex items-center gap-4">
              <Avatar name={COACH.name} size={56} />
              <div>
                <p className="text-lg font-semibold">{COACH.name}</p>
                <p className="text-sm text-muted">Shown on every plan, message and report</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="s-name" className="mb-1.5 block text-sm font-medium">Name</label>
                <input id="s-name" defaultValue={COACH.name} className={`${inputClass} h-10`} />
              </div>
              <div>
                <label htmlFor="s-email" className="mb-1.5 block text-sm font-medium">Email</label>
                <input id="s-email" type="email" defaultValue={COACH.email} className={`${inputClass} h-10`} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="s-booking" className="mb-1.5 block text-sm font-medium">Session booking link</label>
                <input id="s-booking" placeholder="https://calendly.com/yourname/session" aria-describedby="s-booking-hint" className={`${inputClass} h-10`} />
                <p id="s-booking-hint" className="mt-1.5 text-sm text-muted">Clients see a “Book a session” button that opens this link.</p>
              </div>
            </div>
          </Card>

          <SectionTitle>Notifications</SectionTitle>
          <Card className="divide-y divide-line p-0">
            {NOTIFICATIONS.map((n) => (
              <label key={n.name} className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                <span>
                  <span className="block text-base font-medium">{n.name}</span>
                  <span className="block text-sm text-muted">{n.hint}</span>
                </span>
                <span className="relative inline-flex shrink-0">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <span
                    className="h-6 w-10 rounded-full bg-raised transition-colors duration-[120ms] ease-quiet peer-checked:bg-brand peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]"
                    aria-hidden
                  />
                  <span
                    className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-card shadow-md transition-transform duration-[220ms] ease-quiet peer-checked:translate-x-4"
                    aria-hidden
                  />
                </span>
              </label>
            ))}
          </Card>
        </div>

        <aside>
          <SectionTitle>Subscription</SectionTitle>
          <div className="overflow-hidden rounded-xl border border-brand bg-brand text-onBrand shadow-md">
            <div className="p-5">
              <p className="text-sm opacity-80">Current plan</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{COACH.plan}</p>
              <p className="tnum mt-1 font-mono text-md">{inr(COACH.feeInr)} / month</p>
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
              <div className="mt-3 flex items-baseline justify-between text-sm">
                <span className="opacity-80">Next charge</span>
                <span className="tnum font-mono">{COACH.nextCharge}</span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Link href="/coach/billing" className={`${buttonClass("secondary")} w-full`}>
              Change plan and invoices
            </Link>
          </div>

          <SectionTitle>Branding</SectionTitle>
          <Card>
            <div className="flex items-center gap-3">
              <BrandMark size={36} />
              <div>
                <p className="text-base font-medium">Arcwell default</p>
                <p className="text-sm text-muted">Logo, name and colours your clients see</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted">
              Business and Elite plans can serve this workspace on their own domain with their own logo and colours.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
