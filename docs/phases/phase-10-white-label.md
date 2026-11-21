# Phase 10 — White-label workspace

**Delivers:** Business and Elite coaches serve their workspace on their own domain with their own name and colours.
**Size:** 5 days · **Depends on:** Phase 9

## 1. WHY

### 1.1 The problem

Coaches with 30+ clients run their own brand and their own website. Sending clients to a third-party domain undermines the business they built.

### 1.2 Who it's for

The Business and Elite coach, and the client who receives a link with the coach's name on it.

### 1.3 Why now

It is the visible difference between the ₹999 tier and the ₹1,999 tier.

### 1.4 What success looks like

A coach's own domain serves the workspace with their logo and colours, and the client never sees the platform's brand.

## 2. WHAT

### 2.1 Brand settings

- Coach name, logo, primary colour and accent colour.
- Preview before saving.
- Defaults fall back to the platform brand when unset.

### 2.2 Addresses

| Option | Behaviour |
|---|---|
| Platform subdomain | workspace available at a platform address |
| Own domain | the coach's domain serves the workspace |
| Fallback | if the domain is not configured, the platform address still works |

### 2.3 What is branded

- Sign-in screen.
- Sidebar brand block and colours.
- PDF reports and emails sent to clients.

### 2.4 What is not

The phone app keeps the platform brand in this phase; a per-coach store listing is not in scope.

## 3. PROOF

- **AC1** — A coach's domain serves the workspace over HTTPS *(open the domain)*
- **AC2** — Logo and colours appear on sign-in and in the shell *(screenshot)*
- **AC3** — Unset brand values fall back cleanly *(reset and reload)*
- **AC4** — PDF reports carry the coach's brand *(download one)*
- **AC5** — The platform address still works *(open both)*

## 4. WHERE

### 4.1 New files

| File | Purpose |
|---|---|
| supabase/migrations/<new>_brand.sql | brand settings per workspace |
| app/src/features/coach/BrandWide.tsx | brand editor with preview |

### 4.2 Files changed

| File | Change |
|---|---|
| app/src/theme | add a brand override layer on top of the tokens |
| app/src/features/coach/CoachSidebar.tsx | render the brand block from settings |
| app/src/app/login/ | render the brand on sign-in |

### 4.3 Rules

- Branding is data, not a code fork.
- Colour overrides must keep contrast accessible.
- Domain mapping is configuration; no per-coach build.

## 5. WHAT TO BUILD

### 5.1 Brand

- [ ] Editor for name, logo and two colours with preview.
- [ ] Fallback to platform branding when unset.

### 5.2 Addresses

- [ ] Own domain serves the workspace.
- [ ] Platform address always works as a fallback.

### 5.3 Surfaces

- [ ] Sign-in, shell, PDFs and emails carry the brand.
- [ ] Contrast remains accessible after overrides.

