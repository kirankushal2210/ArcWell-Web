# Phase 11 — Performance, accessibility and polish

**Delivers:** the product meets its speed targets, works with a keyboard and a screen reader, and never shows a blank or broken screen.
**Size:** 6 days · **Depends on:** Phase 10

## 1. WHY

### 1.1 The problem

A coach with 50 clients feels every slow click. Lag is the difference between a tool they open and a tool they avoid.

### 1.2 Who it's for

Every coach, every session.

### 1.3 Why now

Speed degrades quietly while features are added. It needs a dedicated pass with measurement, not good intentions.

### 1.4 What success looks like

The promises in the product's performance budget are measured and met, and every screen behaves well when things go wrong.

## 2. WHAT

### 2.1 Performance budget

| Action | Budget |
|---|---|
| Open a screen | under 300 ms |
| Search keystroke to results | under 100 ms |
| Save | under 500 ms |
| 500-row table | 60 fps |
| Cold start | under 2 s |

### 2.2 Accessibility

- Every control has a name for assistive technology.
- Focus order follows the visual order.
- Focus is always visible.
- Contrast passes in both themes.
- Nothing depends on colour alone.

### 2.3 States

- Every screen has loading, empty, error and offline states.
- No screen can render blank.
- Errors say what happened and what to do.

## 3. PROOF

- **AC1** — Each budget is measured and recorded *(measurement run)*
- **AC2** — Keyboard alone completes the five core flows *(keyboard walk)*
- **AC3** — A screen reader announces the primary controls *(screen reader pass)*
- **AC4** — Every screen renders its four states *(forced-state walk)*
- **AC5** — No screen renders blank *(full sweep)*

## 4. WHERE

### 4.1 Files

| File | Change |
|---|---|
| app/src/components/primitives/ | fix focus rings and labels where missing |
| app/src/features/system/SystemStates.tsx | fill in any missing shared state |
| docs/product/ | record the measured budgets |

### 4.2 Rules

- Measure before and after; keep the numbers.
- No screen-specific workaround that hides a shared problem.

## 5. WHAT TO BUILD

### 5.1 Speed

- [ ] All five budgets measured and met.
- [ ] Numbers recorded in the product documentation.

### 5.2 Accessibility

- [ ] Names, focus order, visible focus, contrast and non-colour signals verified.
- [ ] Screen reader pass on the five core flows.

### 5.3 States

- [ ] Loading, empty, error and offline implemented on every screen.
- [ ] No blank screens anywhere.

