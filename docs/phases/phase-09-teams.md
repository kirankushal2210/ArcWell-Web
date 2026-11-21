# Phase 9 — Teams and assistant coaches

**Delivers:** a coach with staff can invite assistants who see only the clients assigned to them.
**Size:** 5 days · **Depends on:** Phase 7

## 1. WHY

### 1.1 The problem

Above roughly 40 clients a coach stops working alone. Today a workspace has one coach, so the only option is sharing a password, which destroys accountability and data privacy.

### 1.2 Who it's for

The Business and Elite coach with one or more assistants.

### 1.3 Why now

No serious coach with 50 clients buys a single-login product. This is a hard gate for the upper tiers.

### 1.4 What success looks like

An assistant signs in with their own account, sees only their clients, and cannot reach billing or settings.

## 2. WHAT

### 2.1 Roles

| Role | Can do | Cannot do |
|---|---|---|
| Owner | everything | — |
| Assistant | see assigned clients, plans, check-ins, messages | billing, settings, delete clients, invite others |

### 2.2 Assignment

- The owner assigns clients to an assistant.
- An assistant sees only assigned clients, in every list and every screen.
- Revoking access removes access immediately.

### 2.3 Accountability

- Every action records who did it.
- The owner can see which assistant last touched a client.

## 3. PROOF

- **AC1** — An assistant sees exactly their assigned clients *(sign in as assistant)*
- **AC2** — An assistant cannot reach billing or settings *(direct address attempt)*
- **AC3** — Revoking access is immediate *(revoke and reload)*
- **AC4** — Cross-account isolation is proven by database tests *(run the test suite)*
- **AC5** — Every action is attributed *(review the audit)*

## 4. WHERE

### 4.1 New files

| File | Purpose |
|---|---|
| supabase/migrations/<new>_team_members.sql | team membership and client assignment tables |
| supabase/tests/<new>_team_rls.test.sql | pgTAP proof of isolation |
| app/src/features/coach/TeamWide.tsx | invite, assign, revoke |

### 4.2 Files changed

| File | Change |
|---|---|
| app/src/features/coach/CoachData.tsx | scope data by role and assignment |
| app/src/app/coach/menu/index.tsx | add the team entry for owners |

### 4.3 Rules

- Row-level security is the enforcement point, not the interface.
- Every new table ships with policies, least-privilege grants and a foreign-key index.
- pgTAP must prove an assistant cannot read another coach's client.

## 5. WHAT TO BUILD

### 5.1 Roles

- [ ] Owner and assistant roles exist server-side.
- [ ] Assistant cannot reach billing, settings or destructive actions.

### 5.2 Assignment

- [ ] Owner assigns and revokes clients.
- [ ] Assistant lists show only assigned clients.

### 5.3 Proof

- [ ] Database tests prove isolation and revocation.
- [ ] Actions record the acting user.

