/**
 * Longest consecutive run where `predicate` is true (Step 95).
 * Iterates in the given order — sort chronologically before calling if needed.
 *
 * Example: `longestStreak(entries, (e) => (e.sleepQuality ?? 0) >= 7)`
 */
export function longestStreak<T>(
  entries: readonly T[],
  predicate: (entry: T) => boolean
): number {
  let best = 0
  let current = 0

  for (const entry of entries) {
    if (predicate(entry)) {
      current += 1
      if (current > best) best = current
    } else {
      current = 0
    }
  }

  return best
}
