"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { Client, JourneyStage } from "@/lib/data";
import {
  checkInOverdue,
  counts,
  FILTER_LABELS,
  filterClients,
  journeyView,
  needsAttention,
  relativeDay,
  renewingThisWeek,
  sortClients,
  type Filter,
  type SortDir,
  type SortKey,
} from "@/lib/domain";
import { AdherenceMeter, Avatar, Empty, Kbd, Pills, StatusBadge, buttonClass } from "./ui";
import { Icon, type IconName } from "./icons";

const ROW_H = 60;
const OVERSCAN = 8;

const COLUMNS: { key: SortKey | null; label: string; className: string }[] = [
  { key: "name", label: "Client", className: "flex-1 min-w-[200px]" },
  { key: null, label: "Stage", className: "w-[132px]" },
  { key: "status", label: "Status", className: "w-[104px]" },
  { key: "adherence", label: "Adherence", className: "w-[140px]" },
  { key: null, label: "Last check-in", className: "w-[112px]" },
  { key: "renewal", label: "Renewal", className: "w-[104px]" },
  { key: null, label: "Next step", className: "flex-1 min-w-[180px]" },
  { key: null, label: "", className: "w-8" },
];

/** What the coach should do next, and how loudly to say it. */
function nextStep(client: Client): { text: string; tone: "act" | "info" | "watch" | "calm" } {
  if (client.attention) return { text: client.attention, tone: "act" };
  if (checkInOverdue(client)) return { text: "Check-in overdue", tone: "act" };
  if (client.unread > 0) return { text: `${client.unread} unread ${client.unread === 1 ? "message" : "messages"}`, tone: "info" };
  if (needsAttention(client)) return { text: "Watch this week", tone: "watch" };
  return { text: "On track", tone: "calm" };
}

const STEP_STYLE = {
  act: { dot: "bg-brand", text: "text-ink font-medium" },
  info: { dot: "bg-recovery", text: "text-ink" },
  watch: { dot: "bg-warning", text: "text-muted" },
  calm: { dot: "bg-success", text: "text-faint" },
} as const;

const STAGE_SHORT: Record<JourneyStage, string> = {
  onboarding: "Onboarding",
  transformation: "Transformation",
  maintenance: "Maintenance",
  ongoing: "Ongoing",
};

