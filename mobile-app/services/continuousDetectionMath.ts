/**
 * Step 197 — continuous auto-detection (same static-window logic as 141–144).
 * Runs every night forever — independent of the enforced lock schedule.
 */

import type { StaticWindow } from './staticWindow'
import { findLongestSleepWindow, type Sample } from './staticWindow'
import type { MotionSample } from './motionSampleMath'
import { MOTION_SAMPLE_INTERVAL_SECONDS } from './motionSampleMath'

/** Keep ≥1 week of 15-min samples — see MOTION_SAMPLE_LOG_MAX. */
export { CONTINUOUS_MOTION_LOG_MAX } from './motionSampleMath'

/** Retain detected nights for weekly stats / review. */
export const CONTINUOUS_NIGHT_LOG_MAX = 28

/** Finalize a night once the window has ended + this grace. */
export const NIGHT_FINALIZE_GRACE_MS = 30 * 60 * 1000

/** Look back this far when scanning for a completed night. */
export const CONTINUOUS_LOOKBACK_MS = 36 * 60 * 60 * 1000

export type ContinuousNightRecord = {
  /** Local yyyy-MM-dd of window start (sleep day attribution). */
  sleepDayKey: string
  startIso: string
  endIso: string
  durationMs: number
  detectedAtIso: string
  /** True when this night also fed the 2-night baseline store. */
  countedTowardBaseline?: boolean
}

export function localSleepDayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function sleepDayKeyFromWindow(window: StaticWindow): string {
  return localSleepDayKey(window.start)
}

/**
 * Pure: given samples + existing night keys, decide whether to record a new night.
 * Uses the same findLongestSleepWindow (home ∩ night ∩ 6–8h) as baseline.
 * Already-logged windows are stripped so a later night is not shadowed.
 */
export function decideContinuousNightRecord(input: {
  samples: Array<Sample | MotionSample>
  existingSleepDayKeys: string[]
  now?: Date
  lookbackMs?: number
  graceMs?: number
}): ContinuousNightRecord | null {
  const now = input.now ?? new Date()
  const lookbackMs = input.lookbackMs ?? CONTINUOUS_LOOKBACK_MS
  const graceMs = input.graceMs ?? NIGHT_FINALIZE_GRACE_MS
  const cutoff = now.getTime() - lookbackMs
  let candidates = input.samples.filter((s) => s.timestamp >= cutoff)
  if (candidates.length < 4) return null

  for (let attempt = 0; attempt < 14; attempt++) {
    const window = findLongestSleepWindow(candidates)
    if (!window) return null

    const sleepDayKey = sleepDayKeyFromWindow(window)
    const finalized = now.getTime() >= window.end.getTime() + graceMs

    if (!input.existingSleepDayKeys.includes(sleepDayKey)) {
      if (!finalized) return null
      return {
        sleepDayKey,
        startIso: window.start.toISOString(),
        endIso: window.end.toISOString(),
        durationMs: window.end.getTime() - window.start.getTime(),
        detectedAtIso: now.toISOString(),
      }
    }

    // Strip this already-logged run and look for another night.
    const pad = MOTION_SAMPLE_INTERVAL_SECONDS * 1000
    const startMs = window.start.getTime() - pad
    const endMs = window.end.getTime() + pad
    candidates = candidates.filter(
      (s) => s.timestamp < startMs || s.timestamp > endMs
    )
    if (candidates.length < 4) return null
  }

  return null
}

/** How many distinct sleep days appear in a span of records. */
export function countNightsInRange(
  records: ContinuousNightRecord[],
  fromKeyInclusive: string,
  toKeyInclusive: string
): number {
  return records.filter(
    (r) => r.sleepDayKey >= fromKeyInclusive && r.sleepDayKey <= toKeyInclusive
  ).length
}

/**
 * Simulate a week of locked-schedule nights: one static window per day.
 * Used by the Step 197 contract test (sped-up, not OS BackgroundFetch).
 */
export function simulateWeekOfContinuousNights(input: {
  startDay: Date
  nights?: number
  bedHour?: number
  bedMinute?: number
  wakeHour?: number
  wakeMinute?: number
  intervalMs?: number
}): {
  samples: Sample[]
  records: ContinuousNightRecord[]
} {
  const nights = input.nights ?? 7
  const intervalMs =
    input.intervalMs ?? MOTION_SAMPLE_INTERVAL_SECONDS * 1000
  const bedH = input.bedHour ?? 4
  const bedM = input.bedMinute ?? 0
  const wakeH = input.wakeHour ?? 12
  const wakeM = input.wakeMinute ?? 0

  const samples: Sample[] = []
  const records: ContinuousNightRecord[] = []
  const existingKeys: string[] = []

  for (let i = 0; i < nights; i++) {
    const day = new Date(input.startDay)
    day.setDate(day.getDate() + i)
    const start = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      bedH,
      bedM,
      0,
      0
    )
    const end = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      wakeH,
      wakeM,
      0,
      0
    )
    for (let t = start.getTime(); t <= end.getTime(); t += intervalMs) {
      samples.push({
        timestamp: t,
        isStatic: true,
        magnitude: 1,
        insideHomeGeofence: true,
      })
    }
    // Finalize after wake + grace
    const now = new Date(end.getTime() + NIGHT_FINALIZE_GRACE_MS + 60_000)
    const decided = decideContinuousNightRecord({
      samples,
      existingSleepDayKeys: existingKeys,
      now,
    })
    if (decided) {
      existingKeys.push(decided.sleepDayKey)
      records.push(decided)
    }
  }

  return { samples, records }
}

export const CONTINUOUS_DETECTION_POLICY =
  'MOTION_SAMPLE stays registered forever after motion setup — never unregistered when baseline completes. Static-window detection runs every night in parallel with SCHEDULED_LOCK.'
