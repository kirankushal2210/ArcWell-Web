# Arcwell Coach Web: read this first

This file is the handover for the next session. It says what the product is, what is built,
how it is built, and what comes next. `AGENTS.md` holds the non-negotiable rules; read it too.

## 1. The product

Arcwell lets an online fitness coach in India run every client's whole journey in one place:
**enrolment through the coach's link → onboarding → transformation → maintenance → ongoing
coaching**, plus the business side (leads, renewals, payments, churn). It replaces Excel/Google
Sheets plus WhatsApp.

The edge: a paired **client mobile app** (the Arcwell app). The coach builds training and
nutrition plans on this website; the client joins through the coach's invite link, sees those
plans in the app, and logs every workout and meal daily. That logging flows back here, so the
coach sees proof of adherence and the client can't fake it.

The coach side also exists in the mobile app but is capped at **7 clients**. The **Coach plan**
(third of five tiers) unlocks this web dashboard.

| Tier | Clients | Monthly | Includes |
|---|---|---|---|
| Free | 1–3 | ₹0 | app, 3 plan types |
| Solo | 4–7 | ₹499 | app |
| Coach | 8–25 | ₹999 | app + web |
| Business | 26–40 | ₹1,999 | + white-label, assistant coaches |
| Elite | 41+ | ₹4,999 | + AI program assistant |

Yearly = monthly × 10. Upgrades prorated; downgrades at renewal; GST 18% on invoices.

## 2. Ground rules agreed with the owner

- **Frontend only, for now.** Do not build or set up backend, Supabase, auth, testing infra or
  deployment until the owner says the backend phase has started. Screens run on sample data.
- **Git:** repo is `github.com/kirankushal2210/ArcWell-Web` (public), branch `main`, commits as
  `kirankushal2210`. Commit or push only when asked. Work on a branch, then PR and merge.
- **Later:** when the backend starts, this repo is to be merged into the mobile repo
  `kirankushal2210/arcwell` as a `web/` folder (git subtree, history kept), sharing database
  migrations and types. Not before.
- Design references the owner chose: the "apple-design" and "Unslop" guides, Trainerize for
  layout patterns (dark rail, one bold accent, activity feed). Bold brand red in the chrome was
  the owner's explicit choice.
- The owner voice-types; "RQL app" in their messages means the Arcwell client app. Confirm the
  app's name before putting it in UI copy.

## 3. What is built (all 14 phase specs in `docs/phases/`, frontend parts)

| Route | What it does | Phase |
|---|---|---|
| `/coach/today` | Summary, needs-attention cards, recent activity feed, check-ins, renewals, leads | 1–2 |
| `/coach` | Clients: stage strip + retention %, Table (stage column, 5 filters, row menu, ↑↓/Enter) and Journey board (stages + Left column) | 2 |
| `/coach/clients/[id]` | Profile: journey track, tabs Overview / Journey / Progress / Training / Nutrition / Recovery, action rail | 3 |
| `/coach/clients/[id]/report` | Printable progress report (browser "Save as PDF") | 3 |
| `/coach/clients/[id]/ai-draft` | AI draft review: per-line accept/edit/reject, validator checks, monthly cap, Elite gate | 13 |
| `/coach/check-ins` | Queue + review: J/K, R, Ctrl/⌘+Enter, Esc, ?; bulk mark-reviewed; quick replies; photo viewer | 4 |
| `/coach/messages` | Inbox: send, photo/PDF attach, voice notes (MediaRecorder), search, broadcast, offline/retry | 5 |
| `/coach/plans` | Plan board + builder: day columns, sets/reps/rest/load, drag + Alt+↑↓ reorder, library picker, templates, clone, next block, autosave draft, diff | 6 |
| `/coach/business` | Tabs: Overview, Leads (6-stage board, history, convert/lost), Payments and income, Churn | 7 |
| `/coach/billing` (+ `/[invoice]`) | Plans and pricing, prorated upgrade preview, GST invoices (printable) | 7 |
| `/coach/library` | Exercises (cues, custom + video), Indian foods (household measures, regional names), recipes, diet builder | 8 |
| `/coach/settings` | Tabs: Profile, Team (assistants, assign, revoke, activity, permissions), Branding (live preview, contrast check, domain) | 9–10 |
| `/coach/get-started` | Onboarding: profile → first client → first week → invite → review | — |
| `/sign-in` | Email-code sign-in UI (no real auth: any 6 digits continue) | 0 |
| everywhere | Dark rail ≥1024 px, bottom tab bar below; skip link; loading/error/not-found; offline banner; account menu | 1, 11 |

