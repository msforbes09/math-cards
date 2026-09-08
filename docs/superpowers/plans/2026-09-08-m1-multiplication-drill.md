# M1 Multiplication Flash Card Drill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A student can open the app, drill 20 single-digit multiplication flash cards, and see their score, time and missed facts — with history kept on the device.

**Architecture:** Three layers, dependencies pointing inward. `src/domain/` is pure TypeScript with an injected RNG and an injected clock — no React, no browser APIs — and holds all drill logic as a state machine advanced by pure transitions. `src/storage/` hides persistence behind `ProgressRepository`. `src/app/` and `src/modules/drill/` render state and dispatch transitions.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4, Vitest + React Testing Library, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-08-arithmetic-drill-m1-design.md`

## Global Constraints

- Session length is **20 problems**; factors are **0–9 inclusive**, both operands.
- Problems are ordered pairs — `3 × 4` and `4 × 3` are distinct.
- Problems within one session are **distinct** (drawn without replacement).
- Score counts cards **correct on the first attempt only**.
- The reveal triggers **after the third incorrect attempt** on a card.
- Empty submissions are **ignored** — not counted as an attempt.
- Storage key is `math-exercises:v1:sessions`; history is capped at the **most recent 100** records.
- Theme colors are **not yet chosen** — build neutral (Tailwind default greys), no brand palette. Design is a later pass.
- `app/` is routes-only; implementation lives in `src/modules/<feature>/` per `.claude/skills/nextjs-conventions/references/structure.md`.
- No `Co-Authored-By` trailer on any commit.

---

### Task 1: Scaffold, test harness, CI

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`, `app/layout.tsx`, `app/globals.css`, `.github/workflows/ci.yml`, `.env.example`
- Test: `src/domain/smoke.test.ts` (deleted in Task 2 once real tests exist)

**Interfaces:**
- Consumes: nothing
- Produces: working `npm test`, `npx tsc --noEmit`, `npm run lint`

- [ ] **Step 1: Scaffold**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --no-turbopack --use-npm
```

- [ ] **Step 2: Add test deps**

```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 3: `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"], globals: true },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

`vitest.setup.ts`: `import "@testing-library/jest-dom/vitest";`

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: Smoke test, run it, watch it pass**

```ts
// src/domain/smoke.test.ts
import { describe, it, expect } from "vitest";
describe("harness", () => { it("runs", () => { expect(1 + 1).toBe(2); }); });
```

Run: `npm test` → PASS. Then `npx tsc --noEmit` and `npm run lint` → clean.

- [ ] **Step 5: CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [develop, main]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm test
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts eslint.config.mjs vitest.config.ts vitest.setup.ts app .github .env.example src
git commit -m "Scaffold the Next.js app with a test harness that CI can run"
```

---

### Task 2: Problem generation

**Files:**
- Create: `src/domain/problem.ts`, `src/domain/problem.test.ts`
- Delete: `src/domain/smoke.test.ts`

**Interfaces:**
- Produces:
  - `type Problem = { left: number; right: number }`
  - `productOf(problem: Problem): number`
  - `formatProblem(problem: Problem): string` → `"7 × 8"`
  - `generateSession(count: number, rng: () => number): Problem[]`
  - `ALL_PROBLEMS: Problem[]` (100 ordered pairs, 0–9)

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { generateSession, productOf, formatProblem, ALL_PROBLEMS } from "./problem";

const seeded = (values: number[]) => { let i = 0; return () => values[i++ % values.length]; };

describe("ALL_PROBLEMS", () => {
  it("is the 100 ordered pairs of 0-9", () => {
    expect(ALL_PROBLEMS).toHaveLength(100);
    expect(ALL_PROBLEMS).toContainEqual({ left: 3, right: 4 });
    expect(ALL_PROBLEMS).toContainEqual({ left: 4, right: 3 });
  });
});

