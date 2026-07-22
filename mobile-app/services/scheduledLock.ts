/**
 * Steps 152–153 / 155 — persist schedule; background cycle enableLock / disableLock.
 * Loads homeArrivalTime (Step 175) for late-arrival lock shift.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

import { loadHomeArrivalTime } from './homeArrival'
import * as lockService from './lockService'
import {
  runScheduledLockOnce as runScheduledLockOncePure,
  type PersistedEnforcedSchedule,
  type ScheduledLockRunResult,
  SCHEDULED_LOCK_INTERVAL_SECONDS,
  decideScheduledLock,
  isInSleepWindow,
} from './scheduledLockMath'

export const ENFORCED_SCHEDULE_STORAGE_KEY = '@sleep_lock/enforced_schedule'

export type { PersistedEnforcedSchedule, ScheduledLockRunResult }
export {
  decideScheduledLock,
  isInSleepWindow,
  SCHEDULED_LOCK_INTERVAL_SECONDS,
}

/** Write enforced bed/wake for the background SCHEDULED_LOCK task. */
export async function persistEnforcedSchedule(
  schedule: PersistedEnforcedSchedule | null
): Promise<void> {
  if (!schedule || !schedule.lockedIn) {
    await AsyncStorage.removeItem(ENFORCED_SCHEDULE_STORAGE_KEY)
    return
  }
  await AsyncStorage.setItem(
    ENFORCED_SCHEDULE_STORAGE_KEY,
    JSON.stringify({
      sleepTime: schedule.sleepTime,
      wakeTime: schedule.wakeTime,
      lockedIn: true,
    } satisfies PersistedEnforcedSchedule)
  )
}

export async function loadEnforcedSchedule(): Promise<PersistedEnforcedSchedule | null> {
  const raw = await AsyncStorage.getItem(ENFORCED_SCHEDULE_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PersistedEnforcedSchedule
    if (
      typeof parsed.sleepTime !== 'string' ||
      typeof parsed.wakeTime !== 'string' ||
      !parsed.lockedIn
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/**
 * One background-fetch cycle:
 * - at effective lockTime → enableLock()
 * - past wakeTime → disableLock() (Step 153, no user action)
 */
export async function runScheduledLockOnce(
  now: Date = new Date()
): Promise<ScheduledLockRunResult> {
  return runScheduledLockOncePure(now, {
    enableLock: () => lockService.enableLock(),
    disableLock: () => lockService.disableLock(),
    isLocked: () => lockService.isLocked(),
    loadSchedule: () => loadEnforcedSchedule(),
    loadHomeArrival: () => loadHomeArrivalTime(),
  })
}
