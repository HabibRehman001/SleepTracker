/**
 * Longest static window per day / night (Step 143).
 * Pure — no Expo imports so contract tests run in Node.
 *
 * Sleep heuristic: consecutive static samples lasting 6–8h (soft max ~9h for
 * clock skew), inside a generous “night” window (22:00 → 20:00 next day) so
 * night-shift sleep (e.g. 04:15–12:20) still counts.
 */

import {
  isStatic as isStaticMagnitude,
  MOTION_SAMPLE_INTERVAL_SECONDS,
  type MotionSample,
} from './motionSampleMath'

/** Minimal sample shape for window detection. */
export type Sample = {
  timestamp: number
  isStatic?: boolean
  magnitude?: number
  /**
   * Step 144 — true when the device was inside the home geofence at sample time.
   * Missing / false → cannot count toward sleep (avoids desk / car / friend’s house).
   */
  insideHomeGeofence?: boolean
  latitude?: number
  longitude?: number
}

export type StaticWindow = {
  start: Date
  end: Date
}

/** Sleep-like static duration: at least 6 hours. */
export const MIN_STATIC_SLEEP_MS = 6 * 60 * 60 * 1000

/**
 * Soft upper bound (~9h) so an 8h05 block (04:15–12:20) still qualifies as
 * “about 6–8 hours” without rejecting slightly long nights.
 */
export const MAX_STATIC_SLEEP_MS = 9 * 60 * 60 * 1000

/** Night window start hour (local) — inclusive. */
export const NIGHT_WINDOW_START_HOUR = 22

/** Night window end hour next calendar span (local) — exclusive. */
export const NIGHT_WINDOW_END_HOUR = 20

/**
 * Gap larger than this breaks a consecutive static run.
 * Default: 2× the 15-min sample interval.
 */
export const STATIC_RUN_GAP_MS = MOTION_SAMPLE_INTERVAL_SECONDS * 2 * 1000

export type FindLongestStaticWindowOptions = {
  minDurationMs?: number
  maxDurationMs?: number
  nightStartHour?: number
  nightEndHour?: number
  maxGapMs?: number
  /**
   * Step 144 — when true, every sample in the run must have
   * insideHomeGeofence === true (whole window at home).
   */
  requireAtHome?: boolean
}

function sampleIsStatic(s: Sample): boolean {
  if (typeof s.isStatic === 'boolean') return s.isStatic
  if (typeof s.magnitude === 'number') return isStaticMagnitude(s.magnitude)
  return false
}

/**
 * Generous night window for shift workers: from 22:00 through 20:00 the next
 * calendar stretch (i.e. local minutes ≥ 22:00 OR < 20:00).
 * 20:00–21:59 is the short “day” gap outside the window.
 */
export function isInNightWindow(
  timestamp: number,
  nightStartHour = NIGHT_WINDOW_START_HOUR,
  nightEndHour = NIGHT_WINDOW_END_HOUR
): boolean {
  const d = new Date(timestamp)
  const minutes = d.getHours() * 60 + d.getMinutes()
  const startM = nightStartHour * 60
  const endM = nightEndHour * 60
  return minutes >= startM || minutes < endM
}

type StaticRun = {
  startMs: number
  endMs: number
  durationMs: number
}

function buildStaticRuns(
  sorted: Sample[],
  maxGapMs: number
): StaticRun[] {
  const runs: StaticRun[] = []
  let runStart: number | null = null
  let runEnd: number | null = null

  const flush = () => {
    if (runStart == null || runEnd == null) return
    runs.push({
      startMs: runStart,
      endMs: runEnd,
      durationMs: runEnd - runStart,
    })
    runStart = null
    runEnd = null
  }

  for (const s of sorted) {
    if (!sampleIsStatic(s)) {
      flush()
      continue
    }
    if (runStart == null || runEnd == null) {
      runStart = s.timestamp
      runEnd = s.timestamp
      continue
    }
    if (s.timestamp - runEnd > maxGapMs) {
      flush()
      runStart = s.timestamp
      runEnd = s.timestamp
      continue
    }
    runEnd = s.timestamp
  }
  flush()
  return runs
}

function samplesCoverRunAtHome(
  sorted: Sample[],
  run: StaticRun
): boolean {
  const inRange = sorted.filter(
    (s) => s.timestamp >= run.startMs && s.timestamp <= run.endMs
  )
  if (!inRange.length) return false
  return inRange.every((s) => s.insideHomeGeofence === true)
}

/**
 * Scan sorted samples, group consecutive static readings, return the longest
 * run that lasts ~6–8h and sits in the night window (22:00–20:00 next day).
 * Pass requireAtHome: true (or use findLongestSleepWindow) to also demand the
 * whole window was inside the home geofence (Step 144).
 */
export function findLongestStaticWindow(
  samples: Sample[] | MotionSample[],
  options: FindLongestStaticWindowOptions = {}
): StaticWindow | null {
  const minDurationMs = options.minDurationMs ?? MIN_STATIC_SLEEP_MS
  const maxDurationMs = options.maxDurationMs ?? MAX_STATIC_SLEEP_MS
  const nightStartHour = options.nightStartHour ?? NIGHT_WINDOW_START_HOUR
  const nightEndHour = options.nightEndHour ?? NIGHT_WINDOW_END_HOUR
  const maxGapMs = options.maxGapMs ?? STATIC_RUN_GAP_MS
  const requireAtHome = options.requireAtHome ?? false

  if (!samples.length) return null

  const sorted = [...samples].sort((a, b) => a.timestamp - b.timestamp)
  const runs = buildStaticRuns(sorted, maxGapMs)

  let best: StaticRun | null = null
  for (const run of runs) {
    if (run.durationMs < minDurationMs) continue
    if (run.durationMs > maxDurationMs) continue
    // Midpoint (and start) must sit in the generous night window.
    const mid = run.startMs + Math.floor(run.durationMs / 2)
    if (!isInNightWindow(run.startMs, nightStartHour, nightEndHour)) continue
    if (!isInNightWindow(mid, nightStartHour, nightEndHour)) continue
    if (requireAtHome && !samplesCoverRunAtHome(sorted, run)) continue
    if (!best || run.durationMs > best.durationMs) best = run
  }

  if (!best) return null
  return { start: new Date(best.startMs), end: new Date(best.endMs) }
}

/**
 * Step 144 sleep detection: longest static night window that is entirely at home.
 * Reduces false positives from desks, cars, and friend’s-house stillness.
 */
export function findLongestSleepWindow(
  samples: Sample[] | MotionSample[],
  options: Omit<FindLongestStaticWindowOptions, 'requireAtHome'> = {}
): StaticWindow | null {
  return findLongestStaticWindow(samples, { ...options, requireAtHome: true })
}

/** Build evenly spaced static (or active) samples for tests / fixtures. */
export function synthesizeSamples(
  startMs: number,
  endMs: number,
  intervalMs: number,
  staticFlag: boolean,
  extras: Partial<Pick<Sample, 'insideHomeGeofence' | 'latitude' | 'longitude'>> = {}
): Sample[] {
  const out: Sample[] = []
  const push = (t: number) => {
    out.push({
      timestamp: t,
      isStatic: staticFlag,
      magnitude: staticFlag ? 1 : 1.4,
      ...extras,
    })
  }
  for (let t = startMs; t <= endMs; t += intervalMs) {
    push(t)
  }
  // Always include endMs when it falls between grid points (e.g. 12:20 after 12:15).
  if (out.length === 0 || out[out.length - 1].timestamp !== endMs) {
    push(endMs)
  }
  return out
}
