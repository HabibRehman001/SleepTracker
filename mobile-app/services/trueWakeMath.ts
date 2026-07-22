/**
 * Step 200 — Filter false wake-ups (brief night glance ≠ morning wake).
 * Pick the earliest unlock near static-window end after which motion stays
 * non-static for a sustained period (real activity resumed).
 */

import {
  isStatic as isStaticMagnitude,
  MOTION_SAMPLE_INTERVAL_SECONDS,
  type MotionSample,
} from './motionSampleMath'
import type { Sample } from './staticWindow'

/** Motion must stay non-static this long after unlock to count as true wake. */
export const TRUE_WAKE_SUSTAINED_ACTIVITY_MS = 20 * 60 * 1000

/**
 * Non-static run must begin within this delay of the unlock.
 * Activity hours later (after falling back asleep) does not validate that unlock.
 */
export const TRUE_WAKE_ACTIVITY_START_GRACE_MS =
  MOTION_SAMPLE_INTERVAL_SECONDS * 2 * 1000

/** Consider unlocks from this far before staticWindowEnd. */
export const TRUE_WAKE_NEAR_LOOKBACK_MS = 12 * 60 * 60 * 1000

/** Consider unlocks up to this far after staticWindowEnd. */
export const TRUE_WAKE_NEAR_FORWARD_MS = 12 * 60 * 60 * 1000

/** Gap larger than this breaks a consecutive non-static run. */
export const TRUE_WAKE_ACTIVITY_GAP_MS =
  MOTION_SAMPLE_INTERVAL_SECONDS * 2 * 1000

function sampleIsStatic(s: Sample | MotionSample): boolean {
  if (typeof s.isStatic === 'boolean') return s.isStatic
  if (typeof s.magnitude === 'number') return isStaticMagnitude(s.magnitude)
  return false
}

/**
 * After unlockMs, does motion stay non-static for ≥ sustainedMs, with that
 * active run starting soon after the unlock (not hours later)?
 * Brief unlock + fall-back-asleep fails when stillness returns first.
 */
export function hasSustainedActivityAfter(
  unlockMs: number,
  samples: Array<Sample | MotionSample>,
  sustainedMs: number = TRUE_WAKE_SUSTAINED_ACTIVITY_MS,
  maxGapMs: number = TRUE_WAKE_ACTIVITY_GAP_MS,
  startGraceMs: number = TRUE_WAKE_ACTIVITY_START_GRACE_MS
): boolean {
  const sorted = [...samples]
    .filter((s) => s.timestamp >= unlockMs)
    .sort((a, b) => a.timestamp - b.timestamp)

  const graceDeadline = unlockMs + startGraceMs
  let runStart: number | null = null
  let lastNonStatic: number | null = null
  let sawNonStaticInGrace = false

  for (const s of sorted) {
    const staticSample = sampleIsStatic(s)

    if (runStart == null) {
      // Still waiting for activity to begin near the unlock.
      if (s.timestamp > graceDeadline) {
        return false
      }
      if (staticSample) {
        // Stillness right after unlock → glance / fall-back-asleep, not true wake.
        return false
      }
      sawNonStaticInGrace = true
      runStart = s.timestamp
      lastNonStatic = s.timestamp
      continue
    }

    // In an active run.
    if (staticSample) {
      // Fell back to stillness before sustaining — false wake.
      return false
    }

    if (lastNonStatic != null && s.timestamp - lastNonStatic > maxGapMs) {
      return false
    }

    lastNonStatic = s.timestamp
    if (lastNonStatic - runStart >= sustainedMs) {
      return true
    }
  }

  if (
    sawNonStaticInGrace &&
    runStart != null &&
    lastNonStatic != null &&
    lastNonStatic - runStart >= sustainedMs
  ) {
    return true
  }

  return false
}

export type FindTrueWakeOptions = {
  sustainedActivityMs?: number
  lookbackMs?: number
  forwardMs?: number
  maxGapMs?: number
  activityStartGraceMs?: number
}

/**
 * Walk unlock events near the end of the static window.
 * Pick the earliest one after which motion samples stay above the static
 * threshold for a sustained period (e.g. 20+ min) — real activity resumed,
 * not just a brief screen check.
 */
export function findTrueWakeEvent(
  unlockEvents: Date[],
  staticWindowEnd: Date,
  samples: Array<Sample | MotionSample>,
  options: FindTrueWakeOptions = {}
): Date | null {
  const endMs = staticWindowEnd.getTime()
  if (!Number.isFinite(endMs)) return null

  const lookback = options.lookbackMs ?? TRUE_WAKE_NEAR_LOOKBACK_MS
  const forward = options.forwardMs ?? TRUE_WAKE_NEAR_FORWARD_MS
  const sustained =
    options.sustainedActivityMs ?? TRUE_WAKE_SUSTAINED_ACTIVITY_MS
  const maxGap = options.maxGapMs ?? TRUE_WAKE_ACTIVITY_GAP_MS
  const grace = options.activityStartGraceMs ?? TRUE_WAKE_ACTIVITY_START_GRACE_MS

  const candidates = unlockEvents
    .map((d) => d.getTime())
    .filter(
      (t) =>
        Number.isFinite(t) &&
        t >= endMs - lookback &&
        t <= endMs + forward
    )
    .sort((a, b) => a - b)

  for (const unlockMs of candidates) {
    if (
      hasSustainedActivityAfter(
        unlockMs,
        samples,
        sustained,
        maxGap,
        grace
      )
    ) {
      return new Date(unlockMs)
    }
  }

  return null
}
