# Phase 12 — Hardening and launch

**Delivers:** the web workspace is safe to charge for: access rules proven, secrets contained, rollback rehearsed, first coaches onboarded.
**Size:** 5 days · **Depends on:** Phase 11

## 1. WHY

### 1.1 The problem

A paying coach stores their clients' health data in this product. One access mistake ends the business.

### 1.2 Who it's for

The owner, before taking money, and every coach afterwards.

### 1.3 Why now

Security and rollback are cheap before launch and expensive after.

### 1.4 What success looks like

Access rules are proven by tests, no secret is in the client bundle, and a bad release can be undone in minutes.

## 2. WHAT

### 2.1 Access review

- Every table has row-level security and policies.
- Every screen checks authorisation server-side, not just in the interface.
- Cross-workspace reads are impossible and proven by tests.

### 2.2 Secrets

- No secret in any public build value.
- Server secrets only in server environments.
- Keys rotated where they have ever been exposed.

### 2.3 Release safety

- A documented rollback.
- A short release checklist.
- Monitoring for errors and slow actions.

### 2.4 Onboarding

Five coaches are taken through sign-in, adding a client, building a plan and reviewing a check-in, with their friction recorded.

## 3. PROOF

- **AC1** — Access rules proven by database tests *(run the suite)*
- **AC2** — No secret present in the client bundle *(inspect the bundle)*
- **AC3** — Rollback performed once in rehearsal *(do it)*
- **AC4** — Five coaches complete the four core flows unaided *(observe)*
- **AC5** — Monitoring shows errors and slow actions *(open the dashboard)*

## 4. WHERE

### 4.1 Files

| File | Change |
|---|---|
| supabase/tests/ | add any missing access tests |
| docs/product/10-DEPLOYMENT-RUNBOOK.md | rollback and release checklist |
| HANDOVER.md | current state and next steps |

### 4.2 Rules

- No release without the checklist.
- No weakening of a test to make a release pass.

## 5. WHAT TO BUILD

### 5.1 Security

- [ ] Access rules proven by tests on every table.
- [ ] No secret in the client bundle.
- [ ] Authorisation checked server-side on every route.

### 5.2 Operations

- [ ] Rollback documented and rehearsed.
- [ ] Release checklist in place.
- [ ] Monitoring live.

### 5.3 Onboarding

- [ ] Five coaches complete the four core flows unaided.
- [ ] Their friction points are recorded and triaged.

