# Phase 2 — Clients list

**Delivers:** the coach's home screen: every client, their status and who needs attention, in one sortable table.
**Size:** 4 days · **Depends on:** Phase 1

## 1. WHY

### 1.1 The problem

With 20–50 clients the coach cannot scroll a card list and remember who is slipping. They need one screen that answers: who is behind, who has not checked in, who renews this week.

### 1.2 Who it's for

The coach at the start and end of every day. It is the most-visited screen in the product.

### 1.3 Why now

Every other screen is reached through a client. Without a real list, the shell has nowhere to go.

### 1.4 What success looks like

The coach opens the app, scans 30 clients in five seconds, and clicks the one that needs them.

## 2. WHAT

### 2.1 The table

| Column | Content | Notes |
|---|---|---|
| Client | name + avatar | sticky first column on wide screens |
| Goal | the client's stated goal | truncates at one line |
| Status | active · paused · leaving · completed | colour chip as used on the phone |
| Adherence | percentage for the last 4 weeks | em dash when there is no data |
| Last check-in | relative date and whether reviewed | flags overdue |
| Renewal | next renewal date | flags within 7 days |
| Next action | the one thing to do | e.g. review check-in, renew, message |

### 2.2 Sorting, filtering, search

- Sortable by name, adherence, last check-in and renewal; default is needs-attention first.
- Filters: all · needs attention · overdue check-ins · renewing this week · paused.
- Filters combine with search.
- Search matches name, goal and email, and returns in under 100 ms per keystroke.

### 2.3 Rows and actions

- Clicking a row opens the client profile.
- A row action menu offers: message, review check-in, renew, edit plan.
- Rows are keyboard reachable: arrow keys move, Enter opens.
- The selected row is visibly marked.

### 2.4 Scale

- Only visible rows are rendered (virtualised list).
- 500 clients scroll at 60 fps.
- Data loads in pages; scrolling loads more without a spinner flash.

### 2.5 States

| State | Requirement |
|---|---|
| Loading | skeleton rows, never a blank table |
| Empty | first-run message with one action: add your first client |
| No results | message plus a clear-filters action |
| Error | message plus retry |
| Offline | banner plus the cached list if available |

## 3. PROOF

- **AC1** — 30 seeded clients load in under 300 ms *(measure with the seeded workspace)*
- **AC2** — Sorting works on all four sortable columns *(click each header)*
- **AC3** — Filters combine with search *(apply two filters and a search)*
- **AC4** — Search returns in under 100 ms *(type and observe)*
- **AC5** — 500 rows scroll at 60 fps *(seed 500 and scroll)*
- **AC6** — Row opens the correct client *(click 3 rows)*
- **AC7** — Keyboard moves and opens rows *(keyboard walk)*
- **AC8** — Empty, no-results and error states render *(force each state)*

## 4. WHERE

### 4.1 New files

| File | Purpose |
|---|---|
| app/src/features/coach/ClientsTable.tsx | the wide table, sorting, filtering, virtualised rows |
| app/src/features/coach/clientsQuery.ts | pure filter and sort helpers, unit tested |

### 4.2 Files changed

| File | Change |
|---|---|
| app/src/app/coach/(tabs)/index.tsx | wide: render ClientsTable; narrow: keep today's cards |
| app/src/features/coach/parts.tsx | reuse Page and PageHeader; add nothing new |

### 4.3 Rules

- The phone card list stays exactly as it is.
- Filtering and sorting logic live in a pure module with unit tests, not in the component.
- No new state library; use the existing coach data store.

## 5. WHAT TO BUILD

### 5.1 Table

- [ ] Seven columns as specified render at 1024 px and above.
- [ ] Column widths are stable; names truncate rather than wrap the row.
- [ ] Rows show status chips and flags for overdue and renewal.

### 5.2 Interaction

- [ ] Sorting on name, adherence, last check-in and renewal.
- [ ] Five filters, combinable with search.
- [ ] Search matches name, goal and email in under 100 ms.
- [ ] Row click opens the profile; the row menu offers four actions.
- [ ] Keyboard navigation and Enter to open.

### 5.3 Performance

- [ ] Virtualised rendering; 500 rows scroll at 60 fps.
- [ ] Paged loading on scroll.
- [ ] Initial render under 300 ms with 30 clients.

### 5.4 States

- [ ] Skeleton while loading.
- [ ] First-run empty state with one action.
- [ ] No-results state with clear-filters.
- [ ] Error state with retry.
- [ ] Offline banner.

### 5.5 Phone

- [ ] Below 1024 px the existing card list is unchanged.

