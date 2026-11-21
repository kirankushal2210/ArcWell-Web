# Phase 4 — Check-in review

**Delivers:** a queue and a split view that lets a coach clear ten check-ins in ten minutes with the keyboard.
**Size:** 5 days · **Depends on:** Phase 3

## 1. WHY

### 1.1 The problem

Weekly check-ins are the coach's core ritual and their biggest time sink. Opening a client, finding the check-in, reading photos and replying one at a time on a phone takes minutes per client.

### 1.2 Who it's for

The coach on check-in day, often with 20–40 check-ins waiting.

### 1.3 Why now

Time saved here is the strongest reason a coach pays for the web tier.

### 1.4 What success looks like

The coach moves through the queue with two keys, writes a reply, sends, and the next client is already open.

## 2. WHAT

### 2.1 The queue

- Unreviewed check-ins first, oldest first.
- Overdue check-ins flagged.
- Reviewed check-ins collapse to a lower section.
- Each row shows client, week, submission time and whether photos are attached.

### 2.2 The split view

| Side | Contents |
|---|---|
| Left | answers, photos, week weights, measurements, plan adherence |
| Right | reply box, quick replies, check-in questions, mark reviewed |

### 2.3 Keyboard

| Key | Action |
|---|---|
| J / K | next / previous check-in |
| R | focus the reply box |
| Cmd/Ctrl + Enter | send reply and mark reviewed |
| Esc | leave the reply box |
| ? | show the shortcut list |

### 2.4 Bulk

- Select several check-ins and mark them reviewed at once.
- Bulk review never sends a reply; it only changes review state.

### 2.5 States

| State | Requirement |
|---|---|
| Empty | “no check-ins waiting” with the next due date |
| Loading | skeleton of the split view |
| Error | retry per pane |

## 3. PROOF

- **AC1** — Ten check-ins reviewed by keyboard alone in under ten minutes *(timed walkthrough)*
- **AC2** — J/K move through the queue in order *(keyboard walk)*
- **AC3** — Reply sends and marks reviewed in one action *(send a reply)*
- **AC4** — Bulk mark-reviewed changes state without sending anything *(select three)*
- **AC5** — Overdue check-ins are visibly flagged *(seeded data)*
- **AC6** — Photos open full size *(click a photo)*
- **AC7** — Empty, loading and error states render *(force each)*

## 4. WHERE

### 4.1 New files

| File | Purpose |
|---|---|
| app/src/features/coach/CheckinReviewWide.tsx | queue plus split view |
| app/src/features/coach/useCheckinKeys.ts | keyboard shortcuts, isolated and testable |

### 4.2 Files changed

| File | Change |
|---|---|
| app/src/app/coach/(tabs)/check-ins.tsx | wide: the queue and split view; narrow: unchanged |
| app/src/app/coach/check-in/[id].tsx | reuse the existing detail content in the left pane |

### 4.3 Rules

- Replying uses the existing message and notification paths; no new send mechanism.
- Marking reviewed is idempotent and safe to retry.
- Keyboard shortcuts never fire while typing in the reply box, except Cmd/Ctrl+Enter.

## 5. WHAT TO BUILD

### 5.1 Queue

- [ ] Unreviewed first, oldest first, overdue flagged.
- [ ] Rows show client, week, time and photo indicator.
- [ ] Reviewed check-ins collapse to a secondary section.

### 5.2 Split view

- [ ] Left pane shows answers, photos, week weights, adherence.
- [ ] Right pane shows reply, quick replies and mark reviewed.
- [ ] Photos open full size.

### 5.3 Keyboard

- [ ] J/K, R, Cmd/Ctrl+Enter, Esc and ? all work as specified.
- [ ] A shortcut list is available in the interface.

### 5.4 Bulk

- [ ] Multi-select and mark reviewed.
- [ ] Bulk review never sends a reply.

### 5.5 States

- [ ] Empty state names the next due date.
- [ ] Skeleton while loading.
- [ ] Per-pane retry on error.

