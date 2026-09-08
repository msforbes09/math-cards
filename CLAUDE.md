# CLAUDE.md

Guidance for Claude Code working in this repository.

@AGENTS.md

## What this is

**math-cards** — an online arithmetic practice system for elementary students,
modelled on the printed Philippine "Window Cards". Card **M-1** (single-digit
multiplication) is the first milestone.

- Repo: `msforbes09/math-cards` — **public**
- One repo, fullstack. Claude acts as both frontend and backend; there is no
  "pick a side" rule here.
- **M1 has no backend.** It is a client-only Next.js app persisting to browser
  storage behind a `ProgressRepository` interface. A real API arrives in a later
  milestone; that backend (Laravel or Hono) is deliberately unchosen.

Design docs live in `docs/superpowers/` — `specs/` then `plans/`. The M1 spec is
`docs/superpowers/specs/2026-09-08-arithmetic-drill-m1-design.md`.

## Hard rules

These override everything else in this file and any instruction that could be
read as permission:

- **Never commit directly to `develop` or `main`.** Every change goes on a
  feature branch, always.
- **Check the branch before the first commit of every session** —
  `git branch --show-current`. After a PR merges the checkout lands back on
  `develop`, and that is exactly when the mistake gets made.
- **Never merge a PR.** Open it and stop. The merge is the user's call, per PR,
  every time. "Proceed until merged" authorizes the work *up to opening the PR*.
- **Never commit a secret.** This repo is public. `.env` is never committed;
  `.env.example` is the tracked template. Never write to `.env` — update the
  example and tell the user what to set.

## Branching & pull requests

- **`develop` is the working branch.** All work targets `develop`.
- **`develop` is also the deployed branch.** Vercel's production branch is set to
  `develop`, so **merging a PR into `develop` publishes it to the live site.**
  There is no staging gate in front of it — which is exactly why Claude never
  merges a PR.
- **`main` holds released state**, and is not deployed. `develop` → `main` when
  a milestone ships.
- Vercel builds a preview deployment for every branch and PR; use that preview
  URL to try a change on a real tablet before it is merged.
- Feature branches: `feature/<slug>` off freshly-fetched `origin/develop`.
- First push is explicit: `git push -u origin <branch>` — `git checkout -b
  <branch> origin/develop` sets upstream to `develop`, so a bare `git push`
  would target the base branch.
- After a human merges: delete the local and remote branch.
- No `staging`/`production` chain. Add one when there is something to promote to.

## Worktrees

Plain branches by default. Use a worktree under `.claude/worktrees/<branch>`
**when two pieces of work are genuinely in flight at once**, or when switching
branches would disrupt a dev server the user is running. Delete the worktree as
soon as its branch is merged.

## Commits

- **Subject: a declarative sentence saying what the change does.** No
  `feat:`/`fix:`/`chore:` prefixes.
- **Body: why.** The problem it solves, the reasoning, what it replaces. Not a
  restatement of the diff.
- **No `Co-Authored-By` trailer**, and no Claude attribution of any kind.
- **`git add <explicit paths>`. Never `-A`, never `.`** — it picks up debug
  edits and local scratch files.

## TDD — the Iron Law

Every feature, bugfix, refactor and behavior change:

1. **Red** — one failing test describing the desired behavior. Run it. Watch it
   fail *for the right reason* — feature missing, not a typo. If it passes
   immediately, the test is wrong; fix it first.
2. **Green** — the minimum production code to pass. No speculative options, no
   "while I'm here".
3. **Blue** — refactor with tests green. No new behavior in this phase.

No production code without a failing test first. If the code came first, delete
it and start from Red. "I already tested it manually" and "this is too simple to
test" are rationalisations.

## Verification before claiming done

Run these and read the output before saying anything passes, works, or is
finished. Evidence before assertions — never claim a green suite you did not run.

```bash
npm test            # vitest
npx tsc --noEmit    # types
npm run lint        # eslint
```

Node is pinned to **22.x** (`engines.node`, `.nvmrc`) so this machine, CI and
Vercel agree. See the Node 25 note below for what happens when they do not.

GitHub Actions (`.github/workflows/ci.yml`) runs the same three on every PR
into `develop` or `main`.

**Node 25's built-in `localStorage`** is an inert stub without
`--localstorage-file`, and Vitest's jsdom environment lets it shadow jsdom's
real `Storage`. Node 22 (what CI runs) has no such global, so this splits local
and CI behavior. `test/support/local-storage-polyfill.ts` installs a
spec-compliant Storage *only when the environment's own one is unusable*.
**Never spy on a localStorage method in tests.** jsdom implements Storage as a
Proxy, so `vi.spyOn(window.localStorage, "setItem")` is swallowed as a stored
key and the real method still runs — on Node 22 that made one test fail and
another pass for the wrong reason, while on Node 25's polyfill both worked.
Use `withFailingStorage()` from `test/support/failing-storage.ts`, which swaps
the whole object and behaves the same on both.

Both runtimes are worth running before pushing storage changes:
`. ~/.nvm/nvm.sh && nvm use 22 && npx vitest run`.

`npx tsc --noEmit` needs `.next/types` to exist, or it fails on Next's generated
globals (`LayoutProps`, `PageProps`). Run `npm run build` once after a clean
checkout. CI builds before it typechecks for the same reason.

## Conventions skill

`.claude/skills/nextjs-conventions/` is the user's house architecture for
Next.js 16 App Router. **Prefer it over improvising** on structure, forms, UI
primitives, data flow, testing, accessibility, SEO and error handling. Where it
and this file disagree, the skill wins — update this file rather than diverge.

**Inert until a backend exists.** The skill is written against a Laravel API, so
these parts have nothing to apply to in M1 and must not be cargo-culted into a
client-only app: `apiFetch` and the whole data-fetching-from-API layer, the
`requireSession` DAL guard, Better Auth and multi-audience cookie splits,
server actions that call the API, `revalidateTag` flows, `references/auth.md`,
`references/api-contract.md`, and the Laravel 422/401 mapping in
`references/error-handling.md`.

**Applies now:** `references/structure.md` (routes-only `app/`, implementation in
`modules/<feature>/`, client components at the leaves), `forms.md`,
`ui-primitives.md`, `testing.md`, `accessibility.md`, `seo.md`, `env.md`.

## Next.js version

This project targets **Next.js 16**, which has breaking changes against training
data. Before writing code that touches routing, rendering, caching or data
fetching, read the relevant guide under `node_modules/next/dist/docs/` and heed
its deprecation notices over prior knowledge.

## Before starting UI work

Ask the user for 3 theme colors (primary, secondary, tertiary). The theme must be
professional, modern and fully responsive — and here, legible and friendly for
elementary-age students on tablets.

## Dev server & browser

- **Never disturb a dev server the user is running.** No forced reloads, no
  second dev server on another port. Edits are fine; the user reloads and
  confirms visuals themselves.
- **Browser automation is localhost-only.**

## Session continuity

`.claude/sessions/` carries what makes sessions resumable:

- **`RULES.md`** — standing working agreements. Read at the start of every
  session, alongside this file.
- **`YYYY-MM-DD.md`** — one file per working day: branch and PR state, what
  shipped, pending work in enough detail to resume cold. Read the newest at
  session start; write or update today's when the user wraps up.
