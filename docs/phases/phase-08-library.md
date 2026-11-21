# Phase 8 — Library: exercises, videos, foods and recipes

**Delivers:** the content a coach and client actually use: an exercise library with demos, and an Indian food and recipe database for diet plans.
**Size:** 8 days · **Depends on:** Phase 6

## 1. WHY

### 1.1 The problem

A plan is only as good as its content. Today the exercise library is text-only, so a client cannot see how to perform a movement, and the food database is too thin to build an Indian diet plan quickly.

### 1.2 Who it's for

The coach building plans, and the client following them in the phone app.

### 1.3 Why now

Competitors ship thousands of exercise demos and Indian food databases. Without parity here the product cannot be sold on content.

### 1.4 What success looks like

A coach builds a day of Indian meals and a four-day workout from the library without leaving the product.

## 2. WHAT

### 2.1 Exercise library

- Every exercise carries a demo video link plus cues and equipment.
- At least 200 exercises are seeded with demos.
- A coach can attach their own video to a custom exercise.
- The client sees a “how to do this” control on each exercise in their workout.

### 2.2 Food and recipes

- Indian foods with household measures — katori, roti, piece, gram — not only grams.
- At least 150 recipes with macros.
- Search by name, regional name and category.
- Coaches can add their own foods and recipes.

### 2.3 Diet builder

- Build a day from the database by meal slot.
- Live totals against the client's calorie and protein targets.
- Swap an item and see the effect on totals immediately.

### 2.4 Licensing

Only use food and video data whose licence permits commercial use. Record the source of every imported dataset in the product documentation.

## 3. PROOF

- **AC1** — 200+ exercises have a working demo *(spot check ten)*
- **AC2** — A coach adds a custom video *(upload and play)*
- **AC3** — The client sees the demo on their workout *(check the phone)*
- **AC4** — A day of Indian meals is built in under three minutes *(timed walkthrough)*
- **AC5** — Live totals match the targets *(compare)*
- **AC6** — Recipe and food search works by regional name *(search three names)*
- **AC7** — Every imported dataset has a recorded licence *(review the notes)*

## 4. WHERE

### 4.1 New files

| File | Purpose |
|---|---|
| app/src/features/athlete/library.ts | add an optional demo video field to the exercise type |
| app/src/features/coach/DietBuilderWide.tsx | day builder with live totals |
| supabase/seed/ | exercise, food and recipe seed data with licence notes |

### 4.2 Files changed

| File | Change |
|---|---|
| app/src/app/coach/exercises/index.tsx | wide library grid with demos |
| app/src/app/coach/plan/nutrition/[id].tsx | use the diet builder on wide screens |
| app/src/app/athlete/plan.tsx | show the demo control on exercises |

### 4.3 Rules

- Data model changes are migrations with RLS and tests.
- No media is bundled that the product is not licensed to ship.
- Household measures are first-class, not a free-text note.

## 5. WHAT TO BUILD

### 5.1 Exercises

- [ ] Demo field on every exercise; 200+ seeded with demos.
- [ ] Coach-uploaded video on custom exercises.
- [ ] Demo control visible in the client's workout.

### 5.2 Food

- [ ] Indian foods with household measures and search by regional name.
- [ ] Coach-added foods.
- [ ] At least 150 recipes with macros.

### 5.3 Diet builder

- [ ] Meal-slot building with live totals against targets.
- [ ] Swapping updates totals immediately.

### 5.4 Compliance

- [ ] Every dataset's licence and source is recorded.

