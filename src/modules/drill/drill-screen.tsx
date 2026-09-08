"use client";

import { useState } from "react";
import type { Problem } from "@/src/domain/problem";
import type { ProgressRepository } from "@/src/storage/progress-repository";
import { DrillSession } from "./drill-session";

/** Remounts the session on restart so all drill state resets in one place. */
export function DrillScreen({
  problems,
  repository,
}: {
  problems: Problem[];
  repository?: ProgressRepository;
}) {
  const [run, setRun] = useState(0);

  return (
    <DrillSession
      key={run}
      problems={problems}
      repository={repository}
      onRestart={() => setRun((previous) => previous + 1)}
    />
  );
}
