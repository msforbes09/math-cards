import {
  isSessionRecord,
  type ProgressRepository,
  type SessionRecord,
} from "./progress-repository";

export const STORAGE_KEY = "math-exercises:v1:sessions";
export const MAX_RECORDS = 100;

/** Browser-local history. Every failure mode here is non-fatal by design: the
 *  drill has to keep working on a locked-down tablet or in private browsing,
 *  where storage throws or silently holds nothing. */
export class LocalStorageProgressRepository implements ProgressRepository {
  isAvailable(): boolean {
    try {
      const probe = `${STORAGE_KEY}:probe`;
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }

  list(): SessionRecord[] {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      // One bad record must not destroy the rest of the history.
      return parsed.filter(isSessionRecord);
    } catch {
      return [];
    }
  }

  save(record: SessionRecord): void {
    try {
      const next = [record, ...this.list()].slice(0, MAX_RECORDS);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage full or unavailable. The session still happened and the
      // student still saw their score; only the history is lost.
    }
  }
}
