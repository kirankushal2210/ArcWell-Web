// Hand-drawn SVG, no chart library. Muted grid with mono labels, one accent per chart:
// the thing that matters (the latest weigh-in, the current month) carries the brand,
// everything else sits in neutral steps.

import type { CSSProperties } from "react";

const MONO = "var(--font-mono), ui-monospace, monospace";

/** Round, readable axis steps around a range. */
function ticks(min: number, max: number, count = 4): number[] {
  const raw = (max - min) / count || 1;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step; // the axis always reaches past the highest value
  const out: number[] = [];
  for (let v = start; v <= end + step * 0.001; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

const draw = { "--len": 1 } as CSSProperties;

export function LineChart({
  values,
  target,
  height = 240,
  unit = "kg",
  startLabel = "First weigh-in",
  endLabel = "Latest",
  label = "Weight trend",
}: {
  values: number[];
  target?: number | null;
  height?: number;
  unit?: string;
  startLabel?: string;
  endLabel?: string;
  label?: string;
}) {
  if (values.length === 0) {
    return <p className="py-10 text-center text-base text-muted">No weigh-ins yet. The trend appears after the first two.</p>;
  }

  const W = 760;
  const L = 44; // room for the value axis
  const R = 16;
  const T = 16;
  const B = 28; // room for the time labels
  const all = target == null ? values : [...values, target];
  const ys = ticks(Math.min(...all) - 0.5, Math.max(...all) + 0.5);
  const min = ys[0] ?? 0;
  const max = ys[ys.length - 1] ?? 1;
  const span = max - min || 1;
  const x = (i: number) => (values.length < 2 ? (L + W - R) / 2 : L + (i / (values.length - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - (v - min) / span) * (height - T - B);

  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(values.length - 1).toFixed(1)},${height - B} L${x(0).toFixed(1)},${height - B} Z`;
  const last = values[values.length - 1] as number;
  const lx = x(values.length - 1);
  const ly = y(last);

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} role="img" aria-label={`${label}: ${values[0]} to ${last} ${unit}${target != null ? `, goal ${target} ${unit}` : ""}`}>
      {ys.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} />
          <text x={L - 10} y={y(v) + 3.5} textAnchor="end" fontSize="11" fill="var(--text-faint)" fontFamily={MONO}>
            {Number.isInteger(v) ? v : v.toFixed(1)}
          </text>
        </g>
      ))}

      {target != null ? (
        <g>
          <line x1={L} x2={W - R} y1={y(target)} y2={y(target)} stroke="var(--accent-2)" strokeDasharray="4 5" strokeWidth={1.5} />
          <rect x={L + 6} y={y(target) - 21} width={86} height={17} rx={5} fill="var(--card)" />
          <text x={L + 10} y={y(target) - 9} fontSize="11" fill="var(--accent-2)" fontFamily={MONO} fontWeight={500}>
            goal {target} {unit}
          </text>
        </g>
      ) : null}

      <path d={area} fill="var(--brand)" fillOpacity={0.07} />
      <path d={line} pathLength={1} className="chart-draw" style={draw} fill="none" stroke="var(--brand)" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) =>
        i === values.length - 1 ? null : <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill="var(--card)" stroke="var(--brand)" strokeWidth={1.5} />,
      )}

      <circle cx={lx} cy={ly} r={9} fill="var(--brand)" fillOpacity={0.14} />
      <circle cx={lx} cy={ly} r={4.5} fill="var(--brand)" stroke="var(--card)" strokeWidth={2} />
      {/* The latest value sits in a small label clear of the line, above or below the point. */}
      <g transform={`translate(${lx - 14}, ${ly < T + 30 ? ly + 14 : ly - 30})`}>
        <rect x={-64} y={0} width={64} height={20} rx={6} fill="var(--text)" />
        <text x={-32} y={14} textAnchor="middle" fontSize="12" fill="var(--card)" fontFamily={MONO} fontWeight={500}>
          {last} {unit}
        </text>
      </g>

      <text x={L} y={height - 8} fontSize="11" fill="var(--text-faint)" fontFamily={MONO}>
        {startLabel}
      </text>
      <text x={W - R} y={height - 8} textAnchor="end" fontSize="11" fill="var(--text-faint)" fontFamily={MONO}>
        {endLabel}
      </text>
    </svg>
  );
}

export function Bars({
  values,
  labels,
  target,
  height = 200,
  format = (n: number) => String(n),
  highlight = "last",
  label = "Values",
}: {
  values: number[];
  labels: string[];
  target?: number;
  height?: number;
  format?: (n: number) => string;
  /** Which bar carries the accent: the latest one, or each one that meets the target. */
  highlight?: "last" | "target";
  label?: string;
}) {
  const W = 760;
  const L = 48;
  const R = 8;
  const T = 24;
  const B = 26;
  const ys = ticks(0, Math.max(...values, target ?? 0) * 1.08);
  const max = ys[ys.length - 1] || 1;
  const slot = (W - L - R) / values.length;
  const bw = Math.min(44, slot * 0.56);
  const y = (v: number) => T + (1 - v / max) * (height - T - B);

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} role="img" aria-label={`${label}: ${labels.map((l, i) => `${l} ${format(values[i] ?? 0)}`).join(", ")}`}>
      {ys.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} />
          <text x={L - 10} y={y(v) + 3.5} textAnchor="end" fontSize="11" fill="var(--text-faint)" fontFamily={MONO}>
            {format(v)}
          </text>
        </g>
      ))}

      {values.map((v, i) => {
        const on = highlight === "last" ? i === values.length - 1 : target != null && v >= target;
        const bx = L + i * slot + (slot - bw) / 2;
        return (
          <g key={i}>
            <rect x={bx} y={y(v)} width={bw} height={Math.max(2, height - B - y(v))} rx={5} fill={on ? "var(--brand)" : "var(--raised)"} />
            {on && highlight === "last" ? (
              <text x={bx + bw / 2} y={y(v) - 8} textAnchor="middle" fontSize="12" fill="var(--text)" fontFamily={MONO} fontWeight={500}>
                {format(v)}
              </text>
            ) : null}
            <text
              x={bx + bw / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize="11"
              fill={on && highlight === "last" ? "var(--text)" : "var(--text-faint)"}
              fontFamily={MONO}
            >
              {labels[i]}
            </text>
          </g>
        );
      })}

      {target != null ? (
        <g>
          <line x1={L} x2={W - R} y1={y(target)} y2={y(target)} stroke="var(--accent-2)" strokeDasharray="4 5" strokeWidth={1.5} />
          <text x={W - R} y={y(target) - 6} textAnchor="end" fontSize="11" fill="var(--accent-2)" fontFamily={MONO} fontWeight={500}>
            target {format(target)}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

/** A ring for a single goal, e.g. kilograms to go. Track neutral, progress in the brand. */
export function ProgressRing({ pct, size = 56, label }: { pct: number; size?: number; label: string }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--raised)" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        opacity={p > 0 ? 1 : 0}
        stroke="var(--brand)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${(p / 100) * c} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dy="4" textAnchor="middle" fontSize="12" fontWeight={500} fill="var(--text)" fontFamily={MONO}>
        {Math.round(p)}%
      </text>
    </svg>
  );
}
