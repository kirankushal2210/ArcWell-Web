import type { ReactNode } from "react";
import type { ClientStatus } from "@/lib/data";
import { BAND_LABEL, adherenceBand, initials, platesFor, toneFor, type Band, type Tone } from "@/lib/domain";

/* ------------------------------------------------------------------
   Primitives. Warm graphite chrome, plate red for action and selection,
   pillar colours only where they mean something. Hierarchy from size and
   colour; press feedback lands on pointer-down, never on release.
   ------------------------------------------------------------------ */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-card p-5 shadow-sm ${className}`}>{children}</div>;
}

/** Group label above a block. Sentence case, never tracked capitals. */
export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-baseline justify-between gap-4">
      <h2 className="text-md font-semibold text-ink">{children}</h2>
      {right ? <div className="text-sm text-muted">{right}</div> : null}
    </div>
  );
}

export function PageTitle({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
        {sub ? <p className="mt-1 text-md text-muted">{sub}</p> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

const STATUS: Record<ClientStatus, { dot: string; pill: string }> = {
  active: { dot: "bg-success", pill: "bg-tintSuccess text-success" },
  paused: { dot: "bg-warning", pill: "bg-tintWarning text-warning" },
  leaving: { dot: "bg-brand", pill: "bg-tintBrand text-brandInk" },
  completed: { dot: "bg-faint", pill: "bg-surface text-muted" },
};

/** Status is a tinted pill with a dot and a word, so it never depends on colour alone. */
export function StatusBadge({ status }: { status: ClientStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-sm font-medium capitalize ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {status}
    </span>
  );
}

/** A number with its label and what it compares to. No sparkline, no icon. */
export function Stat({
  label,
  value,
  sub,
  tone = "neutral",
  className = "",
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  tone?: "neutral" | "brand";
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border px-5 py-4 shadow-sm ${
        tone === "brand" ? "border-brand bg-brand text-onBrand" : "border-line bg-card"
      } ${className}`}
    >
      <p className={`text-sm ${tone === "brand" ? "text-onBrand opacity-80" : "text-muted"}`}>{label}</p>
      <p className="tnum mt-1 font-mono text-2xl font-medium tracking-[-0.02em]">{value}</p>
      {sub ? <p className={`mt-1 text-sm ${tone === "brand" ? "text-onBrand opacity-80" : "text-muted"}`}>{sub}</p> : null}
    </div>
  );
}

const TONE: Record<Tone, string> = {
  brand: "bg-tintBrand text-brandInk",
  success: "bg-tintSuccess text-success",
  info: "bg-tintInfo text-recovery",
  warning: "bg-tintWarning text-warning",
  neutral: "bg-raised text-ink",
};

/** Initials on a stable tint, so a coach learns to spot a client by colour as well as name. */
export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${TONE[toneFor(name)]}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-strong bg-card px-8 py-10 text-center">
      <p className="text-md font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-base text-muted">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** No pulse: a skeleton should look like loading, not like an alarm. */
export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-surface" />
      ))}
    </div>
  );
}

/** Shared button look, also used by links that act as buttons. */
export function buttonClass(variant: "primary" | "secondary" | "quiet" = "primary") {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-base font-medium transition-[background-color,border-color,color,transform] duration-[120ms] ease-quiet active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";
  const style =
    variant === "primary"
      ? "bg-brand text-onBrand shadow-sm hover:bg-brandHover active:bg-brandPress"
      : variant === "secondary"
        ? "border border-line bg-card text-ink shadow-sm hover:border-strong hover:bg-surface"
        : "text-muted hover:bg-surface hover:text-ink";
  return `${base} ${style}`;
}

export function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "quiet";
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${buttonClass(variant)} ${className}`}>
      {children}
    </button>
  );
}

/** Segmented filter. The selection carries the brand, counts stay quiet mono. */
export function Pills<T extends string>({
  value,
  options,
  onChange,
  label = "Filter",
}: {
  value: T;
  options: { key: T; label: string; count?: number }[];
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-line bg-card p-1 shadow-sm" role="tablist" aria-label={label}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.key)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-base transition-[background-color,color,transform] duration-[120ms] ease-quiet active:scale-[0.97] ${
              on ? "bg-brand font-medium text-onBrand" : "text-muted hover:bg-surface hover:text-ink"
            }`}
          >
            {o.label}
            {typeof o.count === "number" ? (
              <span className={`tnum font-mono text-xs ${on ? "text-onBrand opacity-80" : "text-faint"}`}>{o.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Small key caps for shortcuts. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line bg-card px-1 font-mono text-2xs text-muted shadow-sm">
      {children}
    </kbd>
  );
}

/* ------------------------------------------------------------------
   Signature: the adherence meter. Ten plates on a bar, loaded to the
   percentage. The band colour is always paired with the number and a
   word for screen readers, so it never carries meaning on its own.
   ------------------------------------------------------------------ */

const PLATE: Record<Band, string> = {
  strong: "bg-success",
  slipping: "bg-warning",
  behind: "bg-brand",
};

export function AdherenceMeter({
  value,
  size = "sm",
  showValue = true,
}: {
  value: number | null;
  size?: "sm" | "lg";
  showValue?: boolean;
}) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-2 text-faint" title="No plan yet, so there is nothing to measure">
        <span className="font-mono text-base">—</span>
        <span className="sr-only">No adherence yet</span>
      </span>
    );
  }
  const band = adherenceBand(value);
  const loaded = platesFor(value);
  const plate = size === "lg" ? "h-5 w-2" : "h-3.5 w-1";
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`flex items-center ${size === "lg" ? "gap-1" : "gap-0.5"}`} aria-hidden>
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className={`${plate} rounded-[2px] ${i < loaded ? PLATE[band] : "bg-raised"}`} />
        ))}
      </span>
      {showValue ? (
        <span className={`tnum font-mono ${size === "lg" ? "text-xl font-medium" : "text-sm"} text-ink`}>{value}%</span>
      ) : null}
      <span className="sr-only">{BAND_LABEL[band]}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ forms */

/** Shared look for text inputs, selects and text areas. */
export const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 text-base text-ink shadow-sm outline-none transition-colors duration-[120ms] ease-quiet placeholder:text-faint hover:border-strong focus:border-brand aria-[invalid=true]:border-danger";

/**
 * A labelled form field. The hint and the error are tied to the control through ids, so a
 * screen reader reads them with the field, and an error is never shown by colour alone.
 */
export function Field({
  id,
  label,
  hint,
  error,
  optional = false,
  children,
  className = "",
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-1.5 text-sm font-medium">
        {label}
        {optional ? <span className="font-normal text-faint">optional</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Props that connect a control to its Field's hint or error. */
export function describe(id: string, error?: string, hint?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}
