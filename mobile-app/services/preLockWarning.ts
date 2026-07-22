/**
 * Step 154 — fire one local “Phone locks in 30 minutes” notification.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'

import * as lockService from './lockService'
import { loadHomeArrivalTime } from './homeArrival'
import {
  getNotificationPermissionSnapshot,
} from './notifications'
import {
  decidePreLockWarning,
  LOCK_WARNING_MINUTES,
  PRE_LOCK_WARNING_BODY,
  PRE_LOCK_WARNING_TITLE,
  runPreLockWarningOnce as runPreLockWarningOncePure,
  type PreLockWarningRunResult,
} from './preLockWarningMath'
import { computeDynamicLockWarningTrigger } from './dynamicLockWarningMath'
import { loadEnforcedSchedule } from './scheduledLock'

export const PRE_LOCK_WARNED_STORAGE_KEY = '@sleep_lock/pre_lock_warned_id'

export type { PreLockWarningRunResult }
export { LOCK_WARNING_MINUTES, PRE_LOCK_WARNING_BODY, PRE_LOCK_WARNING_TITLE }

async function loadLastWarnedId(): Promise<string | null> {
  return AsyncStorage.getItem(PRE_LOCK_WARNED_STORAGE_KEY)
}

async function saveLastWarnedId(id: string): Promise<void> {
  await AsyncStorage.setItem(PRE_LOCK_WARNED_STORAGE_KEY, id)
}

async function presentPreLockWarning(body: string): Promise<void> {
  const snap = await getNotificationPermissionSnapshot()
  if (snap.phase !== 'granted') return
  await Notifications.scheduleNotificationAsync({
    content: {
      title: PRE_LOCK_WARNING_TITLE,
      body,
      sound: true,
    },
    trigger: null,
  })
}

/**
 * One background-fetch cycle: warn within 30 min of *effective* lockTime
 * (Step 176 — Math.max(scheduledSleep, geofenceArrival + GRACE_MINUTES)).
 */
export async function runPreLockWarningOnce(
  now: Date = new Date()
): Promise<PreLockWarningRunResult> {
  return runPreLockWarningOncePure(now, {
    loadSchedule: async () => {
      const s = await loadEnforcedSchedule()
      if (!s) return null
      return {
        sleepTime: s.sleepTime,
        wakeTime: s.wakeTime,
        lockedIn: s.lockedIn,
      }
    },
    isLocked: () => lockService.isLocked(),
    loadHomeArrival: () => loadHomeArrivalTime(),
    loadLastWarnedId,
    saveLastWarnedId,
    presentWarning: presentPreLockWarning,
  })
}

/**
 * Step 176 — compute warning trigger from geofence-persisted arrival.
 * Same formula as lock; used for diagnostics / UI.
 */
export async function getDynamicLockWarningTrigger(now: Date = new Date()) {
  const schedule = await loadEnforcedSchedule()
  if (!schedule?.lockedIn) return null
  const homeArrivalTime = await loadHomeArrivalTime()
  const currentlyLocked = await lockService.isLocked()
  const lastWarnedOccurrenceId = await loadLastWarnedId()
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

// Keep decidePreLockWarning available for tests that import via this module.
export { decidePreLockWarning }
