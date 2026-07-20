/**
 * Night detection outcome (Step 146) — failed nights must not corrupt baseline.
 */

import {
  findLongestSleepWindow,
  type Sample,
  type StaticWindow,
} from './staticWindow'
import type { MotionSample } from './motionSampleMath'

/** Minimum clean static window to accept a night without manual entry. */
export const MIN_VALID_DETECTION_MS = 5 * 60 * 60 * 1000

export const FAILED_DETECTION_PROMPT =
  "We couldn't detect last night's sleep — want to enter it manually?"

export type NightDetectionOk = {
  status: 'ok'
  window: StaticWindow
  shouldPromptManualEntry: false
}

export type NightDetectionFailed = {
  status: 'failed'
  reason: 'no_clean_window'
  shouldPromptManualEntry: true
  /** Longest static run found (may be short / fragmented). */
  longestStaticMs: number
}

export type NightDetectionResult = NightDetectionOk | NightDetectionFailed

/**
 * Evaluate one night of samples for baseline.
 * No window ≥5h (at home, in night window) → failed → prompt manual entry.
 * Does not invent / guess a window.
 */
export function evaluateNightDetection(
  samples: Array<Sample | MotionSample>
): NightDetectionResult {
  const window = findLongestSleepWindow(samples, {
    minDurationMs: MIN_VALID_DETECTION_MS,
  })
  if (window) {
    return {
      status: 'ok',
      window,
      shouldPromptManualEntry: false,
    }
  }
  return {
    status: 'failed',
    reason: 'no_clean_window',
    shouldPromptManualEntry: true,
    longestStaticMs: longestStaticRunMs(samples),
  }
}

/** Longest consecutive static span (ignores home/night filters) — for diagnostics. */
export function longestStaticRunMs(
  samples: Array<Sample | MotionSample>
): number {
  if (!samples.length) return 0
  const sorted = [...samples].sort((a, b) => a.timestamp - b.timestamp)
  let best = 0
  let runStart: number | null = null
  let runEnd: number | null = null
  const gapMs = 30 * 60 * 1000

  const isStatic = (s: Sample | MotionSample) => {
    if ('isStatic' in s && typeof s.isStatic === 'boolean') return s.isStatic
    return false
  }

  const flush = () => {
    if (runStart != null && runEnd != null) {
      best = Math.max(best, runEnd - runStart)
    }
    runStart = null
    runEnd = null
  }

  for (const s of sorted) {
    if (!isStatic(s)) {
      flush()
      continue
    }
    if (runStart == null || runEnd == null) {
      runStart = s.timestamp
      runEnd = s.timestamp
      continue
    }
    if (s.timestamp - runEnd > gapMs) {
      flush()
      runStart = s.timestamp
      runEnd = s.timestamp
      continue
    }
    runEnd = s.timestamp
  }
  flush()
  return best
}

/** Build a DetectedSleepWindow from manual HH:MM on a given local morning. */
export function manualNightToWindow(
  bedtimeHHMM: string,
  waketimeHHMM: string,
  /** Calendar day of the wake (morning after). */
  wakeDate: Date = new Date()
): { start: Date; end: Date } {
  const [bh, bm] = bedtimeHHMM.split(':').map(Number)
  const [wh, wm] = waketimeHHMM.split(':').map(Number)
  const end = new Date(wakeDate)
  end.setHours(wh, wm, 0, 0)
  const start = new Date(end)
  start.setHours(bh, bm, 0, 0)
  // Bed after wake on clock → bed was previous calendar day
  if (start.getTime() >= end.getTime()) {
    start.setDate(start.getDate() - 1)
  }
  return { start, end }
}

export function isValidHHMM(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim())
}
