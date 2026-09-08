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
    expect(s.cards[0].attempts).toBe(MAX_ATTEMPTS);
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

  it("treats non-numeric input as a wrong attempt", () => {
    const s = submitAnswer(start(), "abc", 2000);
    expect(s.cards[0].attempts).toBe(1);
    expect(s.index).toBe(0);
  });
});
