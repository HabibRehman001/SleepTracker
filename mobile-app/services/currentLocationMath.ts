/**
 * Step 179 — current location vs home distance helpers (pure).
 */

import {
  distanceMeters,
  HOME_GEOFENCE_RADIUS_METERS,
  type LatLng,
} from './geofence'

export type CurrentLocationSummary = {
  distanceMeters: number
  insideHomeGeofence: boolean
  /** Human label e.g. "120 m from home" / "2.4 km from home". */
  distanceLabel: string
}

/** Format meters for the current-location screen. */
export function formatDistanceFromHome(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return 'Distance unknown'
  if (meters < 1000) {
    return `${Math.round(meters)} m from home`
  }
  const km = meters / 1000
  const rounded = km >= 10 ? km.toFixed(0) : km.toFixed(1)
  return `${rounded} km from home`
}

export function summarizeCurrentVsHome(
  current: LatLng,
  home: LatLng,
  radiusMeters = HOME_GEOFENCE_RADIUS_METERS
): CurrentLocationSummary {
  const d = distanceMeters(current, home)
  return {
    distanceMeters: d,
    insideHomeGeofence: d <= radiusMeters,
    distanceLabel: formatDistanceFromHome(d),
  }
}

/** Region that roughly fits both points (for map framing). */
export function regionFittingPoints(
  a: LatLng,
  b: LatLng,
  padFactor = 1.6
): {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
} {
  const latitude = (a.latitude + b.latitude) / 2
  const longitude = (a.longitude + b.longitude) / 2
  const latDelta = Math.max(0.008, Math.abs(a.latitude - b.latitude) * padFactor)
  const lngDelta = Math.max(
    0.008,
    Math.abs(a.longitude - b.longitude) * padFactor
  )
  return {
    latitude,
    longitude,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  }
}
