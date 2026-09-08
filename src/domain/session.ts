import { productOf, type Problem } from "./problem";

export const SESSION_LENGTH = 20;
export const MAX_ATTEMPTS = 3;

export type CardState = {
  problem: Problem;
  attempts: number;
  revealed: boolean;
};

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
  if (state.status === "finished") return null;
  return state.cards[state.index] ?? null;
}

/** The only way a session moves. Pure: no timers, no storage, no Date.now —
 *  the caller supplies `now`. */
export function submitAnswer(
  state: SessionState,
  raw: string,
  now: number,
): SessionState {
  if (state.status === "finished") return state;

  const trimmed = raw.trim();
  if (trimmed === "") return state;

  const card = state.cards[state.index];
  const answer = Number(trimmed);
  const correct = Number.isFinite(answer) && answer === productOf(card.problem);

  // Revealed: the student is copying the answer shown to them. Nothing counts
  // any more, and only the right answer moves on.
  if (state.status === "revealing") {
    return correct ? advance(state, now) : state;
  }

  const attempts = card.attempts + 1;

  if (correct) {
    return advance(
      { ...state, cards: replaceCard(state.cards, state.index, { ...card, attempts }) },
      now,
    );
  }

  if (attempts >= MAX_ATTEMPTS) {
    return {
      ...state,
      cards: replaceCard(state.cards, state.index, {
        ...card,
        attempts,
        revealed: true,
      }),
      status: "revealing",
    };
  }

  return {
    ...state,
    cards: replaceCard(state.cards, state.index, { ...card, attempts }),
  };
}

function replaceCard(
  cards: CardState[],
  index: number,
  card: CardState,
): CardState[] {
  return cards.map((existing, i) => (i === index ? card : existing));
}

function advance(state: SessionState, now: number): SessionState {
  const next = state.index + 1;
  if (next >= state.cards.length) {
    return { ...state, index: next, status: "finished", finishedAt: now };
  }
  return { ...state, index: next, status: "answering" };
}
