import { describe, it, expect, beforeEach } from "vitest";
import { getSnapshot, getServerSnapshot, subscribe } from "./progress-store";
import { LocalStorageProgressRepository } from "./local-storage-progress-repository";
import type { SessionRecord } from "./progress-repository";

const record = (id: string): SessionRecord => ({
  id,
  completedAt: "2026-09-08T00:00:00.000Z",
  total: 20,
  correctFirstTry: 20,
  elapsedMs: 1000,
  missed: [],
});

describe("progress store", () => {
  beforeEach(() => localStorage.clear());

  it("returns the same reference while nothing changes", () => {
    expect(getSnapshot()).toBe(getSnapshot());
  });

  it("returns a new reference once a session is saved", () => {
    const before = getSnapshot();
    new LocalStorageProgressRepository().save(record("a"));
    const after = getSnapshot();
    expect(after).not.toBe(before);
    expect(after.records.map((r) => r.id)).toEqual(["a"]);
  });

  it("reports an empty, available snapshot on the server", () => {
    expect(getServerSnapshot()).toEqual({ records: [], available: true });
    expect(getServerSnapshot()).toBe(getServerSnapshot());
  });

  it("notifies subscribers when another tab writes", () => {
    let calls = 0;
    const unsubscribe = subscribe(() => {
      calls += 1;
    });
    window.dispatchEvent(new StorageEvent("storage"));
    expect(calls).toBe(1);
    unsubscribe();
    window.dispatchEvent(new StorageEvent("storage"));
    expect(calls).toBe(1);
  });
});
