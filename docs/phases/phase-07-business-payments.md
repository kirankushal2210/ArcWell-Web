# Phase 7 — Business, leads and payments

**Delivers:** the money screen: leads, renewals, income and churn, plus the coach's own subscription billing.
**Size:** 6 days · **Depends on:** Phase 6

## 1. WHY

### 1.1 The problem

The coach's revenue lives in memory and in a spreadsheet: who paid, who is due, who is about to leave. Chasing renewals late is the most common cause of lost income.

### 1.2 Who it's for

The coach at month end, and the coach deciding which lead to follow up.

### 1.3 Why now

This is where Arcwell already beats most competitors: leads, renewals, churn reasons and UPI requests in one place.

### 1.4 What success looks like

The coach can see this month's income, the next three renewals and every lead needing a follow-up, without opening anything else.

## 2. WHAT

### 2.1 Leads

| Stage | Meaning |
|---|---|
| New | captured, not contacted |
| Contacted | a first message went out |
| Call booked | a call is scheduled |
| Trial | trying a week |
| Converted | became a client |
| Lost | with a reason |

Each lead shows the next follow-up date and is flagged when due.

### 2.2 Money

- Renewals due in the next 30 days, with one-tap payment request.
- Income recorded per client, with month totals.
- Churn by reason, and clients who left in the period.
- Trends over six months.

### 2.3 The coach's own subscription

- The coach pays Arcwell by subscription, invoiced with GST.
- Plan and client band are visible, with the next charge date.
- Upgrades are prorated; downgrades happen only at renewal.

### 2.4 States

| State | Requirement |
|---|---|
| No leads | explains how to capture one |
| No income yet | explains that fees must be recorded per client |
| Payment failure | visible with a retry and a support link |

## 3. PROOF

- **AC1** — A lead moves through every stage and converts to a client *(walk a lead)*
- **AC2** — A renewal request is sent and marked paid end to end *(do one)*
- **AC3** — Income totals match per-client fees *(reconcile three clients)*
- **AC4** — Churn reasons roll up correctly *(set two reasons)*
- **AC5** — The coach's subscription shows plan, band and next charge *(open billing)*
- **AC6** — Empty states render *(new workspace)*

## 4. WHERE

### 4.1 New files

| File | Purpose |
|---|---|
| app/src/features/coach/BusinessWide.tsx | leads board, renewals, income, trends |
| app/src/features/billing/razorpay.ts | subscription creation and webhook handling |

### 4.2 Files changed

| File | Change |
|---|---|
| app/src/app/coach/business.tsx | wide layout |
| app/src/app/coach/lead/[id].tsx | stage controls on wide screens |
| app/src/app/coach/account/[id].tsx | renewal and payment request on wide screens |

### 4.3 Rules

- Payment secrets live only on the server; never in a public build value.
- Webhooks verify the signature before doing anything.
- Money shown is always recorded data; never estimated.

## 5. WHAT TO BUILD

### 5.1 Leads

- [ ] Six stages with a board view and next follow-up.
- [ ] Convert to client keeps the lead's history.

### 5.2 Money

- [ ] Renewals due list with one-tap request.
- [ ] Income totals and per-client fees reconcile.
- [ ] Churn reasons and trends.

### 5.3 Subscription

- [ ] Coach plan and band visible with next charge date.
- [ ] Upgrades prorated; downgrade only at renewal.
- [ ] GST invoice available.

### 5.4 States

- [ ] Empty states for leads, income and payments.
- [ ] Payment failure shows retry and support.

