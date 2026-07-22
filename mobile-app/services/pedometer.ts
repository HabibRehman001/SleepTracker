import { Pedometer } from 'expo-sensors'
import { Platform } from 'react-native'

import {
  localDayBounds,
  startOfLocalDay,
  yesterdayBounds,
} from './pedometerMath'

export {
  endOfLocalDay,
  isFullCalendarDaySpan,
  isPlausibleWholeDayTotal,
  isWithinStepTolerance,
  localDayBounds,
  PEDOMETER_HISTORY_MAX_DAYS,
  PEDOMETER_HISTORY_PURPOSE,
  PEDOMETER_PURPOSE,
  PEDOMETER_STEP_TOLERANCE,
  PLAUSIBLE_SESSION_ONLY_MAX,
  startOfLocalDay,
  yesterdayBounds,
} from './pedometerMath'

export type PedometerSubscription = { remove: () => void }

export type HistoricalDaySteps = {
  daysAgo: number
  start: Date
  end: Date
  steps: number
}

let watchSub: PedometerSubscription | null = null

/** True when OS exposes a hardware / firmware pedometer. */
export async function isPedometerAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  try {
    return await Pedometer.isAvailableAsync()
  } catch {
    return false
  }
}

/**
 * Live session steps since this watch started (not lifetime total).
 * Prefer this over re-deriving steps from Step 141 accelerometer samples.
 */
export function watchLiveStepCount(
  onSteps: (steps: number) => void
): PedometerSubscription {
  stopLiveStepCount()
  const sub = Pedometer.watchStepCount((result) => {
    onSteps(result.steps)
  })
  watchSub = sub
  return sub
}

export function stopLiveStepCount(): void {
  if (watchSub) {
    watchSub.remove()
    watchSub = null
  }
}

export function isLiveStepWatchActive(): boolean {
  return watchSub != null
}

/**
 * Step 182 — OS-level step history between two dates (works when the app
 * was closed). Expo documents iOS Core Motion; Android may throw if the
 * native module does not expose getStepCountAsync.
 */
export async function getStepCountBetween(
  start: Date,
  end: Date
): Promise<number | null> {
  if (Platform.OS === 'web') return null
  if (start.getTime() > end.getTime()) {
    console.warn('[PEDOMETER] start must precede end')
    return null
  }
  const available = await isPedometerAvailable()
  if (!available) return null
  try {
    const result = await Pedometer.getStepCountAsync(start, end)
    return typeof result.steps === 'number' ? result.steps : null
  } catch (err) {
    console.warn('[PEDOMETER] getStepCountAsync failed', err)
    return null
  }
}

/** Steps since local midnight (today so far). */
export async function getTodayStepCount(now = new Date()): Promise<number | null> {
  return getStepCountBetween(startOfLocalDay(now), now)
}

/**
 * Full past calendar-day total from OS history (not “since app launch”).
 * `daysAgo = 1` → yesterday.
 */
export async function getHistoricalDaySteps(
  daysAgo: number,
  now = new Date()
): Promise<HistoricalDaySteps | null> {
  const bounds = localDayBounds(daysAgo, now)
  const steps = await getStepCountBetween(bounds.start, bounds.end)
  if (steps == null) return null
  return {
    daysAgo: bounds.daysAgo,
    start: bounds.start,
    end: bounds.end,
    steps,
  }
}

/** Convenience: yesterday’s whole-day total via getStepCountAsync. */
export async function getYesterdayStepCount(
  now = new Date()
): Promise<HistoricalDaySteps | null> {
  const { start, end } = yesterdayBounds(now)
  const steps = await getStepCountBetween(start, end)
  if (steps == null) return null
  return { daysAgo: 1, start, end, steps }
}
