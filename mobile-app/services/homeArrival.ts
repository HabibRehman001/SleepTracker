/**
 * Step 155 / stub for Step 175 — record “arrived home” for late-arrival lock shift.
 * In-memory + optional AsyncStorage bridge used by background SCHEDULED_LOCK.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  clearHomeGeofenceState,
  getHomeGeofenceState,
  setHomeGeofenceState,
} from './geofence'

export const HOME_ARRIVAL_STORAGE_KEY = '@sleep_lock/home_arrival_iso'

let lastHomeArrivalIso: string | null = null

/** Step 175 enter-home event should call this (also wired from geofence false→true). */
export function recordHomeArrival(at: Date = new Date()): Date {
  lastHomeArrivalIso = at.toISOString()
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
}

/**
 * Geofence transition helper — enter home records arrival; exit clears for next cycle.
 * Step 175 will drive this from the real geofence task.
 */
export function applyHomeGeofenceTransition(
  inside: boolean,
  at: Date = new Date()
): void {
  const prev = getHomeGeofenceState()
  if (inside && prev !== true) {
    recordHomeArrival(at)
  } else if (!inside) {
    setHomeGeofenceState(false)
    // Keep lastHomeArrival for tonight's lock shift until wake/clear.
  } else {
    setHomeGeofenceState(inside)
  }
}

export async function persistHomeArrival(at: Date | null): Promise<void> {
  if (!at) {
    lastHomeArrivalIso = null
    await AsyncStorage.removeItem(HOME_ARRIVAL_STORAGE_KEY)
    return
  }
  lastHomeArrivalIso = at.toISOString()
  await AsyncStorage.setItem(HOME_ARRIVAL_STORAGE_KEY, lastHomeArrivalIso)
}

export async function loadHomeArrivalTime(): Promise<Date | null> {
  const raw =
    lastHomeArrivalIso ??
    (await AsyncStorage.getItem(HOME_ARRIVAL_STORAGE_KEY))
  if (!raw) return null
  lastHomeArrivalIso = raw
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function syncHomeArrivalFromGeofenceEnter(
  at: Date = new Date()
): Promise<Date> {
  const recorded = recordHomeArrival(at)
  await persistHomeArrival(recorded)
  return recorded
}

export { clearHomeGeofenceState }
