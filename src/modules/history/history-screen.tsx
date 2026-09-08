"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
} from "@/src/storage/progress-store";
import { bestSession } from "./best-session";

const formatDuration = (ms: number) => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export function HistoryScreen() {
  const { records, available } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const best = bestSession(records);

  return (
    <section className="flex w-full max-w-xl flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Past sessions</h1>
        <Link href="/" className="text-sm underline underline-offset-4">
          Home
        </Link>
      </div>

      {!available && (
        <p className="rounded-md border border-neutral-300 p-4 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
          This browser will not let the app save anything, so sessions are not
          being kept on this device. Practicing still works.
        </p>
      )}

      {records.length === 0 ? (
        <p className="text-neutral-600 dark:text-neutral-400">
          No sessions yet.{" "}
          <Link href="/practice" className="underline underline-offset-4">
            Practice a card
          </Link>{" "}
          and it will show up here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {records.map((record) => (
            <li
              key={record.id}
              className="flex items-center justify-between rounded-md border border-neutral-300 px-4 py-3 dark:border-neutral-700"
            >
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {formatDate(record.completedAt)}
                {best?.id === record.id && (
                  <span className="ml-2 rounded bg-neutral-900 px-1.5 py-0.5 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">
                    Best
                  </span>
                )}
              </span>
              <span className="font-mono tabular-nums">
                {record.correctFirstTry} / {record.total}
                <span className="ml-3 text-neutral-500">
                  {formatDuration(record.elapsedMs)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
