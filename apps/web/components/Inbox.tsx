"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Client, Message } from "@/lib/data";
import {
  AUDIENCE_LABELS,
  broadcastAudience,
  buildThreads,
  formatBytes,
  formatSeconds,
  relativeDay,
  searchThreads,
  type Attachment,
  type Audience,
  type InboxMessage,
} from "@/lib/domain";
import { AdherenceMeter, Avatar, Button, Empty, Kbd, StatusBadge, buttonClass, inputClass } from "./ui";
import { Icon } from "./icons";
import { useOnline } from "./hooks";

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Three-pane inbox: threads, the conversation, and the client's context. Messages sent here
 * reach the client's app once the backend is connected; for now they live in this page.
 */
export function Inbox({ messages, clients }: { messages: Message[]; clients: Client[] }) {
  const online = useOnline();
  const [all, setAll] = useState<InboxMessage[]>(messages);
  const [query, setQuery] = useState("");
  const threads = useMemo(() => searchThreads(buildThreads(all), query), [all, query]);
  const [activeId, setActiveId] = useState(threads[0]?.clientId);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [showContext, setShowContext] = useState(true);
  const [broadcast, setBroadcast] = useState(false);
  const [notice, setNotice] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const positions = useRef<Record<string, number>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const active = threads.find((t) => t.clientId === activeId) ?? threads[0];
  const client = clients.find((c) => c.id === active?.clientId);

  // Opening a thread marks it read; each thread keeps its own scroll position.
  useEffect(() => {
    if (!active) return;
    if (active.unread) setAll((ms) => ms.map((m) => (m.clientId === active.clientId ? { ...m, unread: false } : m)));
    const el = scrollRef.current;
    if (el) el.scrollTop = positions.current[active.clientId] ?? el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.clientId]);

  const pick = (id: string) => {
    if (active && scrollRef.current) positions.current[active.clientId] = scrollRef.current.scrollTop;
    setActiveId(id);
  };

  const send = (retryId?: string) => {
    if (!active) return;
    if (retryId) {
      setAll((ms) => ms.map((m) => (m.id === retryId ? { ...m, status: online ? "sent" : "failed" } : m)));
      return;
    }
    if (!draft.trim() && !attachment) return;
    const msg: InboxMessage = {
      id: `local-${Date.now()}`,
      clientId: active.clientId,
      clientName: active.name,
      from: "coach",
      at: todayIso(),
      text: draft.trim(),
      unread: false,
      attachment: attachment ?? undefined,
      status: online ? "sent" : "failed",
    };
    setAll((ms) => [...ms, msg]);
    setDraft("");
    setAttachment(null);
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const kind = file.type === "application/pdf" ? "pdf" : file.type.startsWith("image/") ? "photo" : null;
    if (!kind) {
      setNotice("Only photos and PDFs can be attached.");
      return;
    }
    setAttachment({ kind, name: file.name, size: file.size, url: URL.createObjectURL(file) });
  };

  if (!active) {
    return <Empty title="No conversations yet" body="Clients reach you from the Arcwell app once they join through your invite link. Their messages appear here." />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex h-10 w-full max-w-sm items-center gap-2 rounded-lg border border-line bg-card px-3 text-muted shadow-sm transition-colors duration-[120ms] ease-quiet focus-within:border-brand hover:border-strong">
          <Icon name="search" size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search names and messages"
            aria-label="Search messages"
            className="w-full bg-transparent text-base text-ink outline-none placeholder:text-faint"
          />
        </label>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={() => setShowContext((v) => !v)} className="hidden 2xl:inline-flex">
            {showContext ? "Hide client panel" : "Show client panel"}
          </Button>
          <Button onClick={() => setBroadcast(true)}>
            <Icon name="users" size={15} /> Broadcast
          </Button>
        </div>
      </div>

      {!online ? (
        <p className="mb-4 rounded-xl border border-warning bg-tintWarning px-4 py-2.5 text-base text-warning" role="status">
          You are offline. You can read conversations, and anything you send is held until the connection returns.
        </p>
      ) : null}
      {notice ? (
        <p className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-success bg-tintSuccess px-4 py-2.5 text-base text-success" role="status">
          <span className="flex items-center gap-2">
            <Icon name="check" size={15} /> {notice}
          </span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss">
            <Icon name="close" size={14} />
          </button>
        </p>
      ) : null}

      <div
        className={`grid grid-cols-1 overflow-hidden lg:h-[calc(100vh-280px)] lg:min-h-[520px] rounded-xl border border-line bg-card shadow-sm lg:grid-cols-[280px_minmax(0,1fr)] ${
          showContext ? "2xl:grid-cols-[280px_minmax(0,1fr)_300px]" : ""
        }`}
      >
        <div className="flex max-h-72 min-h-0 flex-col border-b border-line lg:max-h-none lg:border-b-0 lg:border-r">
          <p className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5 text-sm font-medium text-muted">
            Conversations
            <span className="tnum font-mono text-xs">{threads.length}</span>
          </p>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {threads.length === 0 ? <li className="px-4 py-6 text-center text-sm text-muted">No conversation matches “{query}”.</li> : null}
            {threads.map((t) => {
              const on = t.clientId === active.clientId;
              return (
                <li key={t.clientId}>
                  <button
                    onClick={() => pick(t.clientId)}
                    aria-current={on ? "true" : undefined}
                    className={`relative flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors duration-[120ms] ease-quiet ${on ? "bg-tintBrand" : "hover:bg-surface"}`}
                  >
                    {on ? <span className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden /> : null}
                    <Avatar name={t.name} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-base ${t.unread ? "font-semibold" : "font-medium"}`}>{t.name}</span>
                        <span className="tnum shrink-0 font-mono text-2xs text-faint">{relativeDay(t.last?.at ?? null)}</span>
                      </span>
                      <span className={`block truncate text-sm ${t.unread ? "text-ink" : "text-muted"}`}>
                        {t.last?.from === "coach" ? "You: " : ""}
                        {t.last?.text || (t.last?.attachment ? (t.last.attachment.kind === "voice" ? "Voice note" : t.last.attachment.name) : "")}
                      </span>
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

        <div className="flex h-[560px] min-h-0 flex-col lg:h-auto">
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

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-surface px-5 py-5" aria-live="polite">
            {active.list.map((m) => {
              const coach = m.from === "coach";
              return (
                <div key={m.id} className={`flex items-end gap-2 ${coach ? "justify-end" : "justify-start"}`}>
                  {!coach ? <Avatar name={m.clientName} size={26} /> : null}
                  <div className="max-w-[72%]">
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-md leading-6 shadow-sm ${
                        coach ? "rounded-br-md bg-brand text-onBrand" : "rounded-bl-md border border-line bg-card text-ink"
                      } ${m.status === "failed" ? "opacity-60" : ""}`}
                    >
                      {m.broadcast ? <span className="mb-1 block text-2xs font-medium opacity-80">Broadcast · sent privately</span> : null}
                      {m.attachment ? <AttachmentView a={m.attachment} coach={coach} /> : null}
                      {m.text ? <span className="whitespace-pre-wrap">{m.text}</span> : null}
                      <span className={`tnum mt-1 block font-mono text-2xs ${coach ? "text-onBrand opacity-75" : "text-faint"}`}>
                        {relativeDay(m.at)}
                        {coach && m.status === "sent" ? " · delivered" : ""}
                      </span>
                    </div>
                    {m.status === "failed" ? (
                      <p className="mt-1 flex items-center justify-end gap-2 text-sm text-danger">
                        Not sent
                        <button type="button" onClick={() => send(m.id)} className="font-medium underline">
                          Retry
                        </button>
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-line p-4">
            {attachment ? (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                <Icon name={attachment.kind === "voice" ? "play" : attachment.kind === "pdf" ? "list" : "camera"} size={14} className="text-muted" />
                <span className="min-w-0 flex-1 truncate">
                  {attachment.kind === "voice" ? `Voice note · ${formatSeconds(attachment.seconds)}` : `${attachment.name} · ${formatBytes(attachment.size)}`}
                </span>
                <button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment" className="text-muted hover:text-ink">
                  <Icon name="close" size={14} />
                </button>
              </div>
            ) : null}
            <div className="flex items-end gap-2 rounded-xl border border-line bg-card p-2 shadow-sm transition-colors duration-[120ms] ease-quiet focus-within:border-brand">
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => onFile(e.target.files?.[0])} />
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Attach a photo or PDF" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors duration-[120ms] ease-quiet hover:bg-surface hover:text-ink">
                <Icon name="camera" size={17} />
              </button>
              <VoiceRecorder onDone={(a) => setAttachment(a)} onError={setNotice} />
              <label htmlFor="inbox-draft" className="sr-only">
                Message {active.name}
              </label>
              <textarea
                id="inbox-draft"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder={`Message ${active.name.split(" ")[0]}`}
                className="min-w-0 flex-1 resize-none bg-transparent px-2 py-1 text-md text-ink outline-none placeholder:text-faint"
              />
              <Button onClick={() => send()} disabled={!draft.trim() && !attachment}>
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

        {showContext ? (
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
            {client ? (
              <div className="mt-6 space-y-2">
                <Link href="/coach/check-ins" className={`${buttonClass("secondary")} w-full`}>
                  Review check-in
                </Link>
                <Link href="/coach/plans" className={`${buttonClass("secondary")} w-full`}>
                  Edit plan
                </Link>
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>

      {broadcast ? (
        <BroadcastDialog
          clients={clients}
          onClose={() => setBroadcast(false)}
          onSend={(recipients, text) => {
            const at = todayIso();
            setAll((ms) => [
              ...ms,
              ...recipients.map((c, i) => ({
                id: `bc-${Date.now()}-${i}`,
                clientId: c.id,
                clientName: c.name,
                from: "coach" as const,
                at,
                text,
                unread: false,
                broadcast: true,
                status: (online ? "sent" : "failed") as "sent" | "failed",
              })),
            ]);
            setBroadcast(false);
            setNotice(`Sent privately to ${recipients.length} ${recipients.length === 1 ? "client" : "clients"}. Each one sees it in their own chat.`);
          }}
        />
      ) : null}
    </div>
  );
}

function AttachmentView({ a, coach }: { a: Attachment; coach: boolean }) {
  if (a.kind === "voice") {
    return (
      <span className="mb-1 block">
        <audio controls src={a.url} className="h-9 max-w-full" aria-label={`Voice note, ${formatSeconds(a.seconds)}`} />
        <span className="tnum mt-0.5 block font-mono text-2xs opacity-75">{formatSeconds(a.seconds)}</span>
      </span>
    );
  }
  if (a.kind === "photo") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={a.url} alt={a.name} className="mb-2 max-h-56 rounded-lg object-cover" />;
  }
  return (
    <a href={a.url} target="_blank" rel="noopener noreferrer" className={`mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${coach ? "bg-brandHover" : "bg-surface"}`}>
      <Icon name="list" size={14} />
      <span className="truncate">{a.name}</span>
      <span className="tnum font-mono text-2xs opacity-75">{formatBytes(a.size)}</span>
    </a>
  );
}

/** Records a voice note in the browser with the microphone, then hands it to the composer. */
function VoiceRecorder({ onDone, onError }: { onDone: (a: Attachment) => void; onError: (msg: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      onError("This browser can't record audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream);
      const started = Date.now();
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: r.mimeType || "audio/webm" });
        onDone({ kind: "voice", url: URL.createObjectURL(blob), seconds: Math.max(1, Math.round((Date.now() - started) / 1000)) });
      };
      r.start();
      rec.current = r;
      setSeconds(0);
      setRecording(true);
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      onError("Microphone access was blocked. Allow it in the browser to record voice notes.");
    }
  };

  const stop = () => {
    rec.current?.stop();
    if (timer.current) clearInterval(timer.current);
    setRecording(false);
  };

  return recording ? (
    <button type="button" onClick={stop} aria-label="Stop recording" className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-brand px-2.5 text-sm font-medium text-onBrand">
      <span className="h-2 w-2 rounded-full bg-card" aria-hidden />
      <span className="tnum font-mono">{formatSeconds(seconds)}</span> Stop
    </button>
  ) : (
    <button type="button" onClick={start} aria-label="Record a voice note" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors duration-[120ms] ease-quiet hover:bg-surface hover:text-ink">
      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
        <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm7 9a7 7 0 0 1-14 0m7 7v3" />
      </svg>
    </button>
  );
}

function BroadcastDialog({ clients, onClose, onSend }: { clients: Client[]; onClose: () => void; onSend: (recipients: Client[], text: string) => void }) {
  const [audience, setAudience] = useState<Audience>("active");
  const [text, setText] = useState("");
  const recipients = useMemo(() => broadcastAudience(clients, audience), [clients, audience]);
  const ref = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[color-mix(in_srgb,var(--text)_50%,transparent)] p-6" role="dialog" aria-modal="true" aria-labelledby="bc-title" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-line bg-card p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 id="bc-title" className="text-lg font-semibold">
          Broadcast a message
        </h2>
        <p className="mt-1 text-base text-muted">Everyone in the group gets it as a private message in their own chat. It never becomes a group thread.</p>

        <label htmlFor="bc-group" className="mb-1.5 mt-5 block text-sm font-medium">
          Send to
        </label>
        <select id="bc-group" ref={ref} value={audience} onChange={(e) => setAudience(e.target.value as Audience)} className={`${inputClass} h-10`}>
          {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((a) => (
            <option key={a} value={a}>
              {AUDIENCE_LABELS[a]}
            </option>
          ))}
        </select>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted">
          <span className="tnum font-mono font-medium text-ink">{recipients.length}</span> {recipients.length === 1 ? "client" : "clients"}
          {recipients.slice(0, 4).map((c) => (
            <span key={c.id} className="rounded-full bg-surface px-2 py-0.5 text-xs">
              {c.name}
            </span>
          ))}
          {recipients.length > 4 ? <span className="text-xs">and {recipients.length - 4} more</span> : null}
        </p>

        <label htmlFor="bc-text" className="mb-1.5 mt-5 block text-sm font-medium">
          Message
        </label>
        <textarea id="bc-text" value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="New Diwali week schedule: sessions move to 7 am" className={`${inputClass} resize-y py-2.5 leading-6`} />

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSend(recipients, text.trim())} disabled={!text.trim() || recipients.length === 0}>
            <Icon name="send" size={14} /> Send to {recipients.length}
          </Button>
        </div>
      </div>
    </div>
  );
}
