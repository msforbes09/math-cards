import { LocalStorageProgressRepository } from "./local-storage-progress-repository";
import type { SessionRecord } from "./progress-repository";

export type ProgressSnapshot = {
  records: SessionRecord[];
  available: boolean;
};

const repository = new LocalStorageProgressRepository();

const SERVER_SNAPSHOT: ProgressSnapshot = { records: [], available: true };

let cached: ProgressSnapshot = SERVER_SNAPSHOT;
let cachedKey: string | null = null;

/** Browser storage is an external mutable store, so React reads it through
 *  useSyncExternalStore rather than an effect. The snapshot must keep the same
 *  reference between reads or React re-renders forever, so it is memoized on a
 *  serialization of its own contents. */
export function getSnapshot(): ProgressSnapshot {
  const available = repository.isAvailable();
  const records = repository.list();
  const key = `${available}|${JSON.stringify(records)}`;

  if (key !== cachedKey) {
    cachedKey = key;
    cached = { records, available };
  }
  return cached;
}

/** The server has no storage, and an empty history is the honest answer there.
 *  Availability is reported as true so the "cannot save" notice never flashes
 *  in the server-rendered HTML. */
export function getServerSnapshot(): ProgressSnapshot {
  return SERVER_SNAPSHOT;
}

export function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
