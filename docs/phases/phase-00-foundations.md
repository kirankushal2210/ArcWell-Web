# Phase 0 — Web build and hosting foundation

**Delivers:** the Arcwell coach app opens in a browser at a real URL, signs in, and keeps the session across a refresh.
**Size:** 3 days (build 2 · hosting 1) · **Depends on:** nothing

## 1. WHY

### 1.1 The problem

Today Arcwell runs only as a phone app. Every later phase — the sidebar, the client table, check-in review, messaging, the plan builder — assumes the product can be opened in a browser and survive a page refresh. This phase delivers no visible feature; it delivers the foundation.

### 1.2 Who it's for

A coach at a desk with a browser open, and the product owner, who needs to review every later phase without installing anything.

### 1.3 Why it comes first

Without a hosted web build there is nothing to review, no way to demonstrate the product, and no path to the paid web tier.

### 1.4 What success looks like

A link that opens the coach experience, signs in, survives a refresh, and lands on the right screen when a specific address is pasted.

## 2. WHAT

### 2.1 The web build produces static files

- One command at the repository root produces the web bundle.
- The bundle needs no Node server to run — static files only.
- Why: static hosting is free and has no uptime risk. A server build adds cost and maintenance for no benefit now.

### 2.2 Every screen is reachable by address

- Any screen reachable inside the app is also reachable by typing its address and survives a hard refresh.
- Example: a client's profile at /coach/client/<id> opens that client.
- An unknown address shows a not-found screen, never a blank page.

### 2.3 Sign-in on the web

| Behaviour | Requirement |
|---|---|
| Email-code sign-in | completes entirely in the browser |
| Session persistence | survives a refresh and a new tab |
| Sign-out | clears the session and returns to sign-in |
| Signed-out access | any coach screen redirects to sign-in |
| Expired session | shows sign-in again, not an error screen |

The encrypted on-device store used by the phone does not exist in a browser. The browser uses its own storage for the session. Do not add a new storage library; use the browser path already present in the codebase.

### 2.4 Public configuration

- The app needs two public values: the backend URL and the public key.
- They are build-time public values, readable by every visitor — never secrets.
- A documented example file lists every required value with empty placeholders.
- No secret key, payment key or private credential may ever be placed in a public build value.

### 2.5 Local setup page

- Install dependencies for the app and the database.
- Start the local database; apply migrations; load demo data.
- Create the local configuration file from the example file.
- Start the web build and open the local address.
- List the demo accounts and what each can see.
- A person who has never opened the project must finish in under 15 minutes.

### 2.6 Hosting

| Requirement | Detail |
|---|---|
| Static hosting | the bundle is served as static files |
| HTTPS | valid certificate on the real domain |
| Deep links | direct addresses and refreshes resolve to the app |
| Environment | the two public values are configured for the hosted build |
| Preview | each proposed change can be reviewed at its own address |
| Domain | a product domain points at the host |

## 3. PROOF

- **AC1** — The hosted URL opens the coach experience over HTTPS *(open it)*
- **AC2** — Typing the sign-in address directly opens sign-in *(paste the address)*
- **AC3** — Signing in with an emailed code succeeds in the browser *(manual)*
- **AC4** — A refresh keeps the coach signed in *(reload)*
- **AC5** — Signing out returns to sign-in and coach screens then redirect *(manual)*
- **AC6** — A client address opens that client after a hard refresh *(paste the address)*
- **AC7** — An unknown address shows a not-found screen *(paste a fake address)*
- **AC8** — The local setup page works on a machine that never ran the project *(clean clone)*
- **AC9** — No secret appears in the web bundle or in public configuration *(inspect the bundle)*

## 4. WHERE

### 4.1 New files

| File | Purpose |
|---|---|
| app/public/_redirects | send unknown paths to the app entry so deep links work |
| README-WEB.md | the local setup page |

### 4.2 Files changed

| File | Change |
|---|---|
| app/app.json | web output mode changes from server to single (static single-page app) |
| app/package.json | a web export script |
| package.json | a root script forwarding to the app export |
| app/.env.example | confirm both public values are listed with empty placeholders |

### 4.3 Reuse, do not replace

- The existing auth flow and session handling — the web must use the same path, guarded for browsers.
- The existing backend client in app/src/lib/supabase.ts — it must read only the two public values.
- The existing storage module app/src/lib/localStore.ts — its browser branch, not the encrypted phone branch.

## 5. WHAT TO BUILD

### 5.1 Build

- [ ] A single root command produces the static web bundle.
- [ ] The bundle contains an entry page, a script bundle and assets.
- [ ] No Node server is required to serve it.
- [ ] The web export command is documented.

### 5.2 Routing

- [ ] Unknown paths resolve to the app entry instead of a 404.
- [ ] A client address opens that client after a hard refresh.
- [ ] An unknown address shows a not-found screen.

### 5.3 Authentication

- [ ] Sign-in by emailed code completes in the browser.
- [ ] The session survives a refresh and a new tab.
- [ ] Sign-out clears the session.
- [ ] Signed-out access to a coach screen redirects to sign-in.
- [ ] An expired session shows sign-in, not an error.

### 5.4 Configuration

- [ ] Both public values are read from build-time configuration.
- [ ] No secret value exists anywhere in the web bundle.
- [ ] The example configuration file documents every required value.

### 5.5 Delivery

- [ ] The hosted URL serves the app over HTTPS.
- [ ] A product domain points at the host.
- [ ] Each proposed change can be reviewed at its own address before release.

### 5.6 Documentation

- [ ] One setup page takes a stranger from clone to running app in under 15 minutes.
- [ ] It lists the demo accounts and what each can see.

