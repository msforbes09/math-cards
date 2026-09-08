import { MAX_RECORDS } from "./local-storage-progress-repository";
import type { ProgressRepository, SessionRecord } from "./progress-repository";

export class InMemoryProgressRepository implements ProgressRepository {
  private records: SessionRecord[] = [];

  isAvailable(): boolean {
    return true;
  }

  list(): SessionRecord[] {
    return [...this.records];
  }

  save(record: SessionRecord): void {
    this.records = [record, ...this.records].slice(0, MAX_RECORDS);
  }
}
