/**
 * Node 25 defines a built-in `localStorage` global that is an inert stub unless
 * the process is started with `--localstorage-file`. Vitest's jsdom environment
 * lets that Node global shadow jsdom's real Storage, so `localStorage.setItem`
 * is undefined on Node 25 while it works fine on Node 22 (which has no such
 * global). That split would let CI pass on code that is broken locally.
 *
 * Install a spec-compliant in-memory Storage only when the environment's own
 * one is unusable, so on a healthy runtime the tests still exercise jsdom's.
 */
class MemoryStorage implements Storage {
  private entries = new Map<string, string>();

  get length(): number {
    return this.entries.size;
  }

  key(index: number): string | null {
    return [...this.entries.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.entries.get(String(key)) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(String(key), String(value));
  }

  removeItem(key: string): void {
    this.entries.delete(String(key));
  }

  clear(): void {
    this.entries.clear();
  }
}

export function installLocalStorageIfBroken(): void {
  const existing = globalThis.localStorage as Storage | undefined;
  if (existing && typeof existing.setItem === "function") return;

  const storage = new MemoryStorage();
  for (const target of [globalThis, window] as unknown as Record<string, unknown>[]) {
    Object.defineProperty(target, "localStorage", {
      value: storage,
      configurable: true,
      writable: true,
    });
  }
}