describe("productOf / formatProblem", () => {
  it("multiplies", () => { expect(productOf({ left: 7, right: 8 })).toBe(56); });
  it("formats with a multiplication sign", () => {
    expect(formatProblem({ left: 7, right: 8 })).toBe("7 × 8");
  });
});

describe("generateSession", () => {
  it("returns the requested count", () => {
    expect(generateSession(20, Math.random)).toHaveLength(20);
  });

  it("never repeats a problem within a session", () => {
    const keys = generateSession(20, Math.random).map((p) => `${p.left}x${p.right}`);
    expect(new Set(keys).size).toBe(20);
  });

  it("only uses factors 0-9", () => {
    for (const p of generateSession(20, Math.random)) {
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.left).toBeLessThanOrEqual(9);
      expect(p.right).toBeGreaterThanOrEqual(0);
      expect(p.right).toBeLessThanOrEqual(9);
    }
  });

  it("is deterministic for a given rng", () => {
    const a = generateSession(5, seeded([0.1, 0.9, 0.3, 0.7, 0.5]));
    const b = generateSession(5, seeded([0.1, 0.9, 0.3, 0.7, 0.5]));
    expect(a).toEqual(b);
  });

  it("rejects a count larger than the pool", () => {
    expect(() => generateSession(101, Math.random)).toThrow();
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`Cannot find module './problem'`)

Run: `npm test -- problem`

- [ ] **Step 3: Minimal implementation**

```ts
export type Problem = { left: number; right: number };

export const FACTORS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const ALL_PROBLEMS: Problem[] = FACTORS.flatMap((left) =>
  FACTORS.map((right) => ({ left, right })),
);

export function productOf({ left, right }: Problem): number {
  return left * right;
}

export function formatProblem({ left, right }: Problem): string {
  return `${left} × ${right}`;
}

export function generateSession(count: number, rng: () => number): Problem[] {
  if (count > ALL_PROBLEMS.length) {
    throw new Error(`Cannot draw ${count} distinct problems from ${ALL_PROBLEMS.length}`);
  }
  const pool = [...ALL_PROBLEMS];
  const drawn: Problem[] = [];
  while (drawn.length < count) {
    const index = Math.floor(rng() * pool.length) % pool.length;
    drawn.push(pool.splice(index, 1)[0]);
  }
  return drawn;
}
```

- [ ] **Step 4: Run — expect PASS.** Delete `src/domain/smoke.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/domain/problem.ts src/domain/problem.test.ts
git rm src/domain/smoke.test.ts
git commit -m "Draw a session's problems without replacement from the 100 facts"
```

---

### Task 3: The session state machine

**Files:**
- Create: `src/domain/session.ts`, `src/domain/session.test.ts`

**Interfaces:**
- Consumes: `Problem`, `productOf`, `generateSession` from Task 2
- Produces:
  - `const SESSION_LENGTH = 20`, `const MAX_ATTEMPTS = 3`
  - `type CardState = { problem: Problem; attempts: number; revealed: boolean }`
  - `type SessionStatus = "answering" | "revealing" | "finished"`
  - `type SessionState = { cards: CardState[]; index: number; status: SessionStatus; startedAt: number; finishedAt: number | null }`
  - `startSession(problems: Problem[], now: number): SessionState`
  - `submitAnswer(state: SessionState, raw: string, now: number): SessionState`
  - `currentCard(state: SessionState): CardState | null`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { startSession, submitAnswer, currentCard, MAX_ATTEMPTS } from "./session";
import type { Problem } from "./problem";

const problems: Problem[] = [
  { left: 7, right: 8 }, // 56
  { left: 2, right: 3 }, // 6
];
const start = () => startSession(problems, 1000);

describe("startSession", () => {
  it("begins answering the first card with no attempts", () => {
    const s = start();
    expect(s.status).toBe("answering");
    expect(s.index).toBe(0);
    expect(currentCard(s)?.problem).toEqual({ left: 7, right: 8 });
    expect(currentCard(s)?.attempts).toBe(0);
    expect(s.startedAt).toBe(1000);
    expect(s.finishedAt).toBeNull();
  });
});

describe("submitAnswer", () => {
  it("advances on a correct answer", () => {
    const s = submitAnswer(start(), "56", 2000);
    expect(s.index).toBe(1);
    expect(s.cards[0].attempts).toBe(1);
    expect(s.status).toBe("answering");
  });

  it("stays on the card and counts the attempt when wrong", () => {
    const s = submitAnswer(start(), "54", 2000);
    expect(s.index).toBe(0);
    expect(s.cards[0].attempts).toBe(1);
    expect(s.status).toBe("answering");
  });

  it("ignores an empty submission entirely", () => {
    const s = submitAnswer(start(), "   ", 2000);
    expect(s.cards[0].attempts).toBe(0);
    expect(s.status).toBe("answering");
  });

  it("reveals after the third wrong attempt", () => {
    let s = start();
    for (let i = 0; i < MAX_ATTEMPTS; i++) s = submitAnswer(s, "0", 2000);
    expect(s.status).toBe("revealing");
    expect(s.cards[0].revealed).toBe(true);
    expect(s.index).toBe(0);
  });

  it("while revealing, only the correct answer advances", () => {
    let s = start();
    for (let i = 0; i < MAX_ATTEMPTS; i++) s = submitAnswer(s, "0", 2000);
    s = submitAnswer(s, "12", 3000);
    expect(s.index).toBe(0);
    expect(s.cards[0].attempts).toBe(MAX_ATTEMPTS); // no further attempts counted
    s = submitAnswer(s, "56", 4000);
    expect(s.index).toBe(1);
    expect(s.status).toBe("answering");
  });

  it("finishes after the last card and stamps the time", () => {
    let s = submitAnswer(start(), "56", 2000);
    s = submitAnswer(s, "6", 5000);
    expect(s.status).toBe("finished");
    expect(s.finishedAt).toBe(5000);
    expect(currentCard(s)).toBeNull();
  });

  it("is a no-op once finished", () => {
    let s = submitAnswer(start(), "56", 2000);
    s = submitAnswer(s, "6", 5000);
    expect(submitAnswer(s, "1", 6000)).toEqual(s);
  });

  it("does not mutate the state it is given", () => {
    const before = start();
    submitAnswer(before, "56", 2000);
    expect(before.index).toBe(0);
    expect(before.cards[0].attempts).toBe(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.** `npm test -- session`

- [ ] **Step 3: Minimal implementation**

```ts
import { productOf, type Problem } from "./problem";

export const SESSION_LENGTH = 20;
export const MAX_ATTEMPTS = 3;

export type CardState = { problem: Problem; attempts: number; revealed: boolean };
export type SessionStatus = "answering" | "revealing" | "finished";
export type SessionState = {
  cards: CardState[];
  index: number;
  status: SessionStatus;
  startedAt: number;
  finishedAt: number | null;
};

export function startSession(problems: Problem[], now: number): SessionState {
  return {
    cards: problems.map((problem) => ({ problem, attempts: 0, revealed: false })),
    index: 0,
    status: "answering",
    startedAt: now,
    finishedAt: null,
  };
}

export function currentCard(state: SessionState): CardState | null {
  return state.status === "finished" ? null : (state.cards[state.index] ?? null);
}

export function submitAnswer(state: SessionState, raw: string, now: number): SessionState {
  if (state.status === "finished") return state;

  const trimmed = raw.trim();
  if (trimmed === "") return state;

  const answer = Number(trimmed);
  const card = state.cards[state.index];
  const correct = Number.isFinite(answer) && answer === productOf(card.problem);

  if (state.status === "revealing") {
    return correct ? advance(state, now) : state;
  }

  const attempts = card.attempts + 1;
  const cards = replaceCard(state.cards, state.index, { ...card, attempts });

  if (correct) return advance({ ...state, cards }, now);
  if (attempts >= MAX_ATTEMPTS) {
    return {
      ...state,
      cards: replaceCard(cards, state.index, { ...card, attempts, revealed: true }),
      status: "revealing",
    };
  }
  return { ...state, cards };
}

function replaceCard(cards: CardState[], index: number, card: CardState): CardState[] {
  return cards.map((existing, i) => (i === index ? card : existing));
}

function advance(state: SessionState, now: number): SessionState {
  const next = state.index + 1;
  return next >= state.cards.length
    ? { ...state, index: next, status: "finished", finishedAt: now }
    : { ...state, index: next, status: "answering" };
}
```

- [ ] **Step 4: Run — expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add src/domain/session.ts src/domain/session.test.ts
git commit -m "Drive the drill with pure transitions over an explicit state machine"
```

---

### Task 4: Scoring

**Files:**
- Create: `src/domain/summary.ts`, `src/domain/summary.test.ts`

**Interfaces:**
- Consumes: `SessionState`, `CardState`, `MAX_ATTEMPTS` from Task 3
- Produces:
  - `type MissedFact = { left: number; right: number; attempts: number }`
  - `type SessionSummary = { total: number; correctFirstTry: number; elapsedMs: number; missed: MissedFact[] }`
  - `summarize(state: SessionState): SessionSummary`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { summarize } from "./summary";
import { startSession, submitAnswer } from "./session";
import type { Problem } from "./problem";

const problems: Problem[] = [{ left: 7, right: 8 }, { left: 2, right: 3 }];

describe("summarize", () => {
  it("counts only first-attempt correctness", () => {
    let s = startSession(problems, 0);
    s = submitAnswer(s, "56", 1000);   // first try
    s = submitAnswer(s, "5", 2000);    // wrong
    s = submitAnswer(s, "6", 3000);    // right, second try
    const summary = summarize(s);
    expect(summary.total).toBe(2);
    expect(summary.correctFirstTry).toBe(1);
  });

  it("reports elapsed time between start and finish", () => {
    let s = startSession(problems, 1000);
    s = submitAnswer(s, "56", 2000);
    s = submitAnswer(s, "6", 6000);
    expect(summarize(s).elapsedMs).toBe(5000);
  });

  it("lists missed facts with their attempt counts", () => {
    let s = startSession(problems, 0);
    s = submitAnswer(s, "0", 100);
    s = submitAnswer(s, "56", 200);
    s = submitAnswer(s, "6", 300);
    expect(summarize(s).missed).toEqual([{ left: 7, right: 8, attempts: 2 }]);
  });

  it("counts a revealed card as missed", () => {
    let s = startSession(problems, 0);
    for (let i = 0; i < 3; i++) s = submitAnswer(s, "0", 100);
    s = submitAnswer(s, "56", 200);
    s = submitAnswer(s, "6", 300);
    const summary = summarize(s);
    expect(summary.correctFirstTry).toBe(1);
    expect(summary.missed[0]).toEqual({ left: 7, right: 8, attempts: 3 });
  });

  it("reports zero elapsed time for an unfinished session", () => {
    expect(summarize(startSession(problems, 1000)).elapsedMs).toBe(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.** `npm test -- summary`

- [ ] **Step 3: Minimal implementation**

```ts
import type { SessionState } from "./session";

export type MissedFact = { left: number; right: number; attempts: number };
export type SessionSummary = {
  total: number;
  correctFirstTry: number;
  elapsedMs: number;
  missed: MissedFact[];
};

export function summarize(state: SessionState): SessionSummary {
  const answered = state.cards.filter((card) => card.attempts > 0);
  return {
    total: state.cards.length,
    correctFirstTry: answered.filter((c) => c.attempts === 1 && !c.revealed).length,
    elapsedMs: state.finishedAt === null ? 0 : state.finishedAt - state.startedAt,
    missed: answered
      .filter((c) => c.attempts > 1 || c.revealed)
      .map((c) => ({ left: c.problem.left, right: c.problem.right, attempts: c.attempts })),
  };
}
```

- [ ] **Step 4: Run — expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add src/domain/summary.ts src/domain/summary.test.ts
git commit -m "Score recall, not persistence: only first-attempt answers count"
```

---

### Task 5: Progress storage

**Files:**
- Create: `src/storage/progress-repository.ts`, `src/storage/local-storage-progress-repository.ts`, `src/storage/in-memory-progress-repository.ts`, `src/storage/local-storage-progress-repository.test.ts`

**Interfaces:**
- Consumes: `MissedFact` from Task 4
- Produces:
  - `type SessionRecord = { id: string; completedAt: string; total: number; correctFirstTry: number; elapsedMs: number; missed: MissedFact[] }`
  - `interface ProgressRepository { list(): SessionRecord[]; save(record: SessionRecord): void }`
  - `const STORAGE_KEY = "math-exercises:v1:sessions"`, `const MAX_RECORDS = 100`
  - `class LocalStorageProgressRepository implements ProgressRepository`
  - `class InMemoryProgressRepository implements ProgressRepository`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalStorageProgressRepository, STORAGE_KEY, MAX_RECORDS } from "./local-storage-progress-repository";
import type { SessionRecord } from "./progress-repository";

const record = (id: string, correctFirstTry = 20): SessionRecord => ({
  id, completedAt: "2026-09-08T00:00:00.000Z", total: 20, correctFirstTry, elapsedMs: 1000, missed: [],
});

describe("LocalStorageProgressRepository", () => {
  beforeEach(() => localStorage.clear());

  it("returns an empty list when nothing is stored", () => {
    expect(new LocalStorageProgressRepository().list()).toEqual([]);
  });

  it("round-trips a saved record", () => {
    const repo = new LocalStorageProgressRepository();
    repo.save(record("a"));
    expect(new LocalStorageProgressRepository().list()).toEqual([record("a")]);
  });

  it("lists newest first", () => {
    const repo = new LocalStorageProgressRepository();
    repo.save(record("a"));
    repo.save(record("b"));
    expect(repo.list().map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("keeps only the most recent MAX_RECORDS", () => {
    const repo = new LocalStorageProgressRepository();
    for (let i = 0; i < MAX_RECORDS + 5; i++) repo.save(record(`r${i}`));
    const listed = repo.list();
    expect(listed).toHaveLength(MAX_RECORDS);
    expect(listed[0].id).toBe(`r${MAX_RECORDS + 4}`);
  });

  it("treats unparseable data as empty rather than throwing", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(new LocalStorageProgressRepository().list()).toEqual([]);
  });

  it("drops individual malformed records but keeps valid ones", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([record("good"), { id: 5 }, null]));
    expect(new LocalStorageProgressRepository().list()).toEqual([record("good")]);
  });

  it("survives a storage that throws on write", () => {
    const repo = new LocalStorageProgressRepository();
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => repo.save(record("a"))).not.toThrow();
    setItem.mockRestore();
  });

  it("reports whether storage is available", () => {
    expect(new LocalStorageProgressRepository().isAvailable()).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.** `npm test -- local-storage`

- [ ] **Step 3: Minimal implementation**

`progress-repository.ts`:

```ts
import type { MissedFact } from "@/src/domain/summary";

export type SessionRecord = {
  id: string;
  completedAt: string;
  total: number;
  correctFirstTry: number;
  elapsedMs: number;
  missed: MissedFact[];
};

export interface ProgressRepository {
  list(): SessionRecord[];
  save(record: SessionRecord): void;
  isAvailable(): boolean;
}

export function isSessionRecord(value: unknown): value is SessionRecord {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.completedAt === "string" &&
    typeof r.total === "number" &&
    typeof r.correctFirstTry === "number" &&
    typeof r.elapsedMs === "number" &&
    Array.isArray(r.missed)
  );
}
```

`local-storage-progress-repository.ts`:

```ts
import { isSessionRecord, type ProgressRepository, type SessionRecord } from "./progress-repository";

export const STORAGE_KEY = "math-exercises:v1:sessions";
export const MAX_RECORDS = 100;

export class LocalStorageProgressRepository implements ProgressRepository {
  isAvailable(): boolean {
    try {
      const probe = `${STORAGE_KEY}:probe`;
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }

  list(): SessionRecord[] {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isSessionRecord);
    } catch {
      return [];
    }
  }

  save(record: SessionRecord): void {
    try {
      const next = [record, ...this.list()].slice(0, MAX_RECORDS);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable or full: the drill still works, history does not persist.
    }
  }
}
```

`in-memory-progress-repository.ts`:

```ts
import type { ProgressRepository, SessionRecord } from "./progress-repository";

export class InMemoryProgressRepository implements ProgressRepository {
  private records: SessionRecord[] = [];
  isAvailable(): boolean { return true; }
  list(): SessionRecord[] { return [...this.records]; }
  save(record: SessionRecord): void { this.records = [record, ...this.records].slice(0, 100); }
}
```

Note: `list()` returns newest-first because `save()` prepends.

- [ ] **Step 4: Run — expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add src/storage
git commit -m "Persist finished sessions behind a repository the backend can later replace"
```

---

### Task 6: The drill screen

**Files:**
- Create: `src/modules/drill/use-drill.ts`, `src/modules/drill/flash-card.tsx`, `src/modules/drill/drill-screen.tsx`, `src/modules/drill/drill-screen.test.tsx`, `app/practice/page.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: everything from Tasks 2–5
- Produces: `<DrillScreen />` (client component), route `/practice`

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DrillScreen } from "./drill-screen";

const answer = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
  await user.type(screen.getByLabelText(/answer/i), `${value}{Enter}`);
};

describe("DrillScreen", () => {
  beforeEach(() => localStorage.clear());

  it("shows the first card and the progress position", () => {
    render(<DrillScreen problems={[{ left: 7, right: 8 }, { left: 2, right: 3 }]} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText(/1\s*\/\s*2/)).toBeInTheDocument();
  });

  it("advances to the next card on a correct answer", async () => {
    const user = userEvent.setup();
    render(<DrillScreen problems={[{ left: 7, right: 8 }, { left: 2, right: 3 }]} />);
    await answer(user, "56");
    expect(screen.getByText(/2\s*\/\s*2/)).toBeInTheDocument();
  });

  it("keeps the same card and says try again when wrong", async () => {
    const user = userEvent.setup();
    render(<DrillScreen problems={[{ left: 7, right: 8 }, { left: 2, right: 3 }]} />);
    await answer(user, "12");
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
    expect(screen.getByText(/1\s*\/\s*2/)).toBeInTheDocument();
  });

  it("reveals the answer after three wrong attempts", async () => {
    const user = userEvent.setup();
    render(<DrillScreen problems={[{ left: 7, right: 8 }, { left: 2, right: 3 }]} />);
    for (let i = 0; i < 3; i++) await answer(user, "12");
    expect(screen.getByText(/56/)).toBeInTheDocument();
  });

  it("shows the results when every card is done", async () => {
    const user = userEvent.setup();
    render(<DrillScreen problems={[{ left: 7, right: 8 }]} />);
    await answer(user, "56");
    expect(await screen.findByText(/1\s*\/\s*1/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect FAIL.** `npm test -- drill-screen`

- [ ] **Step 3: Implement**

`use-drill.ts` owns the state (`useState<SessionState>`), calls `submitAnswer(state, value, Date.now())`, and on transition to `finished` saves a `SessionRecord` built from `summarize(state)` via the injected repository. `flash-card.tsx` renders the vertical card and the labelled input. `drill-screen.tsx` composes them and swaps in the results view when `status === "finished"`. `app/practice/page.tsx` is a thin route that generates problems and renders `<DrillScreen />`; `app/page.tsx` becomes the start screen linking to it.

Keep `"use client"` on the leaves — `drill-screen.tsx` and below — not on the route.

- [ ] **Step 4: Run — expect PASS.** Then `npx tsc --noEmit`, `npm run lint`, and `npm run dev` to confirm it works in a browser.

- [ ] **Step 5: Commit**

```bash
git add src/modules/drill app
git commit -m "Put the drill on screen: one card at a time, Enter to answer"
```

---

### Task 7: Results and history

**Files:**
- Create: `src/modules/drill/results-screen.tsx`, `src/modules/history/history-screen.tsx`, `src/modules/history/best-session.ts`, `src/modules/history/best-session.test.ts`, `app/history/page.tsx`

**Interfaces:**
- Consumes: `SessionRecord` (Task 5), `SessionSummary` (Task 4)
- Produces: `bestSession(records: SessionRecord[]): SessionRecord | null`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { bestSession } from "./best-session";
import type { SessionRecord } from "@/src/storage/progress-repository";

const record = (id: string, correctFirstTry: number, elapsedMs: number): SessionRecord => ({
  id, completedAt: "2026-09-08T00:00:00.000Z", total: 20, correctFirstTry, elapsedMs, missed: [],
});

describe("bestSession", () => {
  it("is null with no records", () => {
    expect(bestSession([])).toBeNull();
  });

  it("prefers the highest score", () => {
    expect(bestSession([record("a", 18, 1000), record("b", 20, 9000)])?.id).toBe("b");
  });

  it("breaks ties on the shortest time", () => {
    expect(bestSession([record("a", 20, 9000), record("b", 20, 4000)])?.id).toBe("b");
  });
});
```

- [ ] **Step 2: Run — expect FAIL.** `npm test -- best-session`

- [ ] **Step 3: Implement**

```ts
import type { SessionRecord } from "@/src/storage/progress-repository";

export function bestSession(records: SessionRecord[]): SessionRecord | null {
  return records.reduce<SessionRecord | null>((best, candidate) => {
    if (!best) return candidate;
    if (candidate.correctFirstTry !== best.correctFirstTry) {
      return candidate.correctFirstTry > best.correctFirstTry ? candidate : best;
    }
    return candidate.elapsedMs < best.elapsedMs ? candidate : best;
  }, null);
}
```

`results-screen.tsx` shows score, elapsed time, and the missed facts written out in full (`7 × 8 = 56 · 3 tries`), plus buttons to drill again and view history. `history-screen.tsx` lists records newest first with the best one marked, and shows the storage-unavailable notice when `repository.isAvailable()` is false.

- [ ] **Step 4: Run — expect PASS**, then `npm test`, `npx tsc --noEmit`, `npm run lint`.

- [ ] **Step 5: Commit**

```bash
git add src/modules app/history
git commit -m "Close the loop: results name the missed facts, history shows the trend"
```

---

## Self-Review

**Spec coverage:** session shape → Task 3 (`SESSION_LENGTH`) + Task 2; card layout and input → Task 6; retry and reveal → Tasks 3, 6; timing → Tasks 3, 4; scoring → Task 4; results screen → Task 7; history, cap and best-marking → Tasks 5, 7; storage failure and corrupt data → Task 5; routes → Tasks 6, 7; testing strategy → every task; deployment → Task 1 (CI); deferred items → not implemented, by design.

**Placeholders:** none. Tasks 6 and 7 describe component composition in prose rather than full JSX, because the components are thin renderers over interfaces fully specified in Tasks 2–5, and their behavior is pinned by the tests given verbatim.

**Type consistency:** `Problem`, `CardState`, `SessionState`, `SessionSummary`, `MissedFact`, `SessionRecord` and `ProgressRepository` are each defined once and referenced by the same names throughout. `isAvailable()` is on the interface in Task 5 and used in Task 7.
