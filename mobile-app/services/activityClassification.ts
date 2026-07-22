/**
 * Step 183 — basic activity type from step cadence (steps/minute).
 * Personal-use thresholds; not a full ML model.
 */

export type ActivityType = 'walk' | 'jog' | 'run'

/** Below this → walk; below RUN → jog; else run. */
export const JOG_CADENCE_MIN = 100
export const RUN_CADENCE_MIN = 150

export const ACTIVITY_CLASSIFY_PURPOSE =
  'Activity type from step cadence (steps/min): walk under 100, jog under 150, else run.'

/**
 * Classify walk / jog / run from instantaneous or windowed cadence.
 */
export function classifyActivity(stepsPerMinute: number): ActivityType {
  if (!Number.isFinite(stepsPerMinute) || stepsPerMinute < 0) {
    return 'walk'
  }
  if (stepsPerMinute < JOG_CADENCE_MIN) return 'walk'
  if (stepsPerMinute < RUN_CADENCE_MIN) return 'jog'
  return 'run'
}

/**
 * Cadence from a step delta over an elapsed window (ms).
 * Returns null if the window is too short to be meaningful.
 */
export function cadenceFromStepDelta(
  stepDelta: number,
  elapsedMs: number,
  minWindowMs = 5_000
): number | null {
  if (!Number.isFinite(stepDelta) || !Number.isFinite(elapsedMs)) return null
  if (stepDelta < 0 || elapsedMs < minWindowMs) return null
  const minutes = elapsedMs / 60_000
  if (minutes <= 0) return null
  return stepDelta / minutes
}
