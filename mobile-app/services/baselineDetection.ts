/**
 * Baseline from 2 detected sleep windows (Step 145).
 * Pure clock math — no Expo / AsyncStorage so Node contracts can run.
 */

import type { StaticWindow } from './staticWindow'

/** Nights required before baseline bed/wake averages are finalized. */
export const BASELINE_TARGET_NIGHTS = 2

export type DetectedSleepWindow = {
  start: Date
  end: Date
}

/** Format local time as HH:MM. */
export function formatHHMM(date: Date): string {
  const h = date.getHours()
  const m = date.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function clockToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => Number(n))
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
  return h * 60 + m
}

export function minutesToClock(totalMinutes: number): string {
  const day = 24 * 60
  // Floor so .5 averages land on the earlier minute (04:02 / 11:57 for the
  // Step 145 synthetic nights, not banker’s round-up to 04:03 / 11:58).
  let m = Math.floor(totalMinutes) % day
  if (m < 0) m += day
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/**
 * Average HH:MM clock times (simple mean of minutes-from-midnight).
 * Fine for clustered bed/wake around the same part of day (e.g. ~04:00).
 */
export function averageClockTimes(times: string[]): string | null {
  if (!times.length) return null
  const sum = times.reduce((acc, t) => acc + clockToMinutes(t), 0)
  return minutesToClock(sum / times.length)
}

/**
 * From detected night windows → average bed (start) and wake (end).
 * Two nights 04:10–12:05 and 03:55–11:50 → ~04:02–11:57.
 */
export function averageBedWakeFromWindows(
  windows: Array<DetectedSleepWindow | StaticWindow>
): { detectedBedtime: string; detectedWaketime: string; sampleNights: number } | null {
  if (windows.length < BASELINE_TARGET_NIGHTS) return null
  const nights = windows.slice(0, BASELINE_TARGET_NIGHTS)
  const beds = nights.map((w) => formatHHMM(w.start))
  const wakes = nights.map((w) => formatHHMM(w.end))
  const detectedBedtime = averageClockTimes(beds)
  const detectedWaketime = averageClockTimes(wakes)
  if (!detectedBedtime || !detectedWaketime) return null
  return {
    detectedBedtime,
    detectedWaketime,
    sampleNights: nights.length,
  }
}

/** Serialize a window for persistence in the store. */
export function serializeWindow(w: DetectedSleepWindow | StaticWindow): {
  startIso: string
  endIso: string
} {
  return {
    startIso: w.start.toISOString(),
    endIso: w.end.toISOString(),
  }
}

export function deserializeWindow(row: {
  startIso: string
  endIso: string
}): DetectedSleepWindow {
  return {
    start: new Date(row.startIso),
    end: new Date(row.endIso),
  }
}

/** "04:02" → "4:02 AM" */
export function formatClock12h(hhmm: string): string {
  const minutes = clockToMinutes(hhmm)
  let h24 = Math.floor(minutes / 60)
  const m = minutes % 60
  const suffix = h24 >= 12 ? 'PM' : 'AM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Suggested schedule line for the results screen. */
export function formatSuggestedSchedule(
  bedtimeHHMM: string,
  waketimeHHMM: string
): string {
  return `Sleep ${formatClock12h(bedtimeHHMM)} → Wake ${formatClock12h(waketimeHHMM)}`
}

/**
 * Step 148 — live preview while nudging bed/wake.
 * Valid HH:MM fields update immediately; invalid drafts keep the last good clock.
 */
export function liveSchedulePreview(
  bedtimeHHMM: string,
  waketimeHHMM: string,
  fallbackBedtime: string,
  fallbackWaketime: string
): string {
  const bedOk = /^([01]\d|2[0-3]):[0-5]\d$/.test(bedtimeHHMM.trim())
  const wakeOk = /^([01]\d|2[0-3]):[0-5]\d$/.test(waketimeHHMM.trim())
  return formatSuggestedSchedule(
    bedOk ? bedtimeHHMM.trim() : fallbackBedtime,
    wakeOk ? waketimeHHMM.trim() : fallbackWaketime
  )
}

/** Night card label from a persisted window. */
export function formatNightRange(startIso: string, endIso: string): {
  bedLabel: string
  wakeLabel: string
  rangeLabel: string
} {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const bed = formatHHMM(start)
  const wake = formatHHMM(end)
  return {
    bedLabel: formatClock12h(bed),
    wakeLabel: formatClock12h(wake),
    rangeLabel: `${formatClock12h(bed)} → ${formatClock12h(wake)}`,
  }
}
