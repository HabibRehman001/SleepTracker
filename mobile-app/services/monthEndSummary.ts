/**
 * Step 186 — schedule local notification on the 1st of each month.
 */
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import { getNotificationPermissionSnapshot } from './notifications'
import {
  MONTH_END_SUMMARY_NOTIFICATION_ID,
  MONTH_END_SUMMARY_TITLE,
  monthEndSummaryBody,
  nextMonthEndSummaryFireAt,
} from './monthEndSummaryMath'

export {
  MONTH_END_SUMMARY_DAY,
  MONTH_END_SUMMARY_HOUR,
  MONTH_END_SUMMARY_MINUTE,
  MONTH_END_SUMMARY_NOTIFICATION_ID,
  MONTH_END_SUMMARY_TITLE,
  isFirstOfMonth,
  monthEndSummaryBody,
  nextMonthEndSummaryFireAt,
  reportMonthName,
} from './monthEndSummaryMath'

/**
 * Cancel any prior month-end summary, then schedule the next 1st with the
 * prior-month name in the body (e.g. 1 July → "…for June is ready.").
 * Call again on app launch / after notification permission so the next
 * occurrence always has the right month name.
 */
export async function syncMonthEndSummaryNotification(
  now = new Date()
): Promise<string | null> {
  if (Platform.OS === 'web') return null

  const snap = await getNotificationPermissionSnapshot()
  if (snap.phase !== 'granted') return null

  await cancelMonthEndSummaryNotification()

  const fireAt = nextMonthEndSummaryFireAt(now)
  const body = monthEndSummaryBody(fireAt)

  try {
    const id = await Notifications.scheduleNotificationAsync({
      identifier: MONTH_END_SUMMARY_NOTIFICATION_ID,
      content: {
        title: MONTH_END_SUMMARY_TITLE,
        body,
        sound: true,
        data: {
          type: 'month-end-summary',
          fireAt: fireAt.toISOString(),
          reportMonth: body,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
      },
    })
    return id
  } catch (err) {
    console.warn('[MONTH_END_SUMMARY] schedule failed', err)
    return null
  }
}

export async function cancelMonthEndSummaryNotification(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(
      MONTH_END_SUMMARY_NOTIFICATION_ID
    )
  } catch {
    // ignore missing id
  }
}
