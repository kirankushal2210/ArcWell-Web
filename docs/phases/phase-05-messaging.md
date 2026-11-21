# Phase 5 — Messaging

**Delivers:** a two-pane inbox that replaces WhatsApp for active clients: threads, photos, files and voice notes.
**Size:** 5 days · **Depends on:** Phase 3

## 1. WHY

### 1.1 The problem

Coaches run their day in WhatsApp: plans, photos, voice notes, questions. Nothing is searchable, nothing is tied to the client record, and context is lost between clients.

### 1.2 Who it's for

The coach replying between sessions, and the client receiving a reply in their phone app.

### 1.3 Why now

Messaging already exists in the product; the web needs a desktop-shaped version before the web tier is worth paying for.

### 1.4 What success looks like

The coach answers five clients without leaving one screen, with the client's context beside the conversation.

## 2. WHAT

### 2.1 Layout

| Pane | Contents |
|---|---|
| Left (280 px) | thread list: avatar, name, last message, time, unread badge |
| Centre (flex) | conversation: messages, composer, attachments |
| Right (300 px, collapsible) | client context: goal, adherence, last check-in, quick actions |

### 2.2 Composer

- Text with send on Enter, newline on Shift+Enter.
- Attach a photo, a PDF or a voice note.
- Voice notes record in the browser and play inline with a duration.

### 2.3 Behaviour

- Unread counts match the sidebar badge.
- Switching threads keeps scroll position per thread.
- Search across messages, clients and files.
- Messages are marked read when visible.

### 2.4 Broadcast

Send one message to a filtered group; each client receives it as a private message, never as a group thread.

### 2.5 States

| State | Requirement |
|---|---|
| Empty | “no conversations yet” with how clients reach them |
| Loading | skeleton of the thread list |
| Send failure | message stays, marked failed, with retry |
| Offline | composer disabled with an explanation |

## 3. PROOF

- **AC1** — Switching threads takes under 150 ms *(click five threads)*
- **AC2** — Unread badges match the sidebar *(compare)*
- **AC3** — Photo, PDF and voice note send and render *(send each)*
- **AC4** — Voice notes record in the browser *(record and play)*
- **AC5** — Search finds a message by text *(search)*
- **AC6** — Broadcast reaches only the filtered clients *(send to a filter)*
- **AC7** — Failed send offers retry *(simulate offline)*

## 4. WHERE

### 4.1 New files

| File | Purpose |
|---|---|
| app/src/features/coach/InboxWide.tsx | three-pane inbox |
| app/src/features/coach/useThreadSearch.ts | message search helpers, tested |

### 4.2 Files changed

| File | Change |
|---|---|
| app/src/app/coach/(tabs)/messages.tsx | wide: the inbox; narrow: unchanged |
| app/src/app/coach/chat/[id].tsx | reuse the conversation view inside the centre pane |
| app/src/app/coach/broadcast.tsx | reuse broadcast; add media if the data model allows |

### 4.3 Rules

- Reuse the existing message model and upload paths; no parallel system.
- Browser voice notes use the browser recorder already handled in the codebase.
- No group threads: broadcast sends private messages.

## 5. WHAT TO BUILD

### 5.1 Inbox

- [ ] Three panes with the specified widths.
- [ ] Thread list shows unread badges and times.
- [ ] Right context pane is collapsible.

### 5.2 Conversation

- [ ] Messages render with sender, time and read state.
- [ ] Scroll position is kept per thread.
- [ ] Enter sends, Shift+Enter adds a line.

### 5.3 Attachments

- [ ] Photo, PDF and voice note can be sent and replayed.
- [ ] Uploads show progress and fail cleanly.

### 5.4 Search and broadcast

- [ ] Search finds messages by text.
- [ ] Broadcast sends private copies to a filtered group.

### 5.5 States

- [ ] Empty, loading, failed-send and offline states render.

