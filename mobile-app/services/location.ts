import * as Location from 'expo-location'
import { Linking } from 'react-native'

import {
  classifyLocationPermission,
  type LocationPermissionPhase,
} from './locationPermissionPhase'

export {
  classifyLocationPermission,
  type LocationPermissionPhase,
} from './locationPermissionPhase'

export const LOCATION_PURPOSE =
  'Geofencing for focus sessions — not Phase 1 sleep analytics GPS logs.'

export const BACKGROUND_LOCATION_WHY =
  'Sleep Lock needs background location so geofencing can keep focus sessions honest when the app is not open. Without it, we cannot detect when you leave or return to your lock zone.'

export type LocationPermissionResult = {
  foreground: string
  background: string
  phase: LocationPermissionPhase
  canAskAgainForeground: boolean
  canAskAgainBackground: boolean
}

/**
 * Two-step request required on modern Android/iOS:
 * 1) foreground (When In Use)
 * 2) background (Always) — only after foreground is granted
 */
export async function requestLocationPermissionsTwoStep(): Promise<LocationPermissionResult> {
  const fg = await Location.requestForegroundPermissionsAsync()

  if (fg.status !== 'granted') {
    return {
      foreground: fg.status,
      background: 'undetermined',
      phase: 'foreground_denied',
      canAskAgainForeground: fg.canAskAgain,
      canAskAgainBackground: true,
    }
  }

  const bg = await Location.requestBackgroundPermissionsAsync()

  return {
    foreground: fg.status,
    background: bg.status,
    phase: classifyLocationPermission(fg.status, bg.status),
    canAskAgainForeground: fg.canAskAgain,
    canAskAgainBackground: bg.canAskAgain,
  }
}

export async function getLocationPermissionSnapshot(): Promise<LocationPermissionResult> {
  const fg = await Location.getForegroundPermissionsAsync()
  const bg = await Location.getBackgroundPermissionsAsync()
  return {
    foreground: fg.status,
    background: bg.status,
    phase: classifyLocationPermission(fg.status, bg.status),
    canAskAgainForeground: fg.canAskAgain,
    canAskAgainBackground: bg.canAskAgain,
  }
}

/** Deep-link into OS app settings so the user can enable background location. */
export async function openAppSettings(): Promise<void> {
  // Web / Windows: Linking.openSettings is not available — no-op.
  if (typeof Linking.openSettings !== 'function') {
    console.warn(
      '[openAppSettings] Linking.openSettings is not available on this platform'
    )
    return
  }
  await Linking.openSettings()
}