export function ClientsTable({ clients, stage }: { clients: Client[]; stage: JourneyStage | "all" }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("attention");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("adherence");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [scrollTop, setScrollTop] = useState(0);
  const [selected, setSelected] = useState(0);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  // The keyboard marker shows only while the list itself has focus.
  const [focused, setFocused] = useState(false);
  const viewport = useRef<HTMLDivElement | null>(null);

  const rows = useMemo(
    () =>
      sortClients(filterClients(clients, filter, query, stage), sortKey, sortDir).map((c) => ({
        client: c,
        journey: journeyView(c.journey),
      })),
    [clients, filter, query, stage, sortKey, sortDir],
  );

  // A new filter or search starts the selection from the top.
  useEffect(() => setSelected(0), [filter, query, stage, sortKey, sortDir]);

  const c = counts(clients);
  const viewportH = viewport.current?.clientHeight ?? 560;
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const end = Math.min(rows.length, Math.ceil((scrollTop + viewportH) / ROW_H) + OVERSCAN);
  const visible = rows.slice(start, end);

  const onSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  /** Arrow keys move the selection, keeping it in view; Enter opens the client. */
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!rows.length || menu) return;
    const move = (to: number) => {
      e.preventDefault();
      const next = Math.max(0, Math.min(rows.length - 1, to));
      setSelected(next);
      const el = viewport.current;
      if (el) {
        const top = next * ROW_H;
        if (top < el.scrollTop) el.scrollTop = top;
        else if (top + ROW_H > el.scrollTop + el.clientHeight) el.scrollTop = top + ROW_H - el.clientHeight;
      }
    };
    if (e.key === "ArrowDown") move(selected + 1);
    else if (e.key === "ArrowUp") move(selected - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(rows.length - 1);
    else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[selected];
      if (row) router.push(`/coach/clients/${row.client.id}`);
    }
  };

  const clearFilters = () => {
    setFilter("all");
    setQuery("");
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Pills<Filter>
          value={filter}
          onChange={setFilter}
          label="Filter clients"
          options={(Object.keys(FILTER_LABELS) as Filter[]).map((k) => ({ key: k, label: FILTER_LABELS[k], count: c[k] }))}
        />
        <label className="ml-auto flex h-10 items-center gap-2 rounded-lg border border-line bg-card px-3 text-muted shadow-sm transition-colors duration-[120ms] ease-quiet hover:border-strong focus-within:border-brand">
          <Icon name="search" size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, goal or email"
            aria-label="Search clients"
            className="w-52 bg-transparent text-base text-ink outline-none placeholder:text-faint"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[1080px]">
            <div className="flex items-center gap-4 border-b border-line bg-surface px-5 py-2.5" role="row">
              {COLUMNS.map((col, i) => (
                <div key={i} className={col.className} role="columnheader">
                  {col.key ? (
                    <button
                      onClick={() => onSort(col.key as SortKey)}
                      aria-label={`Sort by ${col.label.toLowerCase()}`}
                      className={`inline-flex items-center gap-1 text-sm font-medium transition-colors duration-[120ms] ease-quiet hover:text-ink ${
                        sortKey === col.key ? "text-brandInk" : "text-muted"
                      }`}
                    >
                      {col.label}
                      <span aria-hidden className="text-2xs leading-none">
                        {sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </button>
                  ) : col.label ? (
                    <span className="text-sm font-medium text-muted">{col.label}</span>
                  ) : (
                    <span className="sr-only">Actions</span>
                  )}
                </div>
              ))}
            </div>

            {rows.length === 0 ? (
              <div className="p-6">
                <Empty
                  title="No clients match"
                  body="Nobody fits this filter and search together."
                  action={
                    <button type="button" onClick={clearFilters} className={buttonClass("secondary")}>
                      Clear filters
                    </button>
                  }
                />
              </div>
            ) : (
              <div
                ref={viewport}
                tabIndex={0}
                onKeyDown={onKey}
                onFocus={(e) => e.target === e.currentTarget && setFocused(true)}
                onBlur={() => setFocused(false)}
                onScroll={(e) => {
                  setScrollTop(e.currentTarget.scrollTop);
                  setMenu(null);
                }}
                className="h-[calc(100vh-420px)] min-h-[360px] overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)]"
                role="grid"
                aria-label="Clients. Use the arrow keys to move and Enter to open."
                aria-rowcount={rows.length}
                aria-activedescendant={rows[selected] ? `row-${rows[selected].client.id}` : undefined}
              >
                <div style={{ height: rows.length * ROW_H, position: "relative" }}>
                  {visible.map(({ client, journey }, i) => {
                    const index = start + i;
                    const step = nextStep(client);
                    const soon = renewingThisWeek(client);
                    const on = index === selected;
                    return (
                      <div
                        key={client.id}
                        id={`row-${client.id}`}
                        role="row"
                        aria-rowindex={index + 1}
                        aria-selected={on}
                        onClick={() => router.push(`/coach/clients/${client.id}`)}
                        onMouseEnter={() => setSelected(index)}
                        className={`group absolute inset-x-0 flex cursor-pointer items-center gap-4 border-b border-line px-5 transition-colors duration-[120ms] ease-quiet ${
                          on ? "bg-surface" : ""
                        }`}
                        style={{ top: index * ROW_H, height: ROW_H }}
                      >
                        {on && focused ? <span className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden /> : null}
                        <div className="flex min-w-[200px] flex-1 items-center gap-3" role="gridcell">
                          <Avatar name={client.name} size={34} />
                          <div className="min-w-0">
                            <Link
                              href={`/coach/clients/${client.id}`}
                              tabIndex={-1}
                              onClick={(e) => e.stopPropagation()}
                              className="block truncate text-md font-medium leading-5 group-hover:text-brandInk"
                            >
                              {client.name}
                            </Link>
                            <p className="truncate text-sm leading-5 text-muted">{client.goal}</p>
                          </div>
                        </div>

                        <div className="w-[132px]" role="gridcell">
                          <p className="truncate text-sm font-medium">{STAGE_SHORT[journey.stage]}</p>
                          {journey.totalWeeks ? (
                            <span className="mt-1 flex items-center gap-1.5">
                              <span className="h-1 w-12 overflow-hidden rounded-full bg-raised" aria-hidden>
                                <span
                                  className={`block h-full rounded-full ${journey.next.urgent ? "bg-brand" : "bg-ink"}`}
                                  style={{ width: `${journey.pct ?? 0}%` }}
                                />
                              </span>
                              <span className="tnum font-mono text-2xs text-muted">
                                wk {Math.min(journey.week, journey.totalWeeks)}/{journey.totalWeeks}
                              </span>
                            </span>
                          ) : (
                            <span className="tnum font-mono text-2xs text-muted">wk {journey.week}</span>
                          )}
                        </div>

                        <div className="w-[104px]" role="gridcell">
                          <StatusBadge status={client.status} />
                        </div>

                        <div className="w-[140px]" role="gridcell">
                          <AdherenceMeter value={client.adherence} />
                        </div>

                        <div
                          className={`tnum w-[112px] font-mono text-sm ${checkInOverdue(client) ? "font-medium text-brandInk" : "text-muted"}`}
                          role="gridcell"
                        >
                          {client.lastCheckIn ? relativeDay(client.lastCheckIn) : "—"}
                        </div>

                        <div className={`tnum w-[104px] font-mono text-sm ${soon ? "font-medium text-brandInk" : "text-muted"}`} role="gridcell">
                          {relativeDay(client.nextRenewal)}
                          {soon ? <span className="sr-only"> (renews this week)</span> : null}
                        </div>

                        <div className="flex min-w-[180px] flex-1 items-center gap-2 text-base" role="gridcell">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${STEP_STYLE[step.tone].dot}`} aria-hidden />
                          <span className={`truncate ${STEP_STYLE[step.tone].text}`}>{step.text}</span>
                        </div>

                        <div className="w-8" role="gridcell">
                          <button
                            type="button"
                            aria-label={`Actions for ${client.name}`}
                            aria-haspopup="menu"
                            aria-expanded={menu?.id === client.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              const r = e.currentTarget.getBoundingClientRect();
                              setMenu(menu?.id === client.id ? null : { id: client.id, x: r.right, y: r.bottom });
                            }}
                            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors duration-[120ms] ease-quiet hover:bg-raised hover:text-ink"
                          >
                            <Icon name="more" size={18} className="[stroke-width:3]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <p className="tnum font-mono">
          {rows.length} of {clients.length} clients
        </p>
        <p className="hidden items-center gap-1.5 md:flex">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> move
          <Kbd>↵</Kbd> open
        </p>
      </div>

      {menu ? <RowMenu clientId={menu.id} x={menu.x} y={menu.y} onClose={() => setMenu(null)} /> : null}
    </div>
  );
}

const MENU: { label: string; icon: IconName; href: (id: string) => string }[] = [
  { label: "Message", icon: "message", href: () => "/coach/messages" },
  { label: "Review check-in", icon: "check", href: () => "/coach/check-ins" },
  { label: "Renew and request payment", icon: "rupee", href: () => "/coach/business" },
  { label: "Edit plan", icon: "list", href: () => "/coach/plans" },
  { label: "Open profile", icon: "users", href: (id) => `/coach/clients/${id}` },
];

/** The row's action menu: fixed to the button, closes on Escape or a click outside. */
function RowMenu({ clientId, x, y, onClose }: { clientId: string; x: number; y: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("a")?.focus();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Rendered into the body: an animated ancestor would otherwise become the containing block
  // for this fixed menu and push it off to the side.
  // Open upward when there is no room below.
  const openUp = typeof window !== "undefined" && y + 220 > window.innerHeight;
  return createPortal(
    <div
      ref={ref}
      role="menu"
      className="fixed z-30 w-60 rounded-xl border border-line bg-card p-1.5 shadow-md"
      style={{ left: Math.max(8, x - 240), top: openUp ? y - 230 : y + 6 }}
    >
      {MENU.map((m) => (
        <Link
          key={m.label}
          role="menuitem"
          href={m.href(clientId)}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-base text-ink transition-colors duration-[120ms] ease-quiet hover:bg-surface focus:bg-surface"
        >
          <Icon name={m.icon} size={15} className="text-muted" />
          {m.label}
        </Link>
      ))}
    </div>,
    document.body,
  );
}
