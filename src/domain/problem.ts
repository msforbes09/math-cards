export type Problem = { left: number; right: number };

export const FACTORS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** The 100 ordered pairs of single-digit factors. 3x4 and 4x3 are distinct,
 *  exactly as they are on the printed window card. */
export const ALL_PROBLEMS: Problem[] = FACTORS.flatMap((left) =>
  FACTORS.map((right) => ({ left, right })),
);

export function productOf({ left, right }: Problem): number {
  return left * right;
}

export function formatProblem({ left, right }: Problem): string {
  return `${left} × ${right}`;
}

/** Draws `count` distinct problems. The rng is injected so tests can pin the
 *  exact draw rather than only assert its shape. */
export function generateSession(count: number, rng: () => number): Problem[] {
  if (count > ALL_PROBLEMS.length) {
    throw new Error(
      `Cannot draw ${count} distinct problems from ${ALL_PROBLEMS.length}`,
    );
  }

  const pool = [...ALL_PROBLEMS];
  const drawn: Problem[] = [];
  while (drawn.length < count) {
    const index = Math.floor(rng() * pool.length) % pool.length;
    drawn.push(pool.splice(index, 1)[0]);
  }
  return drawn;
}
