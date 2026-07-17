/**
 * Pure location-permission phase helpers (no expo imports — testable in Node).
 */

export type LocationPermissionPhase =
  | 'undetermined'
  | 'foreground_denied'
  | 'background_denied'
  | 'granted'

/**
 * Classify FG + BG statuses into a UI phase.
 * Background is only meaningful after foreground is granted.
 */
export function classifyLocationPermission(
  foreground: string,
  background: string
): LocationPermissionPhase {
  if (foreground !== 'granted') {
    return 'foreground_denied'
  }
  if (background !== 'granted') {
    return 'background_denied'
  }
  return 'granted'
}
