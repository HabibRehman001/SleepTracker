/**
 * Trailing rolling mean of `windowSize` points ending at each index.
 *
 * Edge policy (full-window / "warm-up"):
 * - Indices `0 .. windowSize - 2` are `NaN` — a complete window is not available yet.
 * - From index `windowSize - 1` onward, each value is the arithmetic mean of
 *   `values[i - windowSize + 1 .. i]` (inclusive).
 *
 * Example: `rollingAverage([1, 2, 3, 4, 5], 3)` → `[NaN, NaN, 2, 3, 4]`
 *
 * Reused for duration / quality / latency chart smoothing (Step 94).
 */
export function rollingAverage(
  values: number[],
  windowSize: number
): number[] {
  if (!Number.isInteger(windowSize) || windowSize < 1) {
    throw new RangeError('windowSize must be a positive integer')
  }

  return values.map((_, i) => {
    if (i < windowSize - 1) {
      return NaN
    }

    let sum = 0
    for (let j = i - windowSize + 1; j <= i; j++) {
      sum += values[j]
    }
    return sum / windowSize
  })
}
