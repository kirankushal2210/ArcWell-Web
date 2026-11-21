# Arcwell Coach — web dashboard

A separate web application for Arcwell coaches. It shares the Arcwell Supabase database
(the mobile app's database) but is its own app and its own codebase.

**Who uses it:** a coach with 8–50 online clients, at a desk, replacing WhatsApp plus a
spreadsheet.

**What it must do, in order of value:**
1. Show every client and who needs attention.
2. Let the coach review a week of check-ins in minutes.
3. Let the coach build a training week in minutes.
4. Keep the conversation with each client in one place.
5. Track who paid, who renews, and what the business is doing.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript, strict |
| Styling | Tailwind + design tokens (no raw hex) |
| Components | Radix / shadcn primitives |
| Tables | TanStack Table + TanStack Virtual |
| Server state | TanStack Query |
| Validation | Zod |
| Icons | lucide-react |
| Auth | Supabase (email code), JWT in an httpOnly cookie |
| Database | Supabase Postgres with row-level security |
| Tests | Vitest for pure logic, Playwright for the six critical flows |

## Structure

```
apps/web/app/coach/…      routes
apps/web/components/        screens and primitives
apps/web/lib/data.ts        all sample data and types (the backend replaces only this)
apps/web/lib/domain.ts      pure logic: journey, filters, retention, pricing, diet, diffs
docs/phases/                the 14 phase specifications
docs/design-tokens.md       the tokens, mirrored from app/globals.css
CLAUDE.md                   handover: what is built, decisions, what comes next
```

## Run

```bash
cd apps/web
npm install
npm run dev          # http://localhost:3100
npx tsc --noEmit     # typecheck
npm run build        # production build
npm run start        # serve the production build
```

The app is a single Next.js project. `docs/` holds the specifications it was built
against; `screenshots/` shows every screen as built.

## Work order

Build `docs/phases/` one file at a time, in numeric order. Each phase ends with something
that runs. Do not start phase N+1 before phase N is verified.

## Definition of done (every phase)

1. Every acceptance criterion in that phase file passes.
2. `npx tsc --noEmit` is clean.
3. `npm run build` succeeds.
4. Loading, empty and error states exist on every new screen.
5. No raw hex, no magic spacing — tokens only.
6. Nothing in this repo talks to the mobile app's code.
