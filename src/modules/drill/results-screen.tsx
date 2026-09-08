import Link from "next/link";
import type { SessionSummary } from "@/src/domain/summary";

const formatDuration = (ms: number) => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export function ResultsScreen({
  summary,
  onRestart,
}: {
  summary: SessionSummary;
  onRestart: () => void;
}) {
  return (
    <section className="flex w-full max-w-xl flex-col items-center gap-8">
      <h1 className="text-2xl font-semibold">Session complete</h1>

      <div className="flex gap-12 text-center">
        <div>
          <p
            data-testid="score"
            className="font-mono text-5xl tabular-nums"
          >{`${summary.correctFirstTry} / ${summary.total}`}</p>
          <p className="mt-1 text-sm text-neutral-500">correct first try</p>
        </div>
        <div>
          <p className="font-mono text-5xl tabular-nums">
            {formatDuration(summary.elapsedMs)}
          </p>
          <p className="mt-1 text-sm text-neutral-500">total time</p>
        </div>
      </div>

      {summary.missed.length > 0 && (
        <div className="w-full">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Practise these
          </h2>
          <ul className="flex flex-col gap-2">
            {summary.missed.map((fact) => (
              <li
                key={`${fact.left}x${fact.right}`}
                className="flex items-center justify-between rounded-md border border-neutral-300 px-4 py-2 font-mono dark:border-neutral-700"
              >
                <span>{`${fact.left} × ${fact.right} = ${fact.left * fact.right}`}</span>
                <span className="font-sans text-sm text-neutral-500">
                  {fact.attempts} {fact.attempts === 1 ? "try" : "tries"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-md bg-neutral-900 px-5 py-2.5 font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Practise again
        </button>
        <Link
          href="/history"
          className="rounded-md border border-neutral-300 px-5 py-2.5 font-medium dark:border-neutral-700"
        >
          History
        </Link>
      </div>
    </section>
  );
}
