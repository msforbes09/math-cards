import { describe, it, expect } from "vitest";
import { summarize } from "./summary";
import { startSession, submitAnswer } from "./session";
import type { Problem } from "./problem";

const problems: Problem[] = [
  { left: 7, right: 8 }, // 56
  { left: 2, right: 3 }, // 6
];

describe("summarize", () => {
  it("counts only first-attempt correctness", () => {
    let s = startSession(problems, 0);
    s = submitAnswer(s, "56", 1000); // first try
    s = submitAnswer(s, "5", 2000); // wrong
    s = submitAnswer(s, "6", 3000); // right, second try
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

  it("scores a clean run as every card correct", () => {
    let s = startSession(problems, 0);
    s = submitAnswer(s, "56", 100);
    s = submitAnswer(s, "6", 200);
    const summary = summarize(s);
    expect(summary.correctFirstTry).toBe(2);
    expect(summary.missed).toEqual([]);
  });
});
