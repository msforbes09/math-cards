import type { SessionState } from "./session";

export type MissedFact = { left: number; right: number; attempts: number };

export type SessionSummary = {
  total: number;
  correctFirstTry: number;
  elapsedMs: number;
  missed: MissedFact[];
};

/** Scores recall, not persistence: a card only counts if it was right the
 *  first time. Two tries scores the same as a reveal — nothing. */
export function summarize(state: SessionState): SessionSummary {
  const answered = state.cards.filter((card) => card.attempts > 0);

  return {
    total: state.cards.length,
    correctFirstTry: answered.filter(
      (card) => card.attempts === 1 && !card.revealed,
    ).length,
    elapsedMs: state.finishedAt === null ? 0 : state.finishedAt - state.startedAt,
    missed: answered
      .filter((card) => card.attempts > 1 || card.revealed)
      .map((card) => ({
        left: card.problem.left,
        right: card.problem.right,
        attempts: card.attempts,
      })),
  };
}
