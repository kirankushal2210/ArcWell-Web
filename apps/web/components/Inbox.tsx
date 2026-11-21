"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Client, Message } from "@/lib/data";
import { relativeDay } from "@/lib/domain";
import { AdherenceMeter, Avatar, Button, Empty, Kbd, StatusBadge, buttonClass } from "./ui";
import { Icon } from "./icons";

export function Inbox({ messages, clients }: { messages: Message[]; clients: Client[] }) {
  const threads = useMemo(() => {
    const byClient = new Map<string, Message[]>();
    for (const m of messages) {
      const list = byClient.get(m.clientId) ?? [];
      list.push(m);
      byClient.set(m.clientId, list);
    }
    return [...byClient.entries()].map(([clientId, list]) => ({
      clientId,
      name: list[0]?.clientName ?? "Client",
      last: list[list.length - 1],
      unread: list.filter((m) => m.unread).length,
      list,
    }));
  }, [messages]);

  const [activeId, setActiveId] = useState(threads[0]?.clientId);
  const [draft, setDraft] = useState("");
  const active = threads.find((t) => t.clientId === activeId) ?? threads[0];
  const client = clients.find((c) => c.id === active?.clientId);

  if (!active) return <Empty title="No conversations yet" body="Messages appear here when a client writes to you." />;

  return (
    <div className="grid h-[calc(100vh-220px)] min-h-[520px] grid-cols-1 overflow-hidden rounded-xl border border-line bg-card shadow-sm lg:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_300px]">
      <div className="flex min-h-0 flex-col border-r border-line">
        <p className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5 text-sm font-medium text-muted">
          Conversations
          <span className="tnum font-mono text-xs">{threads.length}</span>
        </p>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {threads.map((t) => {
            const on = t.clientId === active.clientId;
            return (
              <li key={t.clientId}>
                <button
                  onClick={() => setActiveId(t.clientId)}
                  aria-current={on ? "true" : undefined}
                  className={`relative flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors duration-[120ms] ease-quiet ${
                    on ? "bg-tintBrand" : "hover:bg-surface"
                  }`}
                >
                  {on ? <span className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden /> : null}
                  <Avatar name={t.name} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-base ${t.unread ? "font-semibold" : "font-medium"}`}>{t.name}</span>
                      <span className="tnum shrink-0 font-mono text-2xs text-faint">{relativeDay(t.last?.at ?? null)}</span>
                    </span>
                    <span className={`block truncate text-sm ${t.unread ? "text-ink" : "text-muted"}`}>{t.last?.text ?? ""}</span>
                  </span>
                  {t.unread ? (
                    <span className="tnum grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 font-mono text-2xs font-medium text-onBrand">
                      {t.unread}
                      <span className="sr-only"> unread</span>
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="flex items-center gap-3 border-b border-line px-5 py-3">
          <Avatar name={active.name} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-md font-semibold">{active.name}</p>
            <p className="truncate text-sm text-muted">{client?.goal ?? ""}</p>
          </div>
          {client ? (
            <Link href={`/coach/clients/${client.id}`} className={buttonClass("secondary")}>
              Profile
            </Link>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-surface px-5 py-5">
          {active.list.map((m) => {
            const coach = m.from === "coach";
            return (
              <div key={m.id} className={`flex items-end gap-2 ${coach ? "justify-end" : "justify-start"}`}>
                {!coach ? <Avatar name={m.clientName} size={26} /> : null}
                <div
                  className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-md leading-6 shadow-sm ${
                    coach ? "rounded-br-md bg-brand text-onBrand" : "rounded-bl-md border border-line bg-card text-ink"
                  }`}
                >
                  {m.text}
                  <span className={`tnum mt-1 block font-mono text-2xs ${coach ? "text-onBrand opacity-75" : "text-faint"}`}>
                    {relativeDay(m.at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-line p-4">
          <div className="flex items-end gap-2 rounded-xl border border-line bg-card p-2 shadow-sm transition-colors duration-[120ms] ease-quiet focus-within:border-brand">
            <label htmlFor="inbox-draft" className="sr-only">
              Message {active.name}
            </label>
            <textarea
              id="inbox-draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder={`Message ${active.name.split(" ")[0]}`}
              className="min-w-0 flex-1 resize-none bg-transparent px-2 py-1 text-md text-ink outline-none placeholder:text-faint"
            />
            <Button onClick={() => setDraft("")} disabled={!draft.trim()}>
              <Icon name="send" size={14} /> Send
            </Button>
          </div>
          <p className="mt-2 flex items-center gap-3 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> send
            </span>
            <span className="flex items-center gap-1">
              <Kbd>⇧</Kbd>
              <Kbd>↵</Kbd> new line
            </span>
          </p>
        </div>
      </div>

      <aside className="hidden border-l border-line p-5 2xl:block">
        <div className="flex flex-col items-center text-center">
          <Avatar name={active.name} size={56} />
          <p className="mt-3 text-md font-semibold">{active.name}</p>
          <p className="text-sm text-muted">{client?.goal ?? ""}</p>
          {client ? (
            <div className="mt-2">
              <StatusBadge status={client.status} />
            </div>
          ) : null}
        </div>
        <dl className="mt-6 space-y-4 text-base">
          <div>
            <dt className="mb-1 text-sm text-muted">Adherence</dt>
            <dd>
              <AdherenceMeter value={client?.adherence ?? null} />
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Last check-in</dt>
            <dd className="tnum font-mono text-sm">{relativeDay(client?.lastCheckIn ?? null)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Renews</dt>
            <dd className="tnum font-mono text-sm">{relativeDay(client?.nextRenewal ?? null)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
