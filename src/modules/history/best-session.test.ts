import { describe, it, expect } from "vitest";
import { bestSession } from "./best-session";
import type { SessionRecord } from "@/src/storage/progress-repository";

const record = (
  id: string,
  correctFirstTry: number,
  elapsedMs: number,
): SessionRecord => ({
  id,
  completedAt: "2026-09-08T00:00:00.000Z",
  total: 20,
  correctFirstTry,
  elapsedMs,
  missed: [],
});

describe("bestSession", () => {
  it("is null with no records", () => {
    expect(bestSession([])).toBeNull();
  });

  it("prefers the highest score", () => {
    expect(bestSession([record("a", 18, 1000), record("b", 20, 9000)])?.id).toBe("b");
  });

  it("breaks ties on the shortest time", () => {
    expect(bestSession([record("a", 20, 9000), record("b", 20, 4000)])?.id).toBe("b");
  });

  it("keeps the earlier record when score and time are equal", () => {
    expect(bestSession([record("a", 20, 4000), record("b", 20, 4000)])?.id).toBe("a");
  });
});
