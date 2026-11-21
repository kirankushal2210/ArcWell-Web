# Phase 1 — Desktop shell and navigation

**Delivers:** a coach opens Arcwell on a laptop and lands in a desktop workspace: a left navigation rail plus a wide content area.
**Size:** 4 days · **Depends on:** Phase 0

## 1. WHY

### 1.1 The problem

A coach with 20 clients works on a laptop. Today Arcwell gives them a phone tab bar on a 1440 px window: one thing visible at a time, most of the screen empty, and no way to move between clients, plans and messages without going back.

### 1.2 Who it's for

A coach with 8–30 clients who spends 6–8 hours a week on admin: building plans, reviewing check-ins, replying to messages, chasing renewals — at a desk, with a browser open.

### 1.3 Why it comes before the screens

Every later screen needs a stable frame. Without the shell each screen would invent its own navigation and the product would feel like a collection of pages.

### 1.4 What success looks like

The coach never thinks about navigation. They move from who needs attention to a client to a plan and back without losing context, and the frame never moves.

## 2. WHAT

### 2.1 The breakpoint

| Viewport width | Layout |
|---|---|
| 1024 px and wider | desktop shell: left rail + wide content |
| below 1024 px | phone layout exactly as today: tab bar, stacked screens |

- Crossing 1024 px does not reload, remount or clear typed text.
- Crossing it preserves scroll position within the current screen.
- The rail never renders below 1024 px; the tab bar never renders at or above it.

### 2.2 The left rail

| Property | Value |
|---|---|
| Width | 232 px, fixed |
| Height | full viewport, independent of content scroll |
| Padding | 16 px vertical, 12 px horizontal |
| Row height | 44 px |
| Row radius | 8 px |
| Icon size | 18 px |
| Icon-to-label gap | 12 px |
| Label size | 14–15 px |
| Separation | 1 px hairline on the right edge |

### 2.3 Brand block

- Product name in title weight.
- One muted line beneath: “Coach workspace”.
- 16 px horizontal padding; 24 px space below the block.

### 2.4 Navigation items, in order

| # | Label | Opens | What the coach expects |
|---|---|---|---|
| 1 | Today | /coach/today | what needs attention today |
| 2 | Clients | /coach | the client list |
| 3 | Progress | /coach/check-ins | check-ins awaiting review |
| 4 | Plans | /coach/plans | every client's plan status |
| 5 | Messages | /coach/messages | conversations |
| 6 | Business | /coach/business | leads, renewals, income |
| 7 | Library | /coach/exercises | the exercise library |
| 8 | Settings | /coach/menu | profile, packages, notifications |

One consistent icon per item from the product's icon family. Single-word labels, never truncated. The order is fixed.

### 2.5 States for a rail item

| State | Appearance |
|---|---|
| Inactive | no fill; icon and label muted |
| Active | surface fill; icon and label full strength; label semibold |
| Hover (pointer only) | faint surface tint; text colour unchanged |
| Keyboard focus | visible focus ring around the whole row |
| Pressed | slight scale-down matching the product's press feedback |

Active-path rule: “Clients” is active only at /coach. Every other item is active on its own path and on any path beneath it — /coach/check-ins/abc keeps Progress active, /coach/plans/12 keeps Plans active.

### 2.6 Top bar

| Property | Value |
|---|---|
| Height | 56 px |
| Position | sticky at the top of the content area |
| Left | the current screen's title, not the product name |
| Right | a search entry point, then the coach's avatar |
| Separation | 1 px hairline below |
| Background | page background; subtle blur when content scrolls beneath |

The search entry point opens a search overlay; in this phase it may open only the client search. The avatar opens the coach menu: profile, settings, sign out.

### 2.7 Content area

| Property | Value |
|---|---|
| Maximum width | 1120 px, centred |
| Horizontal padding | 24 px, 32 px at 1440 px and wider |
| Top padding | 24 px |
| Scrolling | each screen scrolls inside the content area |
| Page scrolling | the page itself never scrolls |

### 2.8 Navigation behaviour

- Selecting an item swaps content without a full page load.
- Browser back and forward move between screens correctly.
- Every screen has a shareable address; opening it directly lands there.
- The rail stays visible on detail screens: a client profile, a plan, a conversation.
- Detail screens keep an in-content back control; the rail never shifts or disappears.
- Re-selecting the active item does not reload.

### 2.9 The phone stays untouched

- Below 1024 px the existing tab bar and stacked screens render exactly as today.
- No visual change to the phone experience in this phase.
- The existing phone tab bar is reused, not modified.

### 2.10 Loading, empty, error, signed out

| State | Requirement |
|---|---|
| Loading | rail and top bar render immediately; content shows a skeleton |
| Empty | each screen keeps its empty state, centred in the wide area |
| Error | each screen keeps its error state with a retry |
| Signed out | the shell is replaced by sign-in |

### 2.11 Accessibility

- The rail is announced as navigation; each item as a link.
- Keyboard reaches every item in visual order with visible focus.
- The active item is announced as selected.
- Icons are decorative; the label carries the meaning.
- Contrast meets the design brief in both themes.

### 2.12 Constraints

- All colours, spacing, radii and type come from design tokens — no literal values.
- Reuse the existing text, pressable, page and header primitives.
- No second tab bar inside a screen; deeper navigation is a detail view with back.

