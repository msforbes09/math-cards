"use client";

import type { Problem } from "@/src/domain/problem";
import type { ProgressRepository } from "@/src/storage/progress-repository";
import { FlashCard } from "./flash-card";
import { ResultsScreen } from "./results-screen";
import { useDrill } from "./use-drill";

export function DrillSession({
  problems,
  repository,
  onRestart,
}: {
  problems: Problem[];
  repository?: ProgressRepository;
  onRestart: () => void;
}) {
  const drill = useDrill(problems, repository);

  if (drill.state.status === "finished" || !drill.card) {
    return <ResultsScreen summary={drill.summary} onRestart={onRestart} />;
  }

  const card = drill.card;

  return (
    <section className="flex w-full max-w-xl flex-col items-center gap-10">
      <p
        data-testid="progress"
        className="font-mono text-sm tabular-nums text-neutral-500"
      >
        {`${drill.position} / ${drill.total}`}
      </p>

      <FlashCard
        card={card}
        revealing={drill.state.status === "revealing"}
        wrong={drill.state.status === "answering" && card.attempts > 0}
        onSubmit={drill.submit}
      />
    </section>
  );
}
