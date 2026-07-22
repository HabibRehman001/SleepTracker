/**
 * Step 175 — sleep-day keying + HH:MM formatting for homeArrivalTime.
 * Pure helpers — Node-testable (no fetch / AsyncStorage).
 */

/** Local calendar midnight for the sleep day containing `at`. */
export function sleepDayDate(at: Date): Date {
  const day = new Date(at.getFullYear(), at.getMonth(), at.getDate())
  day.setHours(0, 0, 0, 0)
  return day
}

/** YYYY-MM-DD for the sleep day containing `at`. */
export function sleepDayDateKey(at: Date): string {
  const d = sleepDayDate(at)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

/** Local HH:MM (24h) for display / contract tests — e.g. 4:30 AM → "04:30". */
export function formatHomeArrivalHHMM(at: Date): string {
  const h = String(at.getHours()).padStart(2, '0')
  const m = String(at.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/** Inclusive local-day bounds for Mongo `date` matching. */
export function sleepDayDateBounds(at: Date): { start: Date; end: Date } {
  const start = sleepDayDate(at)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}