Everything that "saves" or "sends" changes state in the page only (and some drafts in
sessionStorage). Copy says what *will* happen once the backend is wired (e.g. "shows in
Priya's Arcwell app").

## 4. How the code is organised

```
apps/web/
  app/coach/…           routes (server components; data passed down as props)
  app/sign-in, app/not-found.tsx
  components/           screens and primitives ("use client" where interactive)
    ui.tsx              Card, Button/buttonClass, Pills, Stat, Avatar, StatusBadge,
                        AdherenceMeter (signature "plates on a bar"), Field, inputClass, Kbd
    charts.tsx          LineChart (axes, goal line, latest label), Bars, ProgressRing; no library
    hooks.ts            useOnline, useUnsavedGuard
  lib/data.ts           ALL sample data and types. The backend later replaces this module only.
  lib/domain.ts         ALL pure logic (filters, journey, retention, diffs, pricing, GST, diet…)
  lib/onboarding.ts     onboarding draft logic and the exercise-line parser
```

Rules that keep it clean: no data fetching in components; no business logic in JSX (put it in
`lib/domain.ts`); design tokens only (no raw hex outside `app/globals.css`); every screen has
loading/empty/error states; every control has an accessible name; never invent numbers (show
"—" and explain).

Key concepts in `lib/domain.ts`: `journeyView(journey)` gives stage, week, %, next step and
milestones; `retentionSummary`; `filterClients(…, stage)`; `planDiff`; `prorate`, `withGst`;
`dietTotals`, `dietTargets`; `draftNextBlock`, `validateDraft`; `contrastRatio`.

## 5. Design system

Tokens live in `app/globals.css` (and are mirrored in `docs/design-tokens.md`): warm graphite
neutrals, **plate red `--brand`** for primary actions/selection, pillar colours (training red,
nutrition green, recovery blue) only for meaning, dark charcoal `--nav*` for the sidebar. Inter
for text, JetBrains Mono for figures (loaded with `next/font`). One easing, 120/220 ms. Tailwind
v3 cannot apply `/opacity` to CSS-variable colours: use `opacity-*` or `color-mix()` instead.

## 6. Run and verify

```bash
cd apps/web
npm install
npm run dev            # http://localhost:3100
npx tsc --noEmit       # must be silent
npm run build && npm run start
```

`.claude/launch.json` has `web` (dev) and `web-prod` (production build) for the Claude
browser pane. Gotchas seen on this machine:
- OneDrive sometimes breaks `.next` (`EINVAL readlink`): delete `apps/web/.next` and rebuild.
- In Claude's sandboxed dev server Google Fonts may not download; the production build fetches
  them fine. Use `web-prod` to check typography.
- Coach routes render per request (`dynamic = "force-dynamic"`) so dates and journey weeks
  never freeze at build time.

## 7. What comes next

1. Owner review of every screen; polish from their feedback.
2. **Backend phase** (only when the owner starts it): merge into the `arcwell` mobile repo as
   `web/`; Supabase auth (email code, httpOnly cookie, middleware guard); replace `lib/data.ts`
   with queries returning the same shapes; invite links that connect a client's app to the
   coach; plans saved here appear in the app; client logs flow back; RLS-proven teams.
3. Open items: real food/exercise datasets with licences recorded (Phase 8); AI drafting on the
   server (Phase 13); performance measurements (Phase 11); hardening and launch (Phase 12).
