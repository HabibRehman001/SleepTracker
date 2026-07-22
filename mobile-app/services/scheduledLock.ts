/**
 * Steps 152–153 / 155 / 191 — persist schedule; background cycle
 * enableLock / disableLock; finalize locked night session on unlock.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

import { loadHomeArrivalTime } from './homeArrival'
import * as lockService from './lockService'
import { finalizeLockedNightToBackend } from './sessionApi'
import { appendSoakStageSafe } from './soakReliability'
import {
  runScheduledLockOnce as runScheduledLockOncePure,
  type PersistedEnforcedSchedule,
  type ScheduledLockRunResult,
  SCHEDULED_LOCK_INTERVAL_SECONDS,
  decideScheduledLock,
  isInSleepWindow,
} from './scheduledLockMath'

export const ENFORCED_SCHEDULE_STORAGE_KEY = '@sleep_lock/enforced_schedule'
/** Bed instant when soft/device lock engaged — cleared after unlock finalize. */
export const LOCK_STARTED_AT_STORAGE_KEY = '@sleep_lock/lock_started_at'

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

async function loadLockStartedAt(): Promise<Date | null> {
  const raw = await AsyncStorage.getItem(LOCK_STARTED_AT_STORAGE_KEY)
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

async function saveLockStartedAt(at: Date | null): Promise<void> {
  if (!at) {
    await AsyncStorage.removeItem(LOCK_STARTED_AT_STORAGE_KEY)
    return
  }
  await AsyncStorage.setItem(LOCK_STARTED_AT_STORAGE_KEY, at.toISOString())
}

/**
 * One background-fetch cycle:
 * - at effective lockTime → enableLock()
 * - past wakeTime → disableLock() + finalize session (Step 191)
 */
export async function runScheduledLockOnce(
  now: Date = new Date()
): Promise<ScheduledLockRunResult> {
  const result = await runScheduledLockOncePure(now, {
    enableLock: () => lockService.enableLock(),
    disableLock: () => lockService.disableLock(),
    isLocked: () => lockService.isLocked(),
    loadSchedule: () => loadEnforcedSchedule(),
    loadHomeArrival: () => loadHomeArrivalTime(),
    loadLockStartedAt,
    saveLockStartedAt,
    recordLockedSession: async ({ bedTime, wakeTime, homeArrivalTime }) => {
      try {
        await finalizeLockedNightToBackend({
          homeArrivalTime,
          bedTime,
          wakeTime,
        })
        appendSoakStageSafe('session_recorded', {
          at: now,
          detail: 'locked-schedule',
        })
      } catch (err) {
        console.warn('[SCHEDULED_LOCK] session finalize failed', err)
      }
    },
  })
  if (result.enabled) {
    appendSoakStageSafe('lock', { at: now })
  }
  if (result.disabled) {
    appendSoakStageSafe('unlock', { at: now })
  }
  return result
}
