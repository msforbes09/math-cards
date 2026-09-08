import { describe, it, expect } from "vitest";
import { generateSession, productOf, formatProblem, ALL_PROBLEMS } from "./problem";

const seeded = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("ALL_PROBLEMS", () => {
  it("is the 100 ordered pairs of 0-9", () => {
    expect(ALL_PROBLEMS).toHaveLength(100);
    expect(ALL_PROBLEMS).toContainEqual({ left: 3, right: 4 });
    expect(ALL_PROBLEMS).toContainEqual({ left: 4, right: 3 });
  });
});

describe("productOf / formatProblem", () => {
  it("multiplies", () => {
    expect(productOf({ left: 7, right: 8 })).toBe(56);
  });

  it("formats with a multiplication sign", () => {
    expect(formatProblem({ left: 7, right: 8 })).toBe("7 × 8");
  });
});

describe("generateSession", () => {
  it("returns the requested count", () => {
    expect(generateSession(20, Math.random)).toHaveLength(20);
  });

  it("never repeats a problem within a session", () => {
    const keys = generateSession(20, Math.random).map((p) => `${p.left}x${p.right}`);
    expect(new Set(keys).size).toBe(20);
  });

  it("only uses factors 0-9", () => {
    for (const p of generateSession(20, Math.random)) {
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.left).toBeLessThanOrEqual(9);
      expect(p.right).toBeGreaterThanOrEqual(0);
      expect(p.right).toBeLessThanOrEqual(9);
    }
  });

  it("is deterministic for a given rng", () => {
    const a = generateSession(5, seeded([0.1, 0.9, 0.3, 0.7, 0.5]));
    const b = generateSession(5, seeded([0.1, 0.9, 0.3, 0.7, 0.5]));
    expect(a).toEqual(b);
  });

  it("rejects a count larger than the pool", () => {
    expect(() => generateSession(101, Math.random)).toThrow();
  });
});
