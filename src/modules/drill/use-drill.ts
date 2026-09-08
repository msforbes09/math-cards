"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Problem } from "@/src/domain/problem";
import {
  currentCard,
  startSession,
  submitAnswer,
  type SessionState,
} from "@/src/domain/session";
import { summarize, type SessionSummary } from "@/src/domain/summary";
import { LocalStorageProgressRepository } from "@/src/storage/local-storage-progress-repository";
import type { ProgressRepository } from "@/src/storage/progress-repository";

export type Drill = {
  state: SessionState;
  card: ReturnType<typeof currentCard>;
  summary: SessionSummary;
  position: number;
  total: number;
  submit: (raw: string) => void;
};

export function useDrill(
  problems: Problem[],
  repository?: ProgressRepository,
): Drill {
  const repo = useMemo(
    () => repository ?? new LocalStorageProgressRepository(),
    [repository],
  );
  const [state, setState] = useState<SessionState>(() =>
    startSession(problems, Date.now()),
  );
  const saved = useRef(false);

  const submit = useCallback(
    (raw: string) => {
      setState((previous) => {
        const next = submitAnswer(previous, raw, Date.now());

        // Record once, at the moment the session becomes finished.
        if (next.status === "finished" && !saved.current) {
          saved.current = true;
          const summary = summarize(next);
          repo.save({
            id: crypto.randomUUID(),
            completedAt: new Date(next.finishedAt ?? Date.now()).toISOString(),
            total: summary.total,
            correctFirstTry: summary.correctFirstTry,
            elapsedMs: summary.elapsedMs,
            missed: summary.missed,
          });
        }

        return next;
      });
    },
    [repo],
  );

  return {
    state,
    card: currentCard(state),
    summary: summarize(state),
    position: Math.min(state.index + 1, state.cards.length),
    total: state.cards.length,
    submit,
  };
}
