/**
 * Home-arrival helpers (Steps 174–175).
 * Geofence Enter → local record + AsyncStorage + backend session upsert.
 * Feeds Step 155 late-arrival lock timing via loadHomeArrivalTime().
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  clearHomeGeofenceState,
  getHomeGeofenceState,
  setHomeGeofenceState,
} from './geofence'
import {
  formatHomeArrivalHHMM,
  sleepDayDateKey,
} from './homeArrivalMath'
import { persistHomeArrivalToBackend } from './sessionApi'

export const HOME_ARRIVAL_STORAGE_KEY = '@sleep_lock/home_arrival_iso'
export const HOME_ARRIVAL_SLEEP_DAY_KEY = '@sleep_lock/home_arrival_sleep_day'

export {
  formatHomeArrivalHHMM,
  sleepDayDate,
  sleepDayDateKey,
  sleepDayDateBounds,
} from './homeArrivalMath'

let lastHomeArrivalIso: string | null = null
let lastSleepDayKey: string | null = null

/** Stamp arrival in memory + geofence inside flag. */
export function recordHomeArrival(at: Date = new Date()): Date {
  lastHomeArrivalIso = at.toISOString()
  lastSleepDayKey = sleepDayDateKey(at)
  setHomeGeofenceState(true)
  return at
}

export function getHomeArrivalTime(): Date | null {
  if (!lastHomeArrivalIso) return null
  const d = new Date(lastHomeArrivalIso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function clearHomeArrival(): void {
  lastHomeArrivalIso = null
  lastSleepDayKey = null
}

/** Apply enter/exit from HOME_GEOFENCE (or tests). */
export function applyHomeGeofenceTransition(
  inside: boolean,
  at: Date = new Date()
): void {
  const prev = getHomeGeofenceState()
  if (inside && prev !== true) {
    recordHomeArrival(at)
  } else if (!inside) {
    setHomeGeofenceState(false)
  } else {
    setHomeGeofenceState(inside)
  }
}

export async function persistHomeArrival(at: Date | null): Promise<void> {
  if (!at) {
    lastHomeArrivalIso = null
    lastSleepDayKey = null
    await AsyncStorage.multiRemove([
      HOME_ARRIVAL_STORAGE_KEY,
      HOME_ARRIVAL_SLEEP_DAY_KEY,
    ])
    return
  }
  lastHomeArrivalIso = at.toISOString()
  lastSleepDayKey = sleepDayDateKey(at)
  await AsyncStorage.setItem(HOME_ARRIVAL_STORAGE_KEY, lastHomeArrivalIso)
  await AsyncStorage.setItem(HOME_ARRIVAL_SLEEP_DAY_KEY, lastSleepDayKey)
}

export async function loadHomeArrivalTime(): Promise<Date | null> {
  const raw =
    lastHomeArrivalIso ??
    (await AsyncStorage.getItem(HOME_ARRIVAL_STORAGE_KEY))
  if (!raw) return null
  lastHomeArrivalIso = raw
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null

  // Drop stale arrival from a previous sleep day.
  const storedDay =
    lastSleepDayKey ??
    (await AsyncStorage.getItem(HOME_ARRIVAL_SLEEP_DAY_KEY))
  const todayKey = sleepDayDateKey(new Date())
  if (storedDay && storedDay !== todayKey) {
    clearHomeArrival()
    await persistHomeArrival(null)
    return null
  }
  lastSleepDayKey = storedDay ?? sleepDayDateKey(d)
  return d
}

/**
 * Step 174 Enter + Step 175 backend persist for this sleep day's session.
 * Local persist always; backend best-effort (log + keep local on failure).
 */
export async function syncHomeArrivalFromGeofenceEnter(
  at: Date = new Date()
): Promise<Date> {
  const recorded = recordHomeArrival(at)
  await persistHomeArrival(recorded)
  try {
    const result = await persistHomeArrivalToBackend(recorded)
    console.log(
      '[HOME_ARRIVAL] backend',
      result.homeArrivalHHMM ?? formatHomeArrivalHHMM(recorded),
      'sleepDay',
      sleepDayDateKey(recorded)
    )
  } catch (err) {
    console.warn('[HOME_ARRIVAL] backend persist failed', err)
  }
  return recorded
}

export { clearHomeGeofenceState }
