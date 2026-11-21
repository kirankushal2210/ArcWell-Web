# Phase 13 — AI program assistant

**Delivers:** a strong model that drafts a client's next training block for the coach, filled with real training and nutrition expertise, with the coach approving every line.
**Size:** 6 days · **Depends on:** Phase 8 (library) and Phase 12

## 1. WHY

### 1.1 The problem

A coach with 40 clients writes roughly 40 programs a month. Even at 15 minutes each that is ten hours of repetitive work that does not need a human's full attention — only a human's judgement.

### 1.2 Who it's for

The experienced coach who already knows how to program and wants speed, not education. This is deliberately different from the athlete-side assistant, which teaches.

### 1.3 Why not retrieval

The coach does not need a library of papers retrieved per request. They need a model that already reasons about training and nutrition, constrained to the exercises and rules this product believes in. Retrieval and agentic teaching belong to the athlete side.

### 1.4 What success looks like

The coach asks for next week's block, reads a draft that respects progressive overload, volume and the client's equipment, changes two lines, and approves it in under two minutes.

## 2. WHAT

### 2.1 The expertise the model must show

| Domain | What the draft must respect |
|---|---|
| Training | progressive overload, weekly volume landmarks per muscle group, session frequency, exercise order, rest for the goal, deload timing |
| Programming logic | the client's level, equipment, injury flags and available days |
| Nutrition | energy balance for the goal, protein per kilogram, meal structure for Indian diets, food preferences and exclusions |
| Safety | no medical advice, no injury diagnosis, no supplements; flag and refuse instead |

### 2.2 How the expertise is supplied

- A long system prompt built from the product's own programming rules and nutrition rules.
- The client's week-level context only: goal, level, days, equipment, adherence, weight trend. Never raw health data.
- The exercise library, so the model can only choose exercises that exist.
- A validator that rejects any draft breaking volume, frequency or safety limits.

### 2.3 The experience

- The coach asks for a draft from the client's screen.
- The draft appears as a comparison against the current plan: added, changed and removed lines.
- The coach accepts individual lines, edits, or rejects the draft.
- Nothing reaches the client without the coach approving it.

### 2.4 Limits and cost

- A soft cap per coach per month, shown before it is reached.
- Every draft records the model and prompt version used.
- Cost per draft stays under one rupee.

## 3. PROOF

- **AC1** — Twenty real scenarios produce drafts a coach would accept with minor edits *(expert review, target 80%)*
- **AC2** — Thirty adversarial prompts are refused and escalated *(safety set, target 100%)*
- **AC3** — The model never selects an exercise outside the library *(validation check)*
- **AC4** — Volume and frequency stay inside the rules on every draft *(validator log)*
- **AC5** — Nothing is sent to a client without approval *(attempt to bypass)*
- **AC6** — Monthly cap is enforced and visible *(hit the cap)*
- **AC7** — Every draft records model and prompt version *(inspect a stored draft)*

## 4. WHERE

### 4.1 New files

| File | Purpose |
|---|---|
| supabase/functions/ai-program/ | server-side generation, validation and metering |
| app/src/features/coach/ProgramDraftWide.tsx | draft, diff and per-line approval |
| docs/product/13-ai-programs.md | the prompt, the rules it encodes, and the eval results |

### 4.2 Files changed

| File | Change |
|---|---|
| app/src/app/coach/plan/training/[id].tsx | an entry point to draft the next block |
| supabase/functions/_shared/ai/ | reuse entitlement, caps and safety screening |

### 4.3 Rules

- The model key never reaches the client.
- Coached clients never see AI output; only the coach does.
- Drafts are data, not messages: nothing auto-sends.
- A refused draft explains what to do instead.

## 5. WHAT TO BUILD

### 5.1 Generation

- [ ] A draft can be requested for a client's next block.
- [ ] The system prompt encodes training and nutrition expertise.
- [ ] Output is strict structured data: days, exercises, sets, reps, rest, load.

### 5.2 Validation

- [ ] Closed vocabulary: only library exercises.
- [ ] Volume, frequency and safety limits enforced.
- [ ] Medical red flags refused with an explanation.

### 5.3 Approval

- [ ] Draft is shown as a diff against the current plan.
- [ ] Per-line accept, edit and reject.
- [ ] Nothing reaches the client without approval.

### 5.4 Operations

- [ ] Per-coach monthly cap enforced and visible.
- [ ] Every draft stores model and prompt version.
- [ ] Cost per draft measured.

