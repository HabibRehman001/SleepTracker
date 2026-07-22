/**
 * Step 174 — pure helpers for home geofence region + enter/exit handling.
 * Kept free of expo-location / TaskManager so Node contract tests can run.
 */

import { HOME_GEOFENCE_RADIUS_METERS, type LatLng } from './geofence'

/** Matches Location.GeofencingEventType.Enter / Exit. */
export const GEOFENCE_EVENT_ENTER = 1
export const GEOFENCE_EVENT_EXIT = 2

export const HOME_GEOFENCE_TASK = 'HOME_GEOFENCE'
export const HOME_GEOFENCE_REGION_ID = 'home'

export type HomeGeofenceRegion = {
  identifier: string
  latitude: number
  longitude: number
  radius: number
  notifyOnEnter: boolean
  notifyOnExit: boolean
}

export function buildHomeGeofenceRegion(
  home: LatLng,
  radiusMeters = HOME_GEOFENCE_RADIUS_METERS
): HomeGeofenceRegion {
  return {
    identifier: HOME_GEOFENCE_REGION_ID,
    latitude: home.latitude,
    longitude: home.longitude,
    radius: radiusMeters,
    notifyOnEnter: true,
    notifyOnExit: true,
  }
}

export type HomeGeofenceTransition = {
  /** Enter → record arrival; Exit → mark outside. */
  kind: 'enter' | 'exit' | 'ignore'
  shouldRecordHomeArrival: boolean
  inside: boolean | null
}

/**
 * Map a geofencing event type to arrival / outside state updates.
 * Physical / emulator cross of the 150m radius should deliver Enter within ~30s.
 */
export function interpretHomeGeofenceEvent(
  eventType: number | null | undefined
): HomeGeofenceTransition {
  if (eventType === GEOFENCE_EVENT_ENTER) {
    return {
      kind: 'enter',
      shouldRecordHomeArrival: true,
      inside: true,
    }
  }
  if (eventType === GEOFENCE_EVENT_EXIT) {
    return {
      kind: 'exit',
      shouldRecordHomeArrival: false,
      inside: false,
    }
  }
  return {
    kind: 'ignore',
    shouldRecordHomeArrival: false,
    inside: null,
  }
}
