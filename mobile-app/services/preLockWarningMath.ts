/**
 * Step 154 / 155 — pre-lock warning against effective lockTime
 * (max(scheduledSleep, homeArrival + grace)).
 */

import {
  computeEffectiveLockTime,
  effectiveLockOccurrenceId,
  minutesUntilEffectiveLock,
} from './lateArrivalMath'

export const LOCK_WARNING_MINUTES = 30

export const PRE_LOCK_WARNING_TITLE = 'Sleep Lock'

/** Exact copy for the local notification body (Step 154). */
export const PRE_LOCK_WARNING_BODY = 'Phone locks in 30 minutes'

/**
 * Minutes until the next occurrence of sleepTime (0–1439).
 */
export function minutesUntilSleep(now: Date, sleepTimeHHMM: string): number {
  const nowM = now.getHours() * 60 + now.getMinutes()
  const [h, m] = sleepTimeHHMM.split(':').map(Number)
  const sleepM = h * 60 + m
  let delta = sleepM - nowM
  if (delta < 0) delta += 24 * 60
  return delta
}

export function nextSleepOccurrenceId(
  now: Date,
  sleepTimeHHMM: string,
  wakeTimeHHMM?: string,
  homeArrivalTime?: Date | null
): string {
  const effective = computeEffectiveLockTime({
    now,
    scheduledSleepHHMM: sleepTimeHHMM,
    wakeTimeHHMM,
    homeArrivalTime,
  })
  const lockAt = effective.lockAt ?? effective.scheduledSleepAt
  return effectiveLockOccurrenceId(lockAt)
}

export type PreLockWarningDecision = {
  shouldFire: boolean
  minutesUntil: number | null
  occurrenceId: string | null
  effectiveLockAt: Date | null
  reason?: string
}

/**
 * Within LOCK_WARNING_MINUTES of effective lockTime.
 * Late arrival 4:30 → warn at 4:30 (lock 5:00), not at original 3:30.
 */
export function decidePreLockWarning(input: {
  now: Date
  sleepTime: string
  wakeTime?: string
  currentlyLocked: boolean
  scheduleLockedIn: boolean
  homeArrivalTime?: Date | null
  lastWarnedOccurrenceId: string | null
}): PreLockWarningDecision {
  if (!input.scheduleLockedIn) {
    return {
      shouldFire: false,
      minutesUntil: null,
      occurrenceId: null,
      effectiveLockAt: null,
      reason: 'no-locked-schedule',
    }
  }

  const effective = computeEffectiveLockTime({
    now: input.now,
    scheduledSleepHHMM: input.sleepTime,
    wakeTimeHHMM: input.wakeTime,
    homeArrivalTime: input.homeArrivalTime,
  })

  if (!effective.lockAt) {
    return {
      shouldFire: false,
      minutesUntil: null,
      occurrenceId: null,
      effectiveLockAt: null,
      reason: 'deferred-late-arrival',
    }
  }

  const occurrenceId = effectiveLockOccurrenceId(effective.lockAt)
  const minutesUntil = minutesUntilEffectiveLock(input.now, effective.lockAt)

  if (input.currentlyLocked) {
    return {
      shouldFire: false,
      minutesUntil,
      occurrenceId,
      effectiveLockAt: effective.lockAt,
      reason: 'already-locked',
    }
  }

  if (
    minutesUntil == null ||
    minutesUntil <= 0 ||
    minutesUntil > LOCK_WARNING_MINUTES
  ) {
    return {
      shouldFire: false,
      minutesUntil,
      occurrenceId,
      effectiveLockAt: effective.lockAt,
      reason: 'outside-warning-window',
    }
  }

  if (input.lastWarnedOccurrenceId === occurrenceId) {
    return {
      shouldFire: false,
      minutesUntil,
      occurrenceId,
      effectiveLockAt: effective.lockAt,
      reason: 'already-warned',
    }
  }

  return {
    shouldFire: true,
    minutesUntil,
    occurrenceId,
    effectiveLockAt: effective.lockAt,
  }
}

export type PreLockWarningRunResult = {
  fired: boolean
  occurrenceId: string | null
  reason?: string
}

export async function runPreLockWarningOnce(
  now: Date,
  deps: {
    loadSchedule: () => Promise<{
      sleepTime: string
      wakeTime?: string
      lockedIn: boolean
    } | null>
    isLocked: () => Promise<boolean>
    loadHomeArrival?: () => Promise<Date | null>
    loadLastWarnedId: () => Promise<string | null>
    saveLastWarnedId: (id: string) => Promise<void>
    presentWarning: (body: string) => Promise<void>
  }
): Promise<PreLockWarningRunResult> {
  const schedule = await deps.loadSchedule()
  if (!schedule?.lockedIn) {
    return { fired: false, occurrenceId: null, reason: 'no-locked-schedule' }
  }
  const currentlyLocked = await deps.isLocked()
  const homeArrivalTime = deps.loadHomeArrival
    ? await deps.loadHomeArrival()
    : null
  const lastWarnedOccurrenceId = await deps.loadLastWarnedId()
  const decision = decidePreLockWarning({
    now,
    sleepTime: schedule.sleepTime,
    wakeTime: schedule.wakeTime,
    currentlyLocked,
    scheduleLockedIn: true,
    homeArrivalTime,
    lastWarnedOccurrenceId,
  })
  if (!decision.shouldFire || !decision.occurrenceId) {
    return {
      fired: false,
      occurrenceId: decision.occurrenceId,
      reason: decision.reason,
    }
  }
  await deps.presentWarning(PRE_LOCK_WARNING_BODY)
  await deps.saveLastWarnedId(decision.occurrenceId)
  return { fired: true, occurrenceId: decision.occurrenceId }
}
