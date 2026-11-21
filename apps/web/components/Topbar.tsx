"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { shortDate } from "@/lib/domain";
import { Icon } from "./icons";
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
        <Avatar name={coachName} size={32} />
      </div>
    </header>
  );
}
