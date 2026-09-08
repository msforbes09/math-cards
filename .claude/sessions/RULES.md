# Working agreements (standing — apply every session)

The hard rules live in `CLAUDE.md` (never commit to `develop`/`main`, never merge
a PR, never commit a secret, the TDD Iron Law). These are the practices settled
on top of them.

## Branch & PR rhythm
- Feature branches `feature/<slug>` off freshly-fetched `origin/develop`.
- `git branch --show-current` before the first commit of every session.
- First push `git push -u origin <branch>`. Claude opens the PR, human merges.
- After a merge: delete the local + remote branch (and any worktree).
- Worktrees only for genuinely parallel work — otherwise plain branches.

## Verification baseline
- `npm test` · `npx tsc --noEmit` · `npm run lint` — all three, output read,
  before any claim that something passes or is done.
- TDD every change: Red (fails for the right reason) → Green → Blue.
- A known-failing test is recorded here with its reason, or it gets fixed. There
  is no third option.

## Public repo
- `msforbes09/math-cards` is public. No secrets, no real student data, no
  `.env` — ever. `.env.example` is the tracked template.

## Milestones
- **M1** — multiplication flash card drill, client-only, browser-stored history.
  Spec: `docs/superpowers/specs/2026-09-08-arithmetic-drill-m1-design.md`.
- Deferred by decision, not oversight: named students and server-stored
  progress, teacher/class/reporting roles, the other operations and cards,
  adaptive weak-fact selection, a timed beat-the-clock mode. The backend stack
  (Laravel vs Hono) is chosen when M2 starts, not before.

## Design language
- Audience is elementary students, often on tablets. Big touch targets, high
  contrast, generous type, no dense chrome.
- Ask for 3 theme colors before any UI work begins.

## Dev server & browser
- Never trigger recompiles or reloads on the user's running `next dev`. Edits
  are fine; the user reloads and confirms visuals.
- Browser automation is localhost-only.

## Session hygiene
- Session start: read `CLAUDE.md`, this file, and the newest dated file here.
- Session end (user says "clear"/"store"): write/update `YYYY-MM-DD.md` here —
  minimal. Branch/PR state, what shipped as one-liners, pending work with enough
  detail to resume cold.
