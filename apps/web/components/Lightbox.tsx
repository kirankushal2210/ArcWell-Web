"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons";

export type LightboxItem = { title: string; caption: string };

/**
 * Full-size photo viewer. A modal with a dimming scrim: arrows move between photos, Escape
 * closes, and focus returns to whatever opened it. Photos arrive from the client's app; until
 * the backend is wired each one is drawn as a labelled frame.
 */
export function Lightbox({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: LightboxItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    opener.current = document.activeElement;
    closeRef.current?.focus();
    return () => (opener.current as HTMLElement | null)?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % items.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + items.length) % items.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndex]);

  const item = items[index];
  if (!item) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-[color-mix(in_srgb,var(--text)_72%,transparent)] p-6" role="dialog" aria-modal="true" aria-label={`${item.title}, ${index + 1} of ${items.length}`} onClick={onClose}>
      <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between text-card">
          <p className="text-md font-medium">
            {item.title} <span className="tnum font-mono text-sm opacity-75">· {index + 1} of {items.length}</span>
          </p>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-lg text-card transition-colors duration-[120ms] ease-quiet hover:bg-[color-mix(in_srgb,var(--card)_15%,transparent)]">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="grid aspect-[3/4] place-items-center rounded-xl border border-line bg-surface shadow-md">
          <PhotoFrame label={item.title} large />
        </div>
        <div className="mt-3 flex items-center justify-between text-card">
          <button type="button" onClick={() => onIndex((index - 1 + items.length) % items.length)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-base transition-colors duration-[120ms] ease-quiet hover:bg-[color-mix(in_srgb,var(--card)_15%,transparent)]">
            <Icon name="chevron" size={14} className="rotate-180" /> Previous
          </button>
          <p className="tnum font-mono text-sm opacity-75">{item.caption}</p>
          <button type="button" onClick={() => onIndex((index + 1) % items.length)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-base transition-colors duration-[120ms] ease-quiet hover:bg-[color-mix(in_srgb,var(--card)_15%,transparent)]">
            Next <Icon name="chevron" size={14} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** A labelled photo frame: a body outline and the angle, until real images arrive. */
export function PhotoFrame({ label, large = false }: { label: string; large?: boolean }) {
  return (
    <span className="flex flex-col items-center gap-2 text-faint">
      <svg width={large ? 96 : 36} height={large ? 160 : 60} viewBox="0 0 48 80" fill="none" stroke="currentColor" strokeWidth={large ? 1.2 : 2} aria-hidden>
        <circle cx="24" cy="10" r="7" />
        <path d="M12 74V44l-4-16a6 6 0 0 1 5-7h22a6 6 0 0 1 5 7l-4 16v30M18 74V50m12 24V50" />
      </svg>
      <span className={`${large ? "text-md" : "text-2xs"} font-medium`}>{label}</span>
    </span>
  );
}
