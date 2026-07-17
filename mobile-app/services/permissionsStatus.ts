import { Platform } from 'react-native'

import * as lockService from './lockService'
import { getLocationPermissionSnapshot } from './location'
import { getMotionPermissionSnapshot } from './sensors'
import { getNotificationPermissionSnapshot } from './notifications'
import {
  classifyBinaryRow,
  classifyLocationRow,
  classifyMotionRow,
  type PermissionStatusRowModel,
} from './permissionStatusPhase'

export type { PermissionStatusRowModel, PermissionTone } from './permissionStatusPhase'
export { toneGlyph } from './permissionStatusPhase'

/**
 * Snapshot every Sleep Lock permission for the Settings-style checklist (Step 140).
 */
export async function loadPermissionsStatus(): Promise<PermissionStatusRowModel[]> {
  const [location, motion, notifications, deviceOwner, familyControls] =
    await Promise.all([
      getLocationPermissionSnapshot(),
      getMotionPermissionSnapshot(),
      getNotificationPermissionSnapshot(),
      lockService.isDeviceOwner(),
      lockService.hasFamilyControlsEntitlement(),
    ])

  const locationPart = classifyLocationRow(
    location.foreground,
    location.background
  )
  const motionPart = classifyMotionRow(motion.phase)
  const notifPart = classifyBinaryRow(
    notifications.phase === 'granted',
    { ok: 'Allowed', denied: 'Off', undetermined: 'Not Determined' },
    notifications.phase === 'undetermined'
  )

  const rows: PermissionStatusRowModel[] = [
    {
      id: 'location',
      title: 'Location',
      detail: locationPart.detail,
      tone: locationPart.tone,
    },
    {
      id: 'motion',
      title: 'Motion',
      detail: motionPart.detail,
      tone: motionPart.tone,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      detail: notifPart.detail,
      tone: notifPart.tone,
    },
  ]

  if (Platform.OS === 'android' || Platform.OS === 'web') {
    const ownerPart = classifyBinaryRow(deviceOwner, {
      ok: 'Enabled',
      denied: 'Not set',
    })
    rows.push({
      id: 'device-owner',
      title: 'Device Owner',
      detail: ownerPart.detail,
      tone: deviceOwner ? 'ok' : 'warn',
      platformNote: 'Android only',
    })
  }

  if (Platform.OS === 'ios' || Platform.OS === 'web') {
    const familyPart = classifyBinaryRow(familyControls, {
      ok: 'Entitled',
      denied: 'Pending / not in build',
    })
    rows.push({
      id: 'family-controls',
      title: 'Family Controls',
      detail: familyPart.detail,
      tone: familyControls ? 'ok' : 'warn',
      platformNote: 'iOS only',
    })
  }

  return rows
}
