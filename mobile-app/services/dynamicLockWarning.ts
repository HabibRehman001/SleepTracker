/**
 * Step 176 — resolve dynamic lock-warning trigger from live geofence arrival.
 * Always loads homeArrival via loadHomeArrivalTime() (written by HOME_GEOFENCE).
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

import { loadHomeArrivalTime } from './homeArrival'
import {
  computeDynamicLockWarningTrigger,
  type DynamicLockWarningTrigger,
} from './dynamicLockWarningMath'
import * as lockService from './lockService'
import { loadEnforcedSchedule } from './scheduledLock'

/** Same key as preLockWarning — avoid circular import. */
const PRE_LOCK_WARNED_STORAGE_KEY = '@sleep_lock/pre_lock_warned_id'

export type { DynamicLockWarningTrigger }
export {
  computeDynamicLockWarningTrigger,
  GRACE_MINUTES,
  effectiveLockTimeMs,
} from './dynamicLockWarningMath'

/**
 * Production path: schedule + geofence-persisted arrival → effectiveLockTime.
 * No mock homeArrival — if the geofence never fired, arrival is null.
 */
export async function resolveDynamicLockWarningTrigger(
  now: Date = new Date()
): Promise<DynamicLockWarningTrigger | null> {
  const schedule = await loadEnforcedSchedule()
  if (!schedule?.lockedIn) return null

  const homeArrivalTime = await loadHomeArrivalTime()
  const currentlyLocked = await lockService.isLocked()
  const lastWarnedOccurrenceId = await AsyncStorage.getItem(
    PRE_LOCK_WARNED_STORAGE_KEY
  )

  return computeDynamicLockWarningTrigger({
    now,
    scheduledSleepHHMM: schedule.sleepTime,
    wakeTimeHHMM: schedule.wakeTime,
    homeArrivalTime,
    currentlyLocked,
    scheduleLockedIn: true,
    lastWarnedOccurrenceId,
  })
}
