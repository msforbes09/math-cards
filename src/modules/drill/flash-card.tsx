"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatProblem, productOf } from "@/src/domain/problem";
import type { CardState } from "@/src/domain/session";

type FlashCardProps = {
  card: CardState;
  revealing: boolean;
  wrong: boolean;
  onSubmit: (raw: string) => void;
};

export function FlashCard({ card, revealing, wrong, onSubmit }: FlashCardProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { left, right } = card.problem;

  // Submitting already empties the box; the effect only keeps focus on it so a
  // new card, or a rejected attempt, can be answered without reaching for the
  // mouse.
  useEffect(() => {
    inputRef.current?.focus();
  }, [card.problem, card.attempts]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(value);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
      <div className="font-mono text-7xl leading-none tabular-nums sm:text-8xl">
        <span className="sr-only">{formatProblem(card.problem)} equals</span>
        <div aria-hidden className="flex flex-col items-end gap-2">
          <span data-testid="factor-left">{left}</span>
          <span className="flex items-center gap-6">
            <span>&times;</span>
            <span data-testid="factor-right">{right}</span>
          </span>
        </div>
      </div>

      <div className="h-1 w-48 rounded bg-neutral-800 dark:bg-neutral-200" />

      <input
        ref={inputRef}
        aria-label="Answer"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) =>
          setValue(event.target.value.replace(/\D/g, "").slice(0, 3))
        }
        className="w-48 rounded-lg border-2 border-neutral-400 bg-transparent p-3 text-center font-mono text-5xl tabular-nums outline-none focus:border-neutral-900 dark:focus:border-neutral-100"
      />

      <div aria-live="polite" className="min-h-14 text-center">
        {revealing ? (
          <p data-testid="reveal" className="text-lg">
            The answer is{" "}
            <strong className="font-mono">{productOf(card.problem)}</strong>.
            Type it to continue.
          </p>
        ) : wrong ? (
          <p className="text-lg">Try again.</p>
        ) : null}
      </div>
    </form>
  );
}
