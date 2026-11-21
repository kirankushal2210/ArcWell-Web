# Design tokens

The source of truth is `apps/web/app/globals.css`; this file mirrors it. No raw hex anywhere
else in the code: components use the Tailwind names in the right-hand column.

## Direction

A strength gym at 6 am: warm graphite neutrals (chalk, rubber floor), plate red as the brand,
and three pillar colours that only ever carry meaning in data. Quiet chrome, rich moments
(charts, the adherence meter, the journey track).

## Colour

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `--bg` | #f7f6f3 | `bg` | page |
| `--surface` | #f0efea | `surface` | table headers, hovers |
| `--raised` | #e7e5df | `raised` | tracks, empty plates |
| `--card` | #ffffff | `card` | cards |
| `--border` | #e3e1da | `line` | hairlines |
| `--strong` | #c6c3ba | `strong` | stronger borders |
| `--text` | #1b1a17 | `ink` | primary text |
| `--text-muted` | #67645c | `muted` | secondary text |
| `--text-faint` | #98958c | `faint` | meta |
| `--brand` | #b9342b | `brand` | primary buttons, selection, the one number that matters |
| `--brand-hover` / `--brand-press` | #a12c24 / #8c261f | `brandHover` / `brandPress` | states |
| `--brand-ink` | #9e2c24 | `brandInk` | red text on light surfaces |
| `--on-brand` | #ffffff | `onBrand` | text on brand (5.9:1) |
| `--success` / `--warning` / `--danger` | #2c7a4b / #8f5c00 / #b9342b | same | status |
| `--pillar-training` / `-nutrition` / `-recovery` | #b9342b / #2c7a4b / #3b5c9c | same | data only |
| `--tint-brand` / `-success` / `-warning` / `-info` | #f9e9e6 / #e6f2ea / #f8efdc / #e9eef8 | `tint*` | pill backgrounds |
| `--nav`, `--nav-raised`, `--nav-line` | #1d1c19, #2a2925, #34322d | `nav*` | dark sidebar |
| `--nav-text`, `--nav-muted`, `--nav-faint` | #f3f1ec, #a9a59b, #77736a | `nav*` | sidebar text |
| `--focus` | = brand (light on the dark rail) | — | 2 px focus ring |

## Type

Inter for text, JetBrains Mono for figures, dates and counts (tabular). Sizes (px/line):
2xs 10/14 · xs 11/16 · sm 12/18 · base 13/20 · md 14/22 · lg 15/24 · xl 20/28 · 2xl 26/32 ·
3xl 30/36 · 4xl 36/40. Weights 400/500/600. Headings tighten (−0.015 to −0.03 em); small text
never does. Sentence case; no tracked capitals.

## Shape, spacing, motion

Radius: sm 6 · md 8 · lg 12 (controls, inner pills) · xl 16 (cards). 4-point spacing. Shadows
`shadow-sm` / `shadow-md` (neutral, soft). One easing `cubic-bezier(0.2, 0, 0, 1)`, 120 ms for
feedback, 220 ms for entrances; press feedback on pointer-down (`active:scale-[0.97]`); all
motion respects `prefers-reduced-motion`.
