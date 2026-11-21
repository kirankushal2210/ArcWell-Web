# Phase 3 — Client profile and progress

**Delivers:** the full client record on one wide screen: plans, check-ins, measurements, photos and charts, with actions always one click away.
**Size:** 6 days · **Depends on:** Phase 2

## 1. WHY

### 1.1 The problem

The coach needs to answer three questions about a client in seconds: is it working, what changed, what do I do next. On the phone those answers are spread across tabs and detail pages.

### 1.2 Who it's for

The coach preparing for a check-in or a call. This is the screen they sit on longest.

### 1.3 Why now

Charts and measurements already exist in the product but are buried. This phase surfaces them and makes them readable at a glance.

### 1.4 What success looks like

A coach can explain a client's month using one screen, without opening a spreadsheet.

## 2. WHAT

### 2.1 Layout

- Two columns: left is the record (tabs), right is a fixed action rail 320 px wide.
- Header: avatar, name, goal, status, joined date, check-in day.
- The rail is sticky while the record scrolls.

### 2.2 The record tabs

| Tab | Contents |
|---|---|
| Overview | adherence, weight change, goal, weight chart, this week, plans, quick links |
| Training | plan vs actual, sessions, records, per-workout detail |
| Nutrition | calories vs target, food days, plan adherence |
| Recovery | sleep, recovery score, strain, flags |

### 2.3 Progress view

- Weight chart with a range selector: 4 weeks · 12 weeks · all.
- Measurements as a dated time series with a trend line per measurement.
- Progress photos as a dated strip.
- Share progress report as a PDF.

### 2.4 Measurements become a time series (data change)

Measurements are currently stored as a start and a current value, which cannot be charted. They become dated entries: one row per measurement per date, with label, value, unit and date. Existing start/current values are migrated into two dated entries.

### 2.5 The action rail

- Message the client.
- Review the latest check-in.
- Renew and send a payment request.
- Edit the plan.
- Change status.

### 2.6 States

| State | Requirement |
|---|---|
| Loading | header and rail immediately; record shows a skeleton |
| No data | each card explains what will appear and when |
| Error | card-level retry, not a whole-page failure |

## 3. PROOF

- **AC1** — Every action in the rail is reachable in at most two clicks *(walk each action)*
- **AC2** — Weight chart renders with the range selector *(switch ranges)*
- **AC3** — Measurements show as a dated time series with a trend *(add two entries)*
- **AC4** — Existing start/current measurements survive the migration *(verify demo data)*
- **AC5** — Progress photos show in date order *(open a client with photos)*
- **AC6** — The PDF report downloads on web *(click share)*
- **AC7** — Wide layout does not change the phone profile *(compare screenshots)*
- **AC8** — Cards fail independently, not the whole page *(simulate one failing query)*

## 4. WHERE

### 4.1 New files

| File | Purpose |
|---|---|
| app/src/features/coach/ClientProfileWide.tsx | two-column layout and the action rail |
| app/src/features/coach/ProgressCharts.tsx | weight, measurements and adherence charts with a range selector |
| supabase/migrations/<new>_measurement_entries.sql | dated measurements table with RLS and indexes |

### 4.2 Files changed

| File | Change |
|---|---|
| app/src/app/coach/client/[id].tsx | wide: render the two-column layout; narrow: unchanged |
| app/src/features/coach/ClientSections.tsx | reuse Overview, Training, Nutrition, Recovery, Progress |
| app/src/features/coach/sampleData.ts | replace start/current measurements with dated entries |

### 4.3 Rules

- Every new table ships with row-level security, policies, least-privilege grants, a foreign-key index and pgTAP tests.
- Charts reuse the existing chart components rather than adding a chart library.
- No chart may invent data; empty series render an explanation, not a flat line.

## 5. WHAT TO BUILD

### 5.1 Layout

- [ ] Two columns: record left, 320 px action rail right.
- [ ] Rail is sticky while the record scrolls.
- [ ] Header shows avatar, name, goal, status, joined date, check-in day.

### 5.2 Record

- [ ] Overview, Training, Nutrition and Recovery tabs render their existing content.
- [ ] Progress view is reachable as a tab or a prominent entry.
- [ ] Each tab shows a summary line before the detail.

### 5.3 Charts

- [ ] Weight chart with 4-week, 12-week and all ranges.
- [ ] Measurements chart from dated entries.
- [ ] Progress photo strip in date order.
- [ ] PDF report share works on web.

### 5.4 Data

- [ ] Dated measurements table with RLS, indexes and pgTAP tests.
- [ ] Migration converts existing start/current values into dated entries.
- [ ] Demo data updated.

### 5.5 States

- [ ] Skeleton while loading.
- [ ] Card-level empty explanations.
- [ ] Card-level retry on error.

