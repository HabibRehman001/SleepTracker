/**
 * Step 204 — schedule Monday week-start summary notification → deep link.
 */
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import { getNotificationPermissionSnapshot } from './notifications'
import {
  WEEK_START_SUMMARY_DEEP_LINK,
  WEEK_START_SUMMARY_NOTIFICATION_BODY,
  WEEK_START_SUMMARY_NOTIFICATION_ID,
  WEEK_START_SUMMARY_ROUTE,
  WEEK_START_SUMMARY_TITLE,
  WEEK_START_SUMMARY_TYPE,
  nextWeekStartFireAt,
} from './weekStartSummaryMath'

export {
  WEEK_START_DAY,
  WEEK_START_SUMMARY_DEEP_LINK,
  WEEK_START_SUMMARY_HOUR,
  WEEK_START_SUMMARY_MINUTE,
  WEEK_START_SUMMARY_NOTIFICATION_BODY,
  WEEK_START_SUMMARY_NOTIFICATION_ID,
  WEEK_START_SUMMARY_ROUTE,
  WEEK_START_SUMMARY_TITLE,
  WEEK_START_SUMMARY_TYPE,
  buildWeekStartInsight,
  hasPassedWeekStartFire,
  isWeekStartDay,
  nextWeekStartFireAt,
} from './weekStartSummaryMath'

/**
 * Cancel prior week-start summary, schedule next Monday 09:00 with deep link.
 * Re-call on launch / after notification permission (and after clock changes in test builds).
 */
export async function syncWeekStartSummaryNotification(
  now = new Date()
): Promise<string | null> {
  if (Platform.OS === 'web') return null

  const snap = await getNotificationPermissionSnapshot()
  if (snap.phase !== 'granted') return null

  await cancelWeekStartSummaryNotification()

  const fireAt = nextWeekStartFireAt(now)

  try {
    const id = await Notifications.scheduleNotificationAsync({
      identifier: WEEK_START_SUMMARY_NOTIFICATION_ID,
      content: {
        title: WEEK_START_SUMMARY_TITLE,
        body: WEEK_START_SUMMARY_NOTIFICATION_BODY,
        sound: true,
        data: {
          type: WEEK_START_SUMMARY_TYPE,
          url: WEEK_START_SUMMARY_ROUTE,
          deepLink: WEEK_START_SUMMARY_DEEP_LINK,
          fireAt: fireAt.toISOString(),
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
      },
    })
    return id
  } catch (err) {
    console.warn('[WEEK_START_SUMMARY] schedule failed', err)
    return null
  }
}

export async function cancelWeekStartSummaryNotification(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(
      WEEK_START_SUMMARY_NOTIFICATION_ID
    )
  } catch {
    // ignore missing id
  }
}

/** True when a notification response should open the week-start screen. */
export function isWeekStartSummaryNotificationData(
  data: Record<string, unknown> | undefined | null
): boolean {
  if (!data) return false
  return (
    data.type === WEEK_START_SUMMARY_TYPE ||
    data.url === WEEK_START_SUMMARY_ROUTE ||
    data.deepLink === WEEK_START_SUMMARY_DEEP_LINK
  )
}
