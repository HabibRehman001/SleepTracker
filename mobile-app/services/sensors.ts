import { Accelerometer, Pedometer } from 'expo-sensors'
import { Platform } from 'react-native'

import {
  classifyMotionPermission,
  type MotionPermissionPhase,
} from './motionPermissionPhase'

export {
  classifyMotionPermission,
  type MotionPermissionPhase,
} from './motionPermissionPhase'

export const SENSOR_PACKAGES = {
  accelerometer: 'expo-sensors',
  pedometer: 'expo-sensors',
} as const

export const MOTION_PURPOSE =
  'Sleep Lock uses motion and step data to learn your activity baseline during the 2-day setup — not for cloud tracking.'

export const ACTIVITY_RECOGNITION_WHY =
  Platform.select({
    android:
      'Android needs the Activity Recognition permission (ACTIVITY_RECOGNITION) so we can count steps for your sleep baseline.',
    ios: 'iOS needs Core Motion authorization so the pedometer can count steps for your sleep baseline.',
    default:
      'Step counting needs motion / activity recognition permission on this device.',
  }) ?? 'Step counting needs motion / activity recognition permission.'

export type MotionPermissionResult = {
  accelerometer: string
  activity: string
  phase: MotionPermissionPhase
  pedometerAvailable: boolean
  canAskAgainAccelerometer: boolean
  canAskAgainActivity: boolean
  platform: 'android' | 'ios' | 'web' | 'unknown'
}

function platformKind(): MotionPermissionResult['platform'] {
  if (Platform.OS === 'android') return 'android'
  if (Platform.OS === 'ios') return 'ios'
  if (Platform.OS === 'web') return 'web'
  return 'unknown'
}

/**
 * Step 135 — request motion sensors then activity / steps:
 * 1) Accelerometer (DeviceSensor permissions; web needs a user gesture)
 * 2) Pedometer → ACTIVITY_RECOGNITION on Android, Core Motion on iOS
 */
export async function requestMotionPermissions(): Promise<MotionPermissionResult> {
  const accel = await Accelerometer.requestPermissionsAsync()

  if (accel.status !== 'granted') {
    return {
      accelerometer: accel.status,
      activity: 'undetermined',
      phase: 'accelerometer_denied',
      pedometerAvailable: false,
      canAskAgainAccelerometer: accel.canAskAgain,
      canAskAgainActivity: true,
      platform: platformKind(),
    }
  }

  const pedometerAvailable = await Pedometer.isAvailableAsync().catch(() => false)
  const activity = await Pedometer.requestPermissionsAsync()

  return {
    accelerometer: accel.status,
    activity: activity.status,
    phase: classifyMotionPermission(accel.status, activity.status),
    pedometerAvailable,
    canAskAgainAccelerometer: accel.canAskAgain,
    canAskAgainActivity: activity.canAskAgain,
    platform: platformKind(),
  }
}

export async function getMotionPermissionSnapshot(): Promise<MotionPermissionResult> {
  const accel = await Accelerometer.getPermissionsAsync()
  const activity = await Pedometer.getPermissionsAsync()
  const pedometerAvailable = await Pedometer.isAvailableAsync().catch(() => false)

  return {
    accelerometer: accel.status,
    activity: activity.status,
    phase: classifyMotionPermission(accel.status, activity.status),
    pedometerAvailable,
    canAskAgainAccelerometer: accel.canAskAgain,
    canAskAgainActivity: activity.canAskAgain,
    platform: platformKind(),
  }
}
