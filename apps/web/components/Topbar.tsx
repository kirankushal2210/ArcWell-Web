"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { shortDate } from "@/lib/domain";
import { Icon, type IconName } from "./icons";
import { Avatar, Kbd } from "./ui";

const TITLES: { match: (p: string) => boolean; title: string }[] = [
  { match: (p) => p === "/coach", title: "Clients" },
  { match: (p) => p.startsWith("/coach/today"), title: "Today" },
  { match: (p) => p.startsWith("/coach/check-ins"), title: "Progress" },
  { match: (p) => p.startsWith("/coach/plans"), title: "Plans" },
  { match: (p) => p.startsWith("/coach/messages"), title: "Messages" },
  { match: (p) => p.startsWith("/coach/business"), title: "Business" },
  { match: (p) => p.startsWith("/coach/library"), title: "Library" },
  { match: (p) => p.startsWith("/coach/settings"), title: "Settings" },
  { match: (p) => p.startsWith("/coach/clients"), title: "Clients" },
  { match: (p) => p.startsWith("/coach/get-started"), title: "Get started" },
  { match: (p) => p.startsWith("/coach/billing"), title: "Plan and billing" },
];

/**
 * A translucent material over the scrolling content. It names where you are in small type,
 * so the page's own heading is the only large title on screen.
 */
export function Topbar({ coachName }: { coachName: string }) {
  const path = usePathname() ?? "/coach";
  const title = TITLES.find((t) => t.match(path))?.title ?? "Clients";
  // The date is set after mount so the server and browser never disagree around midnight.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(shortDate(new Date())), []);

  return (
    <header className="material print:hidden sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b border-line bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] px-6 backdrop-blur-md backdrop-saturate-150">
      <p className="flex min-w-0 items-center gap-2 text-base">
        <span className="hidden text-muted sm:inline">Workspace</span>
        <span className="hidden text-faint sm:inline" aria-hidden>
          /
        </span>
        <span className="truncate font-medium">{title}</span>
      </p>

      <div className="ml-auto flex items-center gap-3">
        {today ? <span className="tnum hidden font-mono text-sm text-muted lg:inline">{today}</span> : null}
        <label className="hidden h-9 items-center gap-2 rounded-lg border border-line bg-card px-3 text-muted shadow-sm transition-colors duration-[120ms] ease-quiet focus-within:border-brand hover:border-strong md:flex">
          <Icon name="search" size={15} />
          <input
            aria-label="Search clients"
            placeholder="Search clients"
            className="w-44 bg-transparent text-base text-ink outline-none placeholder:text-faint focus:outline-none xl:w-56"
          />
          <Kbd>⌘K</Kbd>
        </label>
        <AccountMenu name={coachName} />
      </div>
    </header>
  );
}

/** The avatar opens the coach menu: profile, plan and billing, sign out. */
function AccountMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLElement>("a")?.focus();
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const items: { href: string; label: string; icon: IconName }[] = [
    { href: "/coach/settings", label: "Profile and settings", icon: "settings" },
    { href: "/coach/billing", label: "Plan and billing", icon: "rupee" },
    { href: "/sign-in", label: "Sign out", icon: "logout" },
  ];
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${name}`} className="rounded-full transition-transform duration-[120ms] ease-quiet active:scale-95">
        <Avatar name={name} size={32} />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-11 z-30 w-56 rounded-xl border border-line bg-card p-1.5 shadow-md">
          <p className="border-b border-line px-2.5 pb-2 pt-1 text-sm">
            <span className="block font-medium">{name}</span>
          </p>
          {items.map((i) => (
            <Link key={i.href} href={i.href} role="menuitem" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-base hover:bg-surface focus:bg-surface">
              <Icon name={i.icon} size={15} className="text-muted" />
              {i.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
