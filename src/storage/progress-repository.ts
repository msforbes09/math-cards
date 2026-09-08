import type { MissedFact } from "@/src/domain/summary";

export type SessionRecord = {
  id: string;
  completedAt: string; // ISO 8601
  total: number;
  correctFirstTry: number;
  elapsedMs: number;
  missed: MissedFact[];
};

/** The seam a later milestone swaps for an HTTP implementation. Nothing above
 *  this interface knows where progress lives. */
export interface ProgressRepository {
  list(): SessionRecord[];
  save(record: SessionRecord): void;
  isAvailable(): boolean;
}

export function isSessionRecord(value: unknown): value is SessionRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.completedAt === "string" &&
    typeof record.total === "number" &&
    typeof record.correctFirstTry === "number" &&
    typeof record.elapsedMs === "number" &&
    Array.isArray(record.missed)
  );
}
