/**
 * Pure motion-permission phase helpers (no expo imports — testable in Node).
 */

export type MotionPermissionPhase =
  | 'undetermined'
  | 'accelerometer_denied'
  | 'activity_denied'
  | 'granted'

/**
 * Accelerometer first, then pedometer / activity recognition.
 */
export function classifyMotionPermission(
  accelerometer: string,
  activity: string
): MotionPermissionPhase {
  if (accelerometer !== 'granted') {
    return 'accelerometer_denied'
  }
  if (activity !== 'granted') {
    return 'activity_denied'
  }
  return 'granted'
}
