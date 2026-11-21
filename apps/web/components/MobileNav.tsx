"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "./icons";
import { useOnline } from "./hooks";

const MAIN: { href: string; label: string; icon: IconName }[] = [
  { href: "/coach/today", label: "Today", icon: "sun" },
  { href: "/coach", label: "Clients", icon: "users" },
  { href: "/coach/check-ins", label: "Progress", icon: "chart" },
  { href: "/coach/messages", label: "Messages", icon: "message" },
];
const MORE: { href: string; label: string; icon: IconName }[] = [
  { href: "/coach/plans", label: "Plans", icon: "list" },
  { href: "/coach/business", label: "Business", icon: "briefcase" },
  { href: "/coach/library", label: "Library", icon: "dumbbell" },
  { href: "/coach/settings", label: "Settings", icon: "settings" },
  { href: "/coach/billing", label: "Plan and billing", icon: "rupee" },
];

const active = (path: string, href: string) =>
  href === "/coach" ? path === "/coach" || path.startsWith("/coach/clients") : path === href || path.startsWith(`${href}/`);

/** Below 1024 px the rail gives way to a bottom tab bar, with the rest behind "More". */
export function MobileNav() {
  const path = usePathname() ?? "/coach";
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const moreActive = MORE.some((m) => active(path, m.href));

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-30 bg-[color-mix(in_srgb,var(--text)_40%,transparent)] lg:hidden" onClick={() => setOpen(false)} aria-hidden />
      ) : null}
      {open ? (
        <div id="more-menu" className="fixed inset-x-3 bottom-20 z-40 rounded-xl border border-line bg-card p-2 shadow-md lg:hidden" role="menu">
          {MORE.map((m) => (
            <Link key={m.href} href={m.href} role="menuitem" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-md ${active(path, m.href) ? "bg-tintBrand font-medium text-brandInk" : "hover:bg-surface"}`}>
              <Icon name={m.icon} size={18} className="text-muted" />
              {m.label}
            </Link>
          ))}
        </div>
      ) : null}
      <nav aria-label="Main" className="material fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[color-mix(in_srgb,var(--card)_90%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden print:hidden">
        <ul className="grid grid-cols-5">
          {MAIN.map((m) => {
            const on = active(path, m.href);
            return (
              <li key={m.href}>
                <Link href={m.href} aria-current={on ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-2xs ${on ? "font-medium text-brandInk" : "text-muted"}`}>
                  <Icon name={m.icon} size={20} />
                  {m.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="more-menu" className={`flex w-full flex-col items-center gap-0.5 py-2 text-2xs ${open || moreActive ? "font-medium text-brandInk" : "text-muted"}`}>
              <Icon name="more" size={20} className="[stroke-width:3]" />
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

/** A thin banner whenever the browser loses its connection. */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <p role="status" className="border-b border-warning bg-tintWarning px-6 py-2 text-center text-sm text-warning print:hidden">
      You&apos;re offline. You can keep reading; anything you save or send is held until the connection is back.
    </p>
  );
}
