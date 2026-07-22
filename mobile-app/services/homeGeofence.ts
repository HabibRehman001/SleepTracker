/**
 * Step 174 / 178 — live home geofence (150m) via OS region monitoring.
 * Location.startGeofencingAsync('HOME_GEOFENCE', …) + TaskManager handler.
 * Enter → recordHomeArrival + backend persist (Step 175; feeds Step 155 lock timing).
 *
 * Battery (Step 178): uses region-monitoring only — never watchPositionAsync /
 * startLocationUpdatesAsync / getCurrentPosition polling for the home fence.
 * Expected overnight drain: a few % (normal standby), not 20%+ continuous GPS.
 *
 * TaskManager.defineTask MUST run in global scope — imported from backgroundTasks / _layout.
 */
import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import { Platform } from 'react-native'

import { HOME_GEOFENCE_RADIUS_METERS } from './geofence'
import {
  buildHomeGeofenceRegion,
  HOME_GEOFENCE_TASK,
  interpretHomeGeofenceEvent,
} from './homeGeofenceMath'
import {
  applyHomeGeofenceTransition,
  syncHomeArrivalFromGeofenceEnter,
} from './homeArrival'

export {
  buildHomeGeofenceRegion,
  HOME_GEOFENCE_TASK,
  HOME_GEOFENCE_REGION_ID,
  interpretHomeGeofenceEvent,
  GEOFENCE_EVENT_ENTER,
  GEOFENCE_EVENT_EXIT,
} from './homeGeofenceMath'

export { HOME_GEOFENCE_RADIUS_METERS }

type GeofenceTaskBody = {
  eventType?: number
  region?: { identifier?: string }
}

/**
 * Global-scope geofence task — fires when crossing the 150m home radius.
 */
TaskManager.defineTask(HOME_GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[HOME_GEOFENCE] task error', error.message)
    return
  }
  const body = (data ?? {}) as GeofenceTaskBody
  const eventType = body.eventType
  const transition = interpretHomeGeofenceEvent(eventType)
  if (transition.kind === 'ignore') return

  const at = new Date()
  if (transition.shouldRecordHomeArrival) {
    const recorded = await syncHomeArrivalFromGeofenceEnter(at)
    console.log('[HOME_GEOFENCE] Enter — homeArrival', recorded.toISOString())
    return
  }

  applyHomeGeofenceTransition(false, at)
  console.log('[HOME_GEOFENCE] Exit — outside home')
})

export function isHomeGeofenceTaskDefined(): boolean {
  if (Platform.OS === 'web') return false
  return TaskManager.isTaskDefined(HOME_GEOFENCE_TASK)
}

export async function hasStartedHomeGeofencing(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  return Location.hasStartedGeofencingAsync(HOME_GEOFENCE_TASK)
}

/**
 * Start (or refresh) the 150m home geofence around the saved pin.
 * Uses OS geofencing (Step 178) — not continuous GPS.
 * Safe to call after set-home save or when hydrating an existing home.
 */
export async function startHomeGeofencing(
  latitude: number,
  longitude: number,
  radiusMeters = HOME_GEOFENCE_RADIUS_METERS
): Promise<boolean> {
  if (Platform.OS === 'web') return false

  const fg = await Location.getForegroundPermissionsAsync()
  if (fg.status !== 'granted') {
    console.warn('[HOME_GEOFENCE] foreground location not granted')
    return false
  }

  const region = buildHomeGeofenceRegion(
    { latitude, longitude },
    radiusMeters
  )

  await Location.startGeofencingAsync(HOME_GEOFENCE_TASK, [region])
  console.log(
    '[HOME_GEOFENCE] started',
    region.latitude,
    region.longitude,
    `r=${region.radius}m`
  )
  return true
}

export async function stopHomeGeofencing(): Promise<void> {
  if (Platform.OS === 'web') return
  const started = await Location.hasStartedGeofencingAsync(HOME_GEOFENCE_TASK)
  if (!started) return
  await Location.stopGeofencingAsync(HOME_GEOFENCE_TASK)
  console.log('[HOME_GEOFENCE] stopped')
}

/** Convenience: start if coords present; no-op otherwise. */
export async function syncHomeGeofencing(coords: {
  latitude: number | null
  longitude: number | null
}): Promise<boolean> {
  if (coords.latitude == null || coords.longitude == null) return false
  return startHomeGeofencing(coords.latitude, coords.longitude)
}