## 3. PROOF

- **AC1** — At 1440 px rail, top bar and wide content are visible together *(screenshot)*
- **AC2** — At 390 px the phone tabs render and the rail is absent *(screenshot)*
- **AC3** — Resizing across 1024 px keeps typed text and scroll position *(screen recording)*
- **AC4** — Each of the 8 items opens its screen *(click through all 8)*
- **AC5** — A sub-screen keeps its parent item active *(open a check-in and a plan)*
- **AC6** — “Clients” is active only at /coach *(visit another screen)*
- **AC7** — Back and forward move between screens correctly *(3-step walk)*
- **AC8** — The rail stays visible on profile, plan and conversation *(3 screenshots)*
- **AC9** — Only the content area scrolls *(scroll a long screen)*
- **AC10** — Keyboard alone reaches all 8 items with focus rings *(keyboard walk)*
- **AC11** — Signed out replaces the shell with sign-in *(sign out)*
- **AC12** — No literal colour or spacing values were introduced *(code review)*

## 4. WHERE

### 4.1 New files

| File | Purpose |
|---|---|
| app/src/features/system/useWide.ts | useWide(): one shared 1024 breakpoint constant and a boolean |
| app/src/features/coach/CoachSidebar.tsx | the rail: brand block, 8 items, active/hover/focus states |

### 4.2 Files changed

| File | Change |
|---|---|
| app/src/app/coach/_layout.tsx | wide: a row of rail + the existing Stack; narrow: the Stack only |
| app/src/app/coach/(tabs)/_layout.tsx | unchanged the tab bar must still render below 1024 px |

### 4.3 Building blocks to reuse

| Need | Existing component |
|---|---|
| Text variants and tones | app/src/components/primitives/Text.tsx |
| Pressable row with feedback | app/src/components/primitives/PressableScale.tsx |
| Page padding and titles | Page and PageHeader in app/src/features/coach/parts.tsx |
| Colours, spacing, radii, type | app/src/theme |
| Icons | lucide-react-native, same family as the product |

### 4.4 Routes the rail points at (all exist)

| Label | Route | Screen file |
|---|---|---|
| Today | /coach/today | app/src/app/coach/today.tsx |
| Clients | /coach | app/src/app/coach/(tabs)/index.tsx |
| Progress | /coach/check-ins | app/src/app/coach/(tabs)/check-ins.tsx |
| Plans | /coach/plans | app/src/app/coach/(tabs)/plans.tsx |
| Messages | /coach/messages | app/src/app/coach/(tabs)/messages.tsx |
| Business | /coach/business | app/src/app/coach/business.tsx |
| Library | /coach/exercises | app/src/app/coach/exercises/index.tsx |
| Settings | /coach/menu | app/src/app/coach/menu/index.tsx |

### 4.5 What must not change

- The phone tab bar and its badges.
- Any screen's internal layout — this phase only provides the frame.
- The encrypted phone storage path or the auth flow.

## 5. WHAT TO BUILD

### 5.1 Foundation

- [ ] A single 1024 breakpoint constant exists and is used across the coach area.
- [ ] A hook reports whether the shell is wide and updates on resize.

### 5.2 The rail

- [ ] Rail renders at 232 px with the specified padding and hairline.
- [ ] Brand block shows the product name and the muted “Coach workspace” line.
- [ ] Eight items render in the specified order with icon and label.
- [ ] Active item: surface fill, full-strength text, semibold label.
- [ ] Inactive item: muted text, no fill.
- [ ] Hover state on pointer devices.
- [ ] Keyboard focus ring on every item.
- [ ] Press feedback on tap.
- [ ] Active-path rule implemented.
- [ ] Rail stays fixed while content scrolls.

### 5.3 The frame

- [ ] Content area capped at 1120 px and centred.
- [ ] Horizontal padding 24 px, 32 px from 1440 px.
- [ ] The page never scrolls; each screen scrolls inside the content area.
- [ ] Top bar 56 px, sticky, with title, search entry point and avatar.
- [ ] Top bar title reflects the current screen.
- [ ] Avatar opens the coach menu with profile, settings and sign out.

### 5.4 Navigation

- [ ] Selecting an item swaps content without a full page load.
- [ ] Back and forward work.
- [ ] Direct addresses land on the right screen.
- [ ] Rail remains visible on profile, plan and conversation screens.
- [ ] Detail screens keep an in-content back control.
- [ ] Re-selecting the active item does not reload.

### 5.5 Phone

- [ ] Below 1024 px the tab bar renders as before, with badges.
- [ ] The rail never appears below 1024 px.
- [ ] No visual change to any phone screen.

### 5.6 States and accessibility

- [ ] Loading: rail and top bar render instantly; content shows a skeleton.
- [ ] Empty and error states render correctly inside the wide area.
- [ ] Signed out replaces the shell with sign-in.
- [ ] Rail announced as navigation; items announced as links with selected state.
- [ ] Keyboard reaches all items with visible focus.
- [ ] Contrast passes in both themes.

### 5.7 Not in this phase

- [ ] Client table content (Phase 2).
- [ ] Global search results (Phase 2).
- [ ] Charts or profile redesign (Phase 3).
- [ ] White-label theming (Phase 10).

