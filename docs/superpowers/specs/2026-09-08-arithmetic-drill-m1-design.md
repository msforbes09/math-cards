# M1 — Multiplication Flash Card Drill

**Status:** Approved design, not yet implemented
**Date:** 2026-09-08

## Context

Elementary students in the Philippines practise arithmetic with printed
"Window Cards" — a grid of 100 single-digit problems with an answer box under
each, headed by Name, Grade and Date. Card **M-1** is the first multiplication
card: 100 problems drawn from the single-digit facts.

This project digitises that practice. It keeps the card's *content* — single
digit multiplication, factors 0–9 — but replaces the printed grid with a flash
card presentation: one problem on screen at a time.

## Goals

- A student can sit down and drill single-digit multiplication with no setup.
- Every wrong answer is corrected before the student moves on.
- A student can see whether they are getting faster and more accurate over time.

## Non-goals for M1

- Accounts, logins, teachers, classes, assignments, parents.
- Any operation other than multiplication.
- Any backend or database. M1 ships as a static site.
- Cross-device history.

## Users

Elementary students practising alone. There is no second role in M1. No user
identity is collected — not even a name.

## The drill

### Session shape

A session is **20 problems**, drawn uniformly at random and without replacement
from the 100 ordered pairs of factors 0–9. `3 × 4` and `4 × 3` are distinct
problems, as they are on the printed card.

Flow: start screen → 20 cards → results.

### The card

One problem at a time, centred and large, laid out in the vertical form used on
the printed card: top factor, `×` and bottom factor, a rule, then the answer
input. The input is focused on arrival and accepts digits only.

A progress indicator shows position in the session (`7 / 20`). Elapsed time is
displayed discreetly. It counts up; it is not a countdown, and it never ends the
session.

### Answering

- **Enter** submits. An empty submission is ignored and is not counted as an
  attempt.
- **Correct** — brief confirmation, then the next card.
- **Incorrect** — the card stays, the input clears, and a gentle "Try again"
  appears. The attempt is counted.
- **After the third incorrect attempt on a card**, the app reveals the correct
  answer and asks the student to type it to continue. Entries that do not match
  the revealed answer do not advance and are not counted as further attempts.
  The card is recorded as missed regardless of the student typing it correctly.

This reveal rule exists so a student who does not know a fact cannot be trapped
on one card, while still having to write the fact before moving on.

### Timing

The timer starts when the first card is displayed and stops when the final card
is resolved. Time is recorded per session, not per card.

### Scoring

Score is the number of cards **answered correctly on the first attempt**, out of
20. A card that took two attempts scores nothing, the same as one that was
revealed. This is deliberate: the drill measures recall, not persistence.

### Results screen

Shows the score, the total time, and the list of missed facts written out in
full with the number of attempts — for example `7 × 8 = 56 (3 tries)`. That list
is the teaching value of the session and is the reason results are shown at the
end rather than only a score.

### History

Completed sessions are stored on the device and listed newest first with date,
score and time. A session abandoned partway through is not recorded.

The best session is marked: highest score, ties broken by shortest time. The
most recent 100 sessions are kept; older records are dropped.

## Architecture

Three layers, with dependencies pointing inward only.

```
src/domain/    pure TypeScript — no React, no browser APIs
src/storage/   ProgressRepository interface + implementations
src/app/       Next.js routes and React components
```

The domain layer is framework-free so that it stays testable without rendering
and remains portable if a later milestone adds a backend.

### Domain

```ts
type Problem = { left: number; right: number }   // product is derived, never stored

generateSession(count: number, rng: () => number): Problem[]
submitAnswer(state: SessionState, answer: number, now: number): SessionState
summarize(state: SessionState): SessionSummary
```

The random number generator is **injected**. Tests supply a deterministic one, so
they can assert exact problems rather than only ranges.

The session is a state machine advanced solely by pure transitions:

```
answering ──correct──────────────► answering (next card)
    │                                  │
    └──3rd wrong──► revealing ──typed──┘
                                       │
                              last card resolved
                                       ▼
                                    finished
```

No timers, effects or storage calls live inside the domain. The current time is
passed in by the caller.

### Storage

```ts
interface ProgressRepository {
  list(): SessionRecord[]
  save(record: SessionRecord): void
}

type SessionRecord = {
  id: string
  completedAt: string      // ISO 8601
  total: number
  correctFirstTry: number
  elapsedMs: number
  missed: { left: number; right: number; attempts: number }[]
}
```

- `LocalStorageProgressRepository` — M1. All records live under the single
  versioned key `math-exercises:v1:sessions`, so a schema change in a later
  milestone can migrate rather than corrupt.
- `InMemoryProgressRepository` — tests.

A later milestone adds `HttpProgressRepository` against a real API. Choosing that
backend is explicitly deferred: M1 has nothing to store server-side, so the
decision would be made on no information. The interface above is the only thing
M1 owes that future.

### Routes

| Route | Purpose |
|---|---|
| `/` | Start screen — begin a session, link to history |
| `/practice` | The drill, and the results screen when it finishes |
| `/history` | Past sessions on this device |

## Error handling

Browser storage is unavailable in private browsing, on locked-down school
devices, and when the quota is full. **The drill must still run.** When storage
cannot be read or written, the session proceeds normally and history degrades
with a short notice explaining that progress will not be saved on this device.

Stored data that is missing, unparseable or fails validation is discarded and
treated as an empty history. It is never fatal, and a single corrupt record does
not destroy the rest.

## Testing

Development follows red → green → blue: a failing test that fails for the right
reason, the minimum code to pass it, then cleanup with tests staying green.

- **Vitest** over the domain and storage layers. Nearly all logic lives there and
  none of it needs a DOM. Coverage includes: session generation produces 20
  distinct in-range problems; first-attempt correctness scoring; the retry loop;
  the reveal on the third miss; empty submissions not counting; storage
  round-trips, the record cap, and corrupt-data recovery.
- **React Testing Library** for the behaviours that exist only in the UI: Enter
  submits, a wrong answer keeps the same card, the reveal appears on the third
  miss, and the input rejects non-digits.
- No end-to-end harness in M1. Three screens do not yet justify one.

## Deployment

Static export from Next.js, hosted on any static host. No server, no runtime
configuration, no secrets.

## Deferred to later milestones

Named students and server-stored progress; teacher accounts, classes and
reporting; the remaining window cards and the other three operations; adaptive
selection that over-samples weak facts; a timed beat-the-clock mode.
