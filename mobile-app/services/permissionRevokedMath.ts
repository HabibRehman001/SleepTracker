/**
 * Step 194 — detect location/motion permissions revoked mid-use.
 * Sticky setup flags must not leave the app silently broken.
 */

import type { LocationPermissionPhase } from './locationPermissionPhase'
import type { MotionPermissionPhase } from './motionPermissionPhase'

export type RevokedPermissionKind = 'location' | 'motion'

export const PERMISSION_REVOKED_TITLE = 'Permission turned off'

export const PERMISSION_REVOKED_LOCATION_BODY =
  'Location access was turned off in system Settings. Sleep Lock needs it for home detection — tap to allow again. The app will not keep working silently without it.'

export const PERMISSION_REVOKED_MOTION_BODY =
  'Motion / activity access was turned off in system Settings. Sleep Lock needs it for your activity baseline — tap to allow again. The app will not keep working silently without it.'

export const PERMISSION_REVOKED_BOTH_BODY =
  'Location and motion permissions were turned off in system Settings. Sleep Lock needs both — tap to re-grant. Features will not continue silently without them.'

export type PermissionRevokeInput = {
  locationSetupDone: boolean
  motionSetupDone: boolean
  locationPhase: LocationPermissionPhase
  motionPhase: MotionPermissionPhase
}

export type PermissionRevokeFinding = {
  revoked: RevokedPermissionKind[]
  /** Clear sticky flags so setup redirects run again. */
  clearLocationSetup: boolean
  clearMotionSetup: boolean
  title: string
  body: string
  /** First screen to send the user to. */
  primaryRoute: '/location-permission' | '/motion-permission'
  /** Stable key for alert de-dupe this session. */
  alertKey: string
}

/**
 * Pure: if setup was marked done but OS permission is no longer granted → revoked.
 */
export function detectRevokedPermissions(
  input: PermissionRevokeInput
): PermissionRevokeFinding | null {
  const revoked: RevokedPermissionKind[] = []

  if (input.locationSetupDone && input.locationPhase !== 'granted') {
    revoked.push('location')
  }
  if (input.motionSetupDone && input.motionPhase !== 'granted') {
    revoked.push('motion')
  }

  if (revoked.length === 0) return null

  const clearLocationSetup = revoked.includes('location')
  const clearMotionSetup = revoked.includes('motion')

  let body = PERMISSION_REVOKED_LOCATION_BODY
  let primaryRoute: PermissionRevokeFinding['primaryRoute'] =
    '/location-permission'
  if (revoked.includes('location') && revoked.includes('motion')) {
    body = PERMISSION_REVOKED_BOTH_BODY
    primaryRoute = '/location-permission'
  } else if (revoked.includes('motion')) {
    body = PERMISSION_REVOKED_MOTION_BODY
    primaryRoute = '/motion-permission'
  }

  return {
    revoked,
    clearLocationSetup,
    clearMotionSetup,
    title: PERMISSION_REVOKED_TITLE,
    body,
    primaryRoute,
    alertKey: revoked.slice().sort().join('+'),
  }
}

/** True when a prior “setup done” flag would leave features dead without a prompt. */
export function wouldSilentlyBreak(
  setupDone: boolean,
  phaseGranted: boolean
): boolean {
  return setupDone && !phaseGranted
}
