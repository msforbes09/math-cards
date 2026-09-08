import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  LocalStorageProgressRepository,
  STORAGE_KEY,
  MAX_RECORDS,
} from "./local-storage-progress-repository";
import type { SessionRecord } from "./progress-repository";

const record = (id: string, correctFirstTry = 20): SessionRecord => ({
  id,
  completedAt: "2026-09-08T00:00:00.000Z",
  total: 20,
  correctFirstTry,
  elapsedMs: 1000,
  missed: [],
});

describe("LocalStorageProgressRepository", () => {
  beforeEach(() => localStorage.clear());

  it("returns an empty list when nothing is stored", () => {
    expect(new LocalStorageProgressRepository().list()).toEqual([]);
  });

  it("round-trips a saved record", () => {
    new LocalStorageProgressRepository().save(record("a"));
    expect(new LocalStorageProgressRepository().list()).toEqual([record("a")]);
  });

  it("lists newest first", () => {
    const repo = new LocalStorageProgressRepository();
    repo.save(record("a"));
    repo.save(record("b"));
    expect(repo.list().map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("keeps only the most recent MAX_RECORDS", () => {
    const repo = new LocalStorageProgressRepository();
    for (let i = 0; i < MAX_RECORDS + 5; i++) repo.save(record(`r${i}`));
    const listed = repo.list();
    expect(listed).toHaveLength(MAX_RECORDS);
    expect(listed[0].id).toBe(`r${MAX_RECORDS + 4}`);
  });

  it("treats unparseable data as empty rather than throwing", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(new LocalStorageProgressRepository().list()).toEqual([]);
  });

  it("drops individual malformed records but keeps valid ones", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([record("good"), { id: 5 }, null]),
    );
    expect(new LocalStorageProgressRepository().list()).toEqual([record("good")]);
  });

  it("survives a storage that throws on write", () => {
    const repo = new LocalStorageProgressRepository();
    const setItem = vi
      .spyOn(window.localStorage, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    expect(() => repo.save(record("a"))).not.toThrow();
    setItem.mockRestore();
  });

  it("reports whether storage is available", () => {
    expect(new LocalStorageProgressRepository().isAvailable()).toBe(true);
  });

  it("reports storage as unavailable when writes throw", () => {
    const setItem = vi
      .spyOn(window.localStorage, "setItem")
      .mockImplementation(() => {
        throw new Error("SecurityError");
      });
    expect(new LocalStorageProgressRepository().isAvailable()).toBe(false);
    setItem.mockRestore();
  });
});
