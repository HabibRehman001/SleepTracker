/**
 * Background task names + MOTION_SAMPLE / SCHEDULED_LOCK registration.
 * TaskManager.defineTask MUST run in global scope (imported early from _layout).
 */
import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
import { Platform } from 'react-native'

import {
  MOTION_SAMPLE_INTERVAL_SECONDS,
  runMotionSampleOnce,
} from './motionSample'
import {
  runScheduledLockOnce,
  SCHEDULED_LOCK_INTERVAL_SECONDS,
} from './scheduledLock'
import { runPreLockWarningOnce } from './preLockWarning'
// Step 174 — TaskManager.defineTask('HOME_GEOFENCE') in global scope.
import './homeGeofence'

export const BACKGROUND_TASKS = {
  /** Periodic accel magnitude proxy — “is the phone still?” (Step 141). */
  motionSample: 'MOTION_SAMPLE',
  /**
   * Steps 152–154 — clock vs sleep/wake; enable/disable lock + pre-lock warning.
   * ~15 min on iOS BackgroundFetch; nearer-immediate once Step 158 FGS lands.
   */
  scheduledLock: 'SCHEDULED_LOCK',
  /** Periodic check while app is backgrounded (legacy alias name). */
  focusFetch: 'SLEEP_LOCK_FOCUS_FETCH',
  /** Location / geofence updates (Step 174 — HOME_GEOFENCE via expo-location). */
  geofence: 'HOME_GEOFENCE',
} as const

export type BackgroundTaskName =
  (typeof BACKGROUND_TASKS)[keyof typeof BACKGROUND_TASKS]

const MOTION_SAMPLE = BACKGROUND_TASKS.motionSample
const SCHEDULED_LOCK = BACKGROUND_TASKS.scheduledLock

TaskManager.defineTask(MOTION_SAMPLE, async () => {
  try {
    await runMotionSampleOnce()
    return BackgroundFetch.BackgroundFetchResult.NewData
  } catch (err) {
    console.warn('[MOTION_SAMPLE] failed', err)
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

TaskManager.defineTask(SCHEDULED_LOCK, async () => {
  try {
    const warning = await runPreLockWarningOnce()
    if (warning.fired) {
      console.log('[SCHEDULED_LOCK] pre-lock warning —', warning.occurrenceId)
    }
    const result = await runScheduledLockOnce()
    if (result.enabled) {
      console.log('[SCHEDULED_LOCK] enableLock() — sleep window reached')
    }
    if (result.disabled) {
      console.log('[SCHEDULED_LOCK] disableLock() — past wakeTime')
    }
    return result.enabled || result.disabled || warning.fired
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData
  } catch (err) {
    console.warn('[SCHEDULED_LOCK] failed', err)
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

export async function isMotionSampleTaskRegistered(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  return TaskManager.isTaskRegisteredAsync(MOTION_SAMPLE)
}

export async function isScheduledLockTaskRegistered(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  return TaskManager.isTaskRegisteredAsync(SCHEDULED_LOCK)
}

async function canRegisterBackgroundFetch(
  label: string
): Promise<boolean> {
  if (Platform.OS === 'web') return false
  const status = await BackgroundFetch.getStatusAsync()
  if (
    status === BackgroundFetch.BackgroundFetchStatus.Denied ||
    status === BackgroundFetch.BackgroundFetchStatus.Restricted
  ) {
    console.warn(`[${label}] BackgroundFetch unavailable:`, status)
    return false
  }
  return true
}

/**
 * Register 15-minute background fetch for MOTION_SAMPLE.
 * Safe to call repeatedly — no-ops if already registered or unsupported.
 */
export async function registerMotionSampleTask(): Promise<boolean> {
  if (!(await canRegisterBackgroundFetch('MOTION_SAMPLE'))) return false

  const already = await TaskManager.isTaskRegisteredAsync(MOTION_SAMPLE)
  if (already) return true

  await BackgroundFetch.registerTaskAsync(MOTION_SAMPLE, {
    minimumInterval: MOTION_SAMPLE_INTERVAL_SECONDS,
    stopOnTerminate: false,
    startOnBoot: true,
  })
  return true
}

export async function unregisterMotionSampleTask(): Promise<void> {
  if (Platform.OS === 'web') return
  const already = await TaskManager.isTaskRegisteredAsync(MOTION_SAMPLE)
  if (!already) return
  await BackgroundFetch.unregisterTaskAsync(MOTION_SAMPLE)
}

/**
 * Step 152 — register SCHEDULED_LOCK background fetch (~15 min).
 */
export async function registerScheduledLockTask(): Promise<boolean> {
  if (!(await canRegisterBackgroundFetch('SCHEDULED_LOCK'))) return false

  const already = await TaskManager.isTaskRegisteredAsync(SCHEDULED_LOCK)
  if (already) return true

  await BackgroundFetch.registerTaskAsync(SCHEDULED_LOCK, {
    minimumInterval: SCHEDULED_LOCK_INTERVAL_SECONDS,
    stopOnTerminate: false,
    startOnBoot: true,
  })
  return true
}

export async function unregisterScheduledLockTask(): Promise<void> {
  if (Platform.OS === 'web') return
  const already = await TaskManager.isTaskRegisteredAsync(SCHEDULED_LOCK)
  if (!already) return
  await BackgroundFetch.unregisterTaskAsync(SCHEDULED_LOCK)
}
