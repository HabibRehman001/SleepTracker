/**
 * Clock helpers for the locked night screen (Step 160).
 */

/** Local wall clock — e.g. "2:41" or "14:41" depending on locale. */
export function formatLockedClock(now: Date = new Date()): string {
  return now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Calm wake hint — not a countdown. */
export function formatUntilWake(wakeHHMM: string | null | undefined): string | null {
  if (!wakeHHMM || !/^\d{1,2}:\d{2}$/.test(wakeHHMM)) return null
  const [hRaw, mRaw] = wakeHHMM.split(':')
  const h = Number(hRaw)
  const m = Number(mRaw)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  const d = new Date()
  d.setHours(h, m, 0, 0)
  const label = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return `Until ${label}`
}

export const LOCKED_SLEEP_MESSAGE = 'Sleep well.'
