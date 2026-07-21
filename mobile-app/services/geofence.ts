/**
 * Home geofence helpers (Step 144; enter/exit events land in Step 174).
 * Pure distance math — no Expo imports so Node contracts can run.
 */

/** Default home geofence radius (meters). */
export const HOME_GEOFENCE_RADIUS_METERS = 100

export type LatLng = {
  latitude: number
  longitude: number
}

const EARTH_RADIUS_M = 6_371_000

/** Haversine distance between two WGS84 points, in meters. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function isInsideHomeGeofence(
  point: LatLng,
  home: LatLng,
  radiusMeters = HOME_GEOFENCE_RADIUS_METERS
): boolean {
  return distanceMeters(point, home) <= radiusMeters
}

/**
 * Last known “inside home geofence” flag.
 * Step 174/175 geofence task updates this; enter → recordHomeArrival (Step 155).
 */
let lastInsideHomeGeofence: boolean | null = null

export function setHomeGeofenceState(inside: boolean): void {
  lastInsideHomeGeofence = inside
}

export function getHomeGeofenceState(): boolean | null {
  return lastInsideHomeGeofence
}

export function clearHomeGeofenceState(): void {
  lastInsideHomeGeofence = null
}

/** Resolve inside/outside from coords + home, or fall back to last known state. */
export function resolveInsideHomeGeofence(options: {
  latitude?: number | null
  longitude?: number | null
  homeLatitude?: number | null
  homeLongitude?: number | null
  radiusMeters?: number
}): boolean | null {
  const {
    latitude,
    longitude,
    homeLatitude,
    homeLongitude,
    radiusMeters = HOME_GEOFENCE_RADIUS_METERS,
  } = options
  if (
    latitude != null &&
    longitude != null &&
    homeLatitude != null &&
    homeLongitude != null
  ) {
    return isInsideHomeGeofence(
      { latitude, longitude },
      { latitude: homeLatitude, longitude: homeLongitude },
      radiusMeters
    )
  }
  return getHomeGeofenceState()
}
