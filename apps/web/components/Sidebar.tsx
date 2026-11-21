"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icons";
import { Avatar } from "./ui";
import type { PlanUsage } from "@/lib/domain";

type Item = { href: string; label: string; icon: IconName; badge?: number };

const SECTIONS: { title?: string; items: Item[] }[] = [
  {
    items: [
      { href: "/coach/today", label: "Today", icon: "sun" },
      { href: "/coach", label: "Clients", icon: "users" },
      { href: "/coach/check-ins", label: "Progress", icon: "chart", badge: 4 },
      { href: "/coach/plans", label: "Plans", icon: "list" },
      { href: "/coach/messages", label: "Messages", icon: "message", badge: 3 },
    ],
  },
  {
    title: "Workspace",
    items: [
      { href: "/coach/business", label: "Business", icon: "briefcase" },
      { href: "/coach/library", label: "Library", icon: "dumbbell" },
      { href: "/coach/settings", label: "Settings", icon: "settings" },
    ],
  },
];

/** Clients stays selected on a client's own pages; every other item owns its path. */
function isActive(path: string, href: string): boolean {
  if (href === "/coach") return path === "/coach" || path.startsWith("/coach/clients");
  return path === href || path.startsWith(`${href}/`);
}

/** The mark: an arc over a bar, a loaded barbell seen side-on. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-lg bg-brand text-onBrand shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
        <path d="M4 17a8 8 0 0 1 16 0" />
        <path d="M3 20h18" />
      </svg>
    </span>
  );
}

export function Sidebar({ coach, usage }: { coach: { name: string; email: string; plan: string }; usage: PlanUsage }) {
  const path = usePathname() ?? "/coach";
  return (
    <aside className="flex w-[248px] shrink-0 flex-col bg-nav px-3 py-4 text-navText" aria-label="Coach workspace">
      <Link href="/coach/today" className="flex items-center gap-2.5 rounded-lg px-2 py-1 transition-colors duration-[120ms] ease-quiet hover:bg-navRaised">
        <BrandMark />
        <span className="min-w-0">
          <span className="block truncate text-md font-semibold leading-5 tracking-[-0.01em]">Arcwell</span>
          <span className="block truncate text-xs leading-4 text-navMuted">Coach workspace</span>
        </span>
      </Link>

      <nav className="mt-6 flex-1 overflow-y-auto" aria-label="Main">
        {SECTIONS.map((section, si) => (
          <div key={si} className="mb-6">
            {section.title ? <p className="mb-2 px-2.5 text-xs font-medium text-navFaint">{section.title}</p> : null}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(path, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-base transition-[background-color,color,transform] duration-[120ms] ease-quiet active:scale-[0.98] ${
                        active ? "bg-brand font-medium text-onBrand shadow-sm" : "text-navMuted hover:bg-navRaised hover:text-navText"
                      }`}
                    >
                      <Icon name={item.icon} size={17} className={active ? "text-onBrand" : "text-navFaint group-hover:text-navText"} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span
                          className={`tnum grid h-5 min-w-5 place-items-center rounded-full px-1.5 font-mono text-2xs font-medium ${
                            active ? "bg-card text-brandInk" : "bg-navRaised text-navText"
                          }`}
                        >
                          {item.badge}
                          <span className="sr-only"> waiting</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="rounded-xl border border-navLine bg-navRaised p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">{coach.plan} plan</span>
          <span className="tnum font-mono text-xs text-navMuted">
            {usage.active} / {usage.limit}
            <span className="sr-only"> active clients</span>
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navLine" aria-hidden>
          <div className={`h-full rounded-full ${usage.over ? "bg-brand" : "bg-navText"}`} style={{ width: `${usage.pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-navMuted">
          {usage.over ? `${usage.active - usage.limit} over your plan's limit` : `${usage.limit - usage.active} client places left`}
        </p>
      </div>

      <Link
        href="/coach/settings"
        className="mt-3 flex h-11 items-center gap-2.5 rounded-lg px-2 transition-colors duration-[120ms] ease-quiet hover:bg-navRaised"
      >
        <Avatar name={coach.name} size={28} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-medium leading-4">{coach.name}</span>
          <span className="block truncate text-xs leading-4 text-navMuted">{coach.email}</span>
        </span>
        <Icon name="settings" size={15} className="text-navFaint" />
      </Link>
    </aside>
  );
}
