/**
 * Step 178 — geofence battery impact (region monitoring, not GPS polling).
 *
 * Home detection MUST use Location.startGeofencingAsync (OS geofencing /
 * CLCircularRegion / GeofencingClient). That is hardware/OS region monitoring —
 * the radio sleeps until the device crosses the fence.
 *
 * FORBIDDEN for the home fence:
 * - Location.watchPositionAsync / startLocationUpdatesAsync loops
 * - setInterval + getCurrentPositionAsync polling
 * Those keep GPS warm and can drain 20%+ overnight.
 *
 * Expected overnight impact with only region monitoring: a few % — comparable
 * to normal standby — not continuous-GPS levels.
 */

/** Documented overnight drain budget (percent of battery). */
export const GEOFENCE_OVERNIGHT_DRAIN_BUDGET_PERCENT = 5

/** Continuous GPS polling would typically exceed this — we must stay under. */
export const GEOFENCE_POLLING_DRAIN_RED_FLAG_PERCENT = 20

export const GEOFENCE_BATTERY_TITLE = 'Home geofence & battery'

export const GEOFENCE_BATTERY_BODY =
  'Sleep Lock watches your home pin with the OS region-monitoring API (not continuous GPS). Overnight drain should stay in the normal few-percent range — not the 20%+ you’d see from a polling location loop.'

export const GEOFENCE_BATTERY_SHORT =
  'Home fence uses OS geofencing (low battery), not GPS polling.'

/** APIs that constitute naive continuous / polling location (banned for HOME_GEOFENCE). */
export const BANNED_HOME_GEOFENCE_LOCATION_APIS = [
  'watchPositionAsync',
  'startLocationUpdatesAsync',
  'watchPosition',
] as const

/** Required region-monitoring entry point. */
export const REQUIRED_HOME_GEOFENCE_API = 'startGeofencingAsync'

/**
 * Pure guard used by contract tests: source must use region API and must not
 * invoke banned continuous-location APIs (comments mentioning them are OK).
 */
export function assertGeofenceUsesRegionMonitoring(source: string): {
  ok: boolean
  reasons: string[]
} {
  const reasons: string[] = []
  if (!source.includes(REQUIRED_HOME_GEOFENCE_API)) {
    reasons.push(`missing ${REQUIRED_HOME_GEOFENCE_API}`)
  }
  for (const banned of BANNED_HOME_GEOFENCE_LOCATION_APIS) {
    // Match real calls: Location.watchPositionAsync( or .watchPositionAsync(
    const call = new RegExp(
      `(?:Location\\.|\\.|\\s)${banned}\\s*\\(`
    )
    if (call.test(source)) {
      reasons.push(`banned continuous API call: ${banned}`)
    }
  }
  // Naive polling patterns around location
  if (
    /setInterval\s*\([^)]*getCurrentPosition|getCurrentPositionAsync[\s\S]{0,80}setInterval/.test(
      source
    )
  ) {
    reasons.push('polling loop with getCurrentPositionAsync')
  }
  return { ok: reasons.length === 0, reasons }
}

/**
 * Classify a measured overnight drain % against the Step 178 budget.
 * Manual overnight test: with geofencing active, expect ≤ budget (few %),
 * never ≥ red-flag (20%+).
 */
export function classifyOvernightGeofenceDrain(percentUsed: number): {
  withinBudget: boolean
  comparableToNormalStandby: boolean
  redFlagContinuousGps: boolean
} {
  const withinBudget = percentUsed <= GEOFENCE_OVERNIGHT_DRAIN_BUDGET_PERCENT
  return {
    withinBudget,
    comparableToNormalStandby: withinBudget,
    redFlagContinuousGps:
      percentUsed >= GEOFENCE_POLLING_DRAIN_RED_FLAG_PERCENT,
  }
}
