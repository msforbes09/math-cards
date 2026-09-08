/**
 * Runs `body` with a localStorage whose writes throw, then restores the real
 * one.
 *
 * Swapping the whole object rather than spying on a method is deliberate.
 * jsdom implements Storage as a Proxy, so `vi.spyOn(window.localStorage,
 * "setItem")` is swallowed as a stored key and the real method still runs -
 * while on Node 25, where a plain-object polyfill stands in, the same spy works
 * fine. That difference made one test fail in CI and another pass for the wrong
 * reason. Replacing the object behaves identically on both.
 */
export function withFailingStorage<T>(body: () => T): T {
  const original = Object.getOwnPropertyDescriptor(window, "localStorage");

  const failing: Storage = {
    length: 0,
    key: () => null,
    getItem: () => null,
    removeItem: () => {},
    clear: () => {},
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };

  Object.defineProperty(window, "localStorage", {
    value: failing,
    configurable: true,
    writable: true,
  });

  try {
    return body();
  } finally {
    if (original) {
      Object.defineProperty(window, "localStorage", original);
    } else {
      Reflect.deleteProperty(window, "localStorage");
    }
  }
}
