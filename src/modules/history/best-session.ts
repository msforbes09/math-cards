import type { SessionRecord } from "@/src/storage/progress-repository";

/** Highest score wins; a tie goes to the faster session. Time alone would not
 *  mean much - a quick session with half the facts missed is not a better one. */
export function bestSession(records: SessionRecord[]): SessionRecord | null {
  return records.reduce<SessionRecord | null>((best, candidate) => {
    if (!best) return candidate;
    if (candidate.correctFirstTry !== best.correctFirstTry) {
      return candidate.correctFirstTry > best.correctFirstTry ? candidate : best;
    }
    return candidate.elapsedMs < best.elapsedMs ? candidate : best;
  }, null);
}
