/**
 * Motion sample math (Steps 141–142).
 * Pure helpers stay free of TaskManager so contract tests can run in Node.
 *
 * Expo Accelerometer reports in g (1g ≈ 9.81 m/s²). “Static” is judged by
 * deviation of |a| from gravity, in m/s² — not raw magnitude alone.
 */

export type MotionSample = {
  timestamp: number
  /** |a| in g (Expo units). Still phone ≈ 1. */
  magnitude: number
  /** | |a| − g | in m/s² (Step 142). */
  deviationMs2: number
  /** True when deviationMs2 < STATIC_THRESHOLD. */
  isStatic: boolean
  /**
   * Step 144 — optional home stamp for baseline sleep filter.
   * Live enter/exit from Step 174 HOME_GEOFENCE; null → treated as at-home.
   */
  insideHomeGeofence?: boolean
  x: number
  y: number
  z: number
}

/** Standard gravity (m/s²). */
export const GRAVITY_MS2 = 9.81

/** Expo magnitude unit: 1g. */
export const GRAVITY_G = 1

/**
 * Max allowed deviation from gravity to count as “static” (phone still).
 * Step 142 — m/s².
 */
export const STATIC_THRESHOLD = 0.15

/** Euclidean magnitude of accelerometer reading (Expo units ≈ g). */
export function computeMagnitude(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z)
}

/** Convert |a| from g → m/s². */
export function magnitudeGToMs2(magnitudeG: number): number {
  return magnitudeG * GRAVITY_MS2
}

/**
 * Absolute deviation of sample magnitude from 1g, in m/s².
 * Flat / untouched → near 0; walking → clearly above STATIC_THRESHOLD.
 */
export function deviationFromGravityMs2(magnitudeG: number): number {
  return Math.abs(magnitudeG - GRAVITY_G) * GRAVITY_MS2
}

/** Phone is “static” when deviation from gravity is under STATIC_THRESHOLD. */
export function isStatic(magnitudeG: number): boolean {
  return deviationFromGravityMs2(magnitudeG) < STATIC_THRESHOLD
}

/** Build the derived fields stored on each sample. */
export function classifyMotionMagnitude(magnitudeG: number): {
  deviationMs2: number
  isStatic: boolean
} {
  const deviationMs2 = deviationFromGravityMs2(magnitudeG)
  return {
    deviationMs2,
    isStatic: deviationMs2 < STATIC_THRESHOLD,
  }
}

/** ~8 samples over 2 hours at 15 min = expected local-log cadence. */
export const MOTION_SAMPLE_INTERVAL_SECONDS = 15 * 60

/**
 * Cap local log for continuous detection (Step 197).
 * ≥1 week of 15-min samples: 7 × 24 × 4 = 672; headroom → 1000.
 */
export const MOTION_SAMPLE_LOG_MAX = 1000

/** Alias — Step 197 continuous auto-detection retention. */
export const CONTINUOUS_MOTION_LOG_MAX = MOTION_SAMPLE_LOG_MAX

/**
 * @deprecated Prefer isStatic() — kept as alias for Step 141 still-proxy wording.
 */
export function isLowMagnitudeStillProxy(magnitude: number): boolean {
  return isStatic(magnitude)
}

export function countStaticInWindow(
  samples: MotionSample[],
  windowMs: number,
  now = Date.now()
): number {
  const cutoff = now - windowMs
  return samples.filter((s) => {
    if (s.timestamp < cutoff) return false
    if (typeof s.isStatic === 'boolean') return s.isStatic
    return isStatic(s.magnitude)
  }).length
}

/** @deprecated Prefer countStaticInWindow. */
export function countLowMagnitudeInWindow(
  samples: MotionSample[],
  windowMs: number,
  now = Date.now()
): number {
  return countStaticInWindow(samples, windowMs, now)
}
