# Phase 6 — Plans and the plan builder

**Delivers:** the core job of the product: build and edit a client's training week on a laptop in minutes.
**Size:** 8 days · **Depends on:** Phase 4

## 1. WHY

### 1.1 The problem

Building a week of training is the coach's most valuable and most repetitive task. A spreadsheet is faster than a phone, so coaches stay in spreadsheets.

### 1.2 Who it's for

The coach planning Sunday evening for the week ahead, usually for several clients in one sitting.

### 1.3 Why now

If the web product cannot beat a spreadsheet at this one task, the web tier has no reason to exist.

### 1.4 What success looks like

A four-day plan for one client is built, saved and visible in the client's app in under three minutes.

## 2. WHAT

### 2.1 The plans board

| Column | Content |
|---|---|
| Client | name and plan status: none · ending · week N of M |
| Week | the current week number |
| Status | draft · active · completed |
| Next action | build · continue · start next block |

- Sort by who needs planning first.
- Filters: needs planning · active · ending.

### 2.2 The builder

- Days as columns on wide screens, stacked on narrow.
- Each row is an exercise with sets, reps, rest and load.
- Add from the library, paste from a spreadsheet, or type lines such as “Bench press 3x8-10 90s”.
- Reorder by dragging or with keyboard shortcuts.
- Autosave with an explicit save control and an unsaved-changes guard.

### 2.3 Reuse

- Templates: start from a saved program.
- Clone another client's plan.
- Copy a previous block and restart from week 1.

### 2.4 Change history

A diff shows what changed versus the previous week, so a coach can explain a change to the client.

### 2.5 States

| State | Requirement |
|---|---|
| Empty plan | start-from options, not an empty grid |
| Loading | skeleton of the day columns |
| Save failure | keep edits, show retry, never discard |
| Conflict | if the plan changed elsewhere, show the difference before overwriting |

## 3. PROOF

- **AC1** — A four-day plan is built and saved in under three minutes *(timed walkthrough)*
- **AC2** — Paste-from-sheet creates exercises correctly *(paste a real sheet)*
- **AC3** — Typed lines create sets, reps and rest *(type five lines)*
- **AC4** — Clone to another client copies the plan *(clone once)*
- **AC5** — Save completes in under 500 ms *(measure)*
- **AC6** — Refreshing mid-edit does not lose data *(refresh)*
- **AC7** — The plan appears in the client's phone app *(check the phone)*
- **AC8** — The diff shows what changed from last week *(edit and compare)*

## 4. WHERE

### 4.1 New files

| File | Purpose |
|---|---|
| app/src/features/coach/PlanBuilderWide.tsx | day columns, exercise rows, drag, autosave |
| app/src/features/coach/planDiff.ts | pure diff helpers, unit tested |

### 4.2 Files changed

| File | Change |
|---|---|
| app/src/app/coach/(tabs)/plans.tsx | wide: the plans board |
| app/src/app/coach/plan/training/[id].tsx | wide: the builder; narrow: unchanged |
| app/src/app/coach/workout/[id].tsx | reuse the existing exercise editor |

### 4.3 Rules

- Reuse the existing parsers for pasted sheets and typed lines.
- The athlete and coach share one workout editor; do not fork it.
- Never lose edits on navigation: guard, prompt or autosave.

## 5. WHAT TO BUILD

### 5.1 Board

- [ ] Every client appears with plan status and next action.
- [ ] Sort needs-planning first; filters work.

### 5.2 Builder

- [ ] Days as columns; exercise rows with sets, reps, rest, load.
- [ ] Add from library, paste from sheet, type lines.
- [ ] Reorder by drag and by keyboard.
- [ ] Autosave plus explicit save, with an unsaved-changes guard.

### 5.3 Reuse

- [ ] Start from a saved program.
- [ ] Clone from another client.
- [ ] Start the next block from a previous one.

### 5.4 History

- [ ] A diff explains what changed versus last week.

### 5.5 States

- [ ] Empty plan offers start options.
- [ ] Save failure keeps edits and offers retry.
- [ ] Conflicts show the difference before overwriting.

