/**
 * Step 176 — dynamic lock-warning trigger from real geofence homeArrival.
 * Pure helpers stay free of AsyncStorage / expo so Node contract tests can run.
 *
 * effectiveLockTime = Math.max(scheduledSleepTime, homeArrivalTime + GRACE_MINUTES)
 * Warning fires when now is within LOCK_WARNING_MINUTES of that effective lock.
 */

import {
  computeEffectiveLockTime,
  effectiveLockOccurrenceId,
  effectiveLockTimeMs,
  GRACE_MINUTES,
  minutesUntilEffectiveLock,
  type EffectiveLockResult,
} from './lateArrivalMath'
import { LOCK_WARNING_MINUTES } from './preLockWarningMath'

export { GRACE_MINUTES, effectiveLockTimeMs }

export type DynamicLockWarningTrigger = {
  /** Result of Math.max(scheduledSleep, arrival + GRACE_MINUTES), or null if deferred. */
  effectiveLockTime: Date | null
  scheduledSleepTime: Date
  homeArrivalTime: Date | null
  /** When warning should start (effectiveLock − LOCK_WARNING_MINUTES). */
  warningTriggerAt: Date | null
  minutesUntilLock: number | null
  shouldWarnNow: boolean
  occurrenceId: string | null
  deferredForLateArrival: boolean
  /** Provenance — must be geofence-persisted in production, never a hardcoded mock. */
  arrivalSource: 'geofence' | 'none'
}

/**
 * Compute the dynamic lock-warning trigger for a clock + real (or test) arrival.
 */
export function computeDynamicLockWarningTrigger(input: {
  now: Date
  scheduledSleepHHMM: string
  wakeTimeHHMM?: string
  /** From HOME_GEOFENCE Enter → loadHomeArrivalTime() — not a mock clock. */
  homeArrivalTime: Date | null
  currentlyLocked?: boolean
  scheduleLockedIn?: boolean
  lastWarnedOccurrenceId?: string | null
}): DynamicLockWarningTrigger {
  if (input.scheduleLockedIn === false) {
    return {
      effectiveLockTime: null,
      scheduledSleepTime: computeEffectiveLockTime({
        now: input.now,
        scheduledSleepHHMM: input.scheduledSleepHHMM,
        wakeTimeHHMM: input.wakeTimeHHMM,
        homeArrivalTime: null,
      }).scheduledSleepAt,
      homeArrivalTime: input.homeArrivalTime,
      warningTriggerAt: null,
      minutesUntilLock: null,
      shouldWarnNow: false,
      occurrenceId: null,
      deferredForLateArrival: false,
      arrivalSource: input.homeArrivalTime ? 'geofence' : 'none',
    }
  }

  const effective: EffectiveLockResult = computeEffectiveLockTime({
    now: input.now,
    scheduledSleepHHMM: input.scheduledSleepHHMM,
    wakeTimeHHMM: input.wakeTimeHHMM,
    homeArrivalTime: input.homeArrivalTime,
  })

  const arrivalSource: 'geofence' | 'none' = input.homeArrivalTime
    ? 'geofence'
    : 'none'

  if (!effective.lockAt) {
    return {
      effectiveLockTime: null,
      scheduledSleepTime: effective.scheduledSleepAt,
      homeArrivalTime: input.homeArrivalTime,
      warningTriggerAt: null,
      minutesUntilLock: null,
      shouldWarnNow: false,
      occurrenceId: null,
      deferredForLateArrival: effective.deferredForLateArrival,
      arrivalSource,
    }
  }

  const warningTriggerAt = new Date(
    effective.lockAt.getTime() - LOCK_WARNING_MINUTES * 60 * 1000
  )
  const minutesUntilLock = minutesUntilEffectiveLock(
    input.now,
    effective.lockAt
  )
  const occurrenceId = effectiveLockOccurrenceId(effective.lockAt)
  const inWindow =
    minutesUntilLock != null &&
    minutesUntilLock > 0 &&
    minutesUntilLock <= LOCK_WARNING_MINUTES
  const shouldWarnNow =
    !input.currentlyLocked &&
    inWindow &&
    input.lastWarnedOccurrenceId !== occurrenceId

  return {
    effectiveLockTime: effective.lockAt,
    scheduledSleepTime: effective.scheduledSleepAt,
    homeArrivalTime: input.homeArrivalTime,
    warningTriggerAt,
    minutesUntilLock,
    shouldWarnNow,
    occurrenceId,
    deferredForLateArrival: effective.deferredForLateArrival,
    arrivalSource,
  }
}
