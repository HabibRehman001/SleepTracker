/**
 * Steps 181–182 — native pedometer helpers (pure; no expo imports).
 * Hardware step counts should land within a couple of steps of a known walk.
 * Historical queries use full local calendar-day windows (OS step history).
 */

/** Acceptable error for a known walk (e.g. 20 steps → 18–22). */
export const PEDOMETER_STEP_TOLERANCE = 2

/** Core Motion / OS history window Expo documents (past week). */
export const PEDOMETER_HISTORY_MAX_DAYS = 7

export const PEDOMETER_PURPOSE =
  'Uses the phone’s dedicated step hardware (Core Motion / Android activity) — more accurate and battery-friendly than deriving steps from accelerometer samples.'

export const PEDOMETER_HISTORY_PURPOSE =
  'Past-day totals come from OS step history via getStepCountAsync — available even when the app was closed.'

export function isWithinStepTolerance(
  expected: number,
  actual: number,
  tolerance = PEDOMETER_STEP_TOLERANCE
): boolean {
  if (!Number.isFinite(expected) || !Number.isFinite(actual)) return false
  if (expected < 0 || actual < 0) return false
  return Math.abs(actual - expected) <= tolerance
}

/** Local midnight for “today’s steps” queries. */
export function startOfLocalDay(now = new Date()): Date {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Exclusive end of a local calendar day (next midnight). */
export function endOfLocalDay(now = new Date()): Date {
  const d = startOfLocalDay(now)
  d.setDate(d.getDate() + 1)
  return d
}

/**
 * Full local calendar-day bounds for `daysAgo` (0 = today so far if capped,
 * 1 = yesterday 00:00→00:00 next).
 * For completed days, end is next midnight (not “now”).
 */
export function localDayBounds(
  daysAgo: number,
  now = new Date()
): { start: Date; end: Date; daysAgo: number } {
  const ago = Math.max(0, Math.floor(daysAgo))
  const start = startOfLocalDay(now)
  start.setDate(start.getDate() - ago)
  const end = endOfLocalDay(start)
  // Today (daysAgo 0): cap end at now so we don’t query the future.
  if (ago === 0 && end.getTime() > now.getTime()) {
    return { start, end: new Date(now), daysAgo: ago }
  }
  return { start, end, daysAgo: ago }
}

/** Yesterday’s full local calendar day. */
export function yesterdayBounds(now = new Date()): { start: Date; end: Date } {
  const { start, end } = localDayBounds(1, now)
  return { start, end }
}

/**
 * Whole-day historical totals should look like a day of walking, not a
 * short “since app opened” session (typically tens of steps).
 * Zero is plausible (rest day); tiny positive under the floor is suspicious
 * when comparing to live session counts in tests.
 */
export const PLAUSIBLE_SESSION_ONLY_MAX = 50

export function isPlausibleWholeDayTotal(steps: number | null | undefined): boolean {
  if (steps == null || !Number.isFinite(steps) || steps < 0) return false
  // 0 = rest day; otherwise a day total is usually well above a short session.
  if (steps === 0) return true
  return steps >= PLAUSIBLE_SESSION_ONLY_MAX
}

/** Span of a completed calendar day in ms (≈ 24h). */
export function isFullCalendarDaySpan(start: Date, end: Date): boolean {
  const ms = end.getTime() - start.getTime()
  const day = 24 * 60 * 60 * 1000
  return ms >= day - 1000 && ms <= day + 1000
}
