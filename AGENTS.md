# Rules for anyone (human or AI) working in this repository

## Scope

This repository is the **Arcwell Coach web dashboard only**. It is a separate application
from the Arcwell mobile app, and it shares that app's Supabase database.

- Do not copy React Native code here. No `react-native`, no Expo packages.
- Do not change the database schema to make a screen work. If a query is hard, write a
  view or an RPC and leave the schema alone.
- Row-level security in the database is the security boundary. Never weaken it, never use
  a service-role key in the browser.

## Workflow

1. Work on **one phase at a time**, from `docs/phases/`, in numeric order.
2. Before coding a phase, read its file fully: WHY · WHAT · PROOF · WHERE · WHAT TO BUILD.
3. Plan first: list the files you will create or change, then implement.
4. A phase is done only when every criterion in its PROOF section passes.

## Non-negotiables

- **Design tokens only.** Colours, spacing, radii and type come from
  `docs/design-tokens.md`. No raw hex, no arbitrary pixel values.
- **No secrets in the browser.** Only public configuration may be shipped to the client.
  Anything private lives on the server.
- **States are part of the screen.** Loading, empty, error and offline where relevant.
- **Accessibility is not optional.** Every control has a name, focus is always visible,
  nothing depends on colour alone.
- **No new dependency** without a stated reason and agreement.
- **Never invent data.** If a number is unknown, show a dash and explain.

## Verification before saying "done"

```bash
npx tsc --noEmit
npm run build
```

Then walk the phase's PROOF list at a running URL. Compile success is not product success.

## Things that will be rejected

- A screen that only works at one window width.
- A table that renders 500 rows without virtualisation.
- Data fetched directly inside a screen component.
- Business logic inside JSX.
- "TODO" or placeholder text in a shipped path.
- A test weakened to make a build pass.
