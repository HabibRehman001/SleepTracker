import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import {
  classifyNotificationPermission,
  type NotificationPermissionPhase,
} from './notificationPermissionPhase'

export {
  classifyNotificationPermission,
  type NotificationPermissionPhase,
} from './notificationPermissionPhase'

/** Lead time for the pre-lock heads-up (Step 136). */
export const LOCK_WARNING_MINUTES = 30

export const NOTIFICATION_PURPOSE = `Sleep Lock needs notifications to alert you when the phone will lock in ${LOCK_WARNING_MINUTES} minutes.`

export type NotificationPermissionResult = {
  status: string
  phase: NotificationPermissionPhase
  canAskAgain: boolean
  platform: 'android' | 'ios' | 'web' | 'unknown'
}

function platformKind(): NotificationPermissionResult['platform'] {
  if (Platform.OS === 'android') return 'android'
  if (Platform.OS === 'ios') return 'ios'
  if (Platform.OS === 'web') return 'web'
  return 'unknown'
}

/**
 * Request local notification permission for lock countdown alerts.
 * Android 13+ POST_NOTIFICATIONS is covered by expo-notifications + app.json.
 */
export async function requestNotificationPermissions(): Promise<NotificationPermissionResult> {
  const settings = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  })

  return {
    status: settings.status,
    phase: classifyNotificationPermission(settings.status),
    canAskAgain: settings.canAskAgain,
    platform: platformKind(),
  }
}

export async function getNotificationPermissionSnapshot(): Promise<NotificationPermissionResult> {
  const settings = await Notifications.getPermissionsAsync()
  return {
    status: settings.status,
    phase: classifyNotificationPermission(settings.status),
    canAskAgain: settings.canAskAgain,
    platform: platformKind(),
  }
}

/**
 * Schedule (or refresh) the "phone will lock in 30 minutes" local notification.
 * Call once a lock window is known; no-ops if permission not granted.
 */
export async function scheduleLockWarningNotification(
  lockAt: Date
): Promise<string | null> {
  const snap = await getNotificationPermissionSnapshot()
  if (snap.phase !== 'granted') return null

  const warnAt = new Date(lockAt.getTime() - LOCK_WARNING_MINUTES * 60_000)
  if (warnAt.getTime() <= Date.now()) return null

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Sleep Lock',
      body: `Phone will lock in ${LOCK_WARNING_MINUTES} minutes.`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: warnAt,
    },
  })
}
