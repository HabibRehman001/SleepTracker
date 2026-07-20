/**
 * Background task names + MOTION_SAMPLE registration (Step 141).
 * TaskManager.defineTask MUST run in global scope (imported early from _layout).
 */
import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
import { Platform } from 'react-native'

import {
  MOTION_SAMPLE_INTERVAL_SECONDS,
  runMotionSampleOnce,
} from './motionSample'

export const BACKGROUND_TASKS = {
  /** Periodic accel magnitude proxy — “is the phone still?” (Step 141). */
  motionSample: 'MOTION_SAMPLE',
  /** Periodic check while app is backgrounded */
  focusFetch: 'SLEEP_LOCK_FOCUS_FETCH',
  /** Location / geofence updates */
  geofence: 'SLEEP_LOCK_GEOFENCE',
} as const

export type BackgroundTaskName =
  (typeof BACKGROUND_TASKS)[keyof typeof BACKGROUND_TASKS]

const MOTION_SAMPLE = BACKGROUND_TASKS.motionSample

TaskManager.defineTask(MOTION_SAMPLE, async () => {
  try {
    // Prompt shape: read → magnitude → storeSample (via runMotionSampleOnce).
    await runMotionSampleOnce()
    return BackgroundFetch.BackgroundFetchResult.NewData
  } catch (err) {
    console.warn('[MOTION_SAMPLE] failed', err)
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

export async function isMotionSampleTaskRegistered(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  return TaskManager.isTaskRegisteredAsync(MOTION_SAMPLE)
}

/**
 * Register 15-minute background fetch for MOTION_SAMPLE.
 * Safe to call repeatedly — no-ops if already registered or unsupported.
 */
export async function registerMotionSampleTask(): Promise<boolean> {
  if (Platform.OS === 'web') return false

  const status = await BackgroundFetch.getStatusAsync()
  if (
    status === BackgroundFetch.BackgroundFetchStatus.Denied ||
    status === BackgroundFetch.BackgroundFetchStatus.Restricted
  ) {
    console.warn('[MOTION_SAMPLE] BackgroundFetch unavailable:', status)
    return false
  }

  const already = await TaskManager.isTaskRegisteredAsync(MOTION_SAMPLE)
  if (already) return true

  await BackgroundFetch.registerTaskAsync(MOTION_SAMPLE, {
    minimumInterval: MOTION_SAMPLE_INTERVAL_SECONDS, // 15 min
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
