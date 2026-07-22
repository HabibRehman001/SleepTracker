/**
 * Step 177 — "never arrived home" policy (explicit).
 *
 * POLICY: skip-lock — If HOME_GEOFENCE never fires for the sleep cycle,
 * do not enable lock that night. Phone stays usable while away.
 * We never fall back to “lock at scheduled time regardless of location.”
 */

import {
  atTimeOnDay,
  resolveWakeAfter,
} from './lateArrivalMath'

/** Documented product choice for Step 177. */
export const NEVER_ARRIVED_HOME_POLICY = 'skip-lock' as const
export type NeverArrivedHomePolicy = typeof NEVER_ARRIVED_HOME_POLICY

export const NEVER_ARRIVED_POLICY_TITLE = 'Away from home'

/** In-app copy so the skip is intentional, not accidental. */
export const NEVER_ARRIVED_POLICY_BODY =
  'If you stay away overnight and never cross your home geofence, Sleep Lock skips locking that night. Your phone stays unlocked while you are away — we only start the lock countdown after you arrive home.'

export const NEVER_ARRIVED_POLICY_SHORT =
  'Away overnight → skip lock (only lock after you arrive home).'

export type AwayNightStatus =
  /** Before scheduled sleep; arrival optional. */
  | 'before-sleep'
  /** Past scheduled sleep, no arrival yet — may still come home. */
  | 'awaiting-home'
  /** Past wake with no arrival — night explicitly skipped. */
  | 'skipped-away-all-night'
  /** Geofence recorded arrival for this cycle. */
  | 'arrived'

export type AwayNightEvaluation = {
  status: AwayNightStatus
  policy: NeverArrivedHomePolicy
  /** Always false under skip-lock when status is awaiting-home or skipped-away-all-night. */
  shouldEnableLock: boolean
  skippedReason: string | null
  policyTitle: string
  policyBody: string
}

/**
 * Sleep cycle under inspection for away-policy (not the *next* cycle after wake).
 * Same-day 04:00→12:00 at 12:30 → today's 04:00–12:00 (just ended).
 */
export function resolveAwayPolicySleepCycle(
  now: Date,
  sleepTimeHHMM: string,
  wakeTimeHHMM: string
): { sleepAt: Date; wakeAt: Date } {
  const todaySleep = atTimeOnDay(now, sleepTimeHHMM)
  const wakeAfterToday = resolveWakeAfter(todaySleep, wakeTimeHHMM)

  if (now.getTime() >= wakeAfterToday.getTime()) {
    return { sleepAt: todaySleep, wakeAt: wakeAfterToday }
  }
  if (now.getTime() >= todaySleep.getTime()) {
    return { sleepAt: todaySleep, wakeAt: wakeAfterToday }
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const ySleep = atTimeOnDay(yesterday, sleepTimeHHMM)
  const yWake = resolveWakeAfter(ySleep, wakeTimeHHMM)
  if (now.getTime() < yWake.getTime()) {
    return { sleepAt: ySleep, wakeAt: yWake }
  }
  return { sleepAt: todaySleep, wakeAt: wakeAfterToday }
}

/**
 * Classify the current moment under the never-arrived policy.
 * Simulated “away all night” → skipped-away-all-night, never shouldEnableLock.
 */
export function evaluateNeverArrivedNight(input: {
  now: Date
  sleepTime: string
  wakeTime: string
  homeArrivalTime: Date | null
}): AwayNightEvaluation {
  const base = {
    policy: NEVER_ARRIVED_HOME_POLICY,
    policyTitle: NEVER_ARRIVED_POLICY_TITLE,
    policyBody: NEVER_ARRIVED_POLICY_BODY,
  }

  if (input.homeArrivalTime) {
    return {
      ...base,
      status: 'arrived',
      shouldEnableLock: false,
      skippedReason: null,
    }
  }

  const { sleepAt, wakeAt } = resolveAwayPolicySleepCycle(
    input.now,
    input.sleepTime,
    input.wakeTime
  )
  const nowMs = input.now.getTime()

  if (nowMs < sleepAt.getTime()) {
    return {
      ...base,
      status: 'before-sleep',
      shouldEnableLock: false,
      skippedReason: null,
    }
  }

  if (nowMs >= wakeAt.getTime()) {
    return {
      ...base,
      status: 'skipped-away-all-night',
      shouldEnableLock: false,
      skippedReason: 'never-arrived-skip-lock',
    }
  }

  return {
    ...base,
    status: 'awaiting-home',
    shouldEnableLock: false,
    skippedReason: 'awaiting-home-geofence',
  }
}

/**
 * Under skip-lock policy, never enable without a geofence arrival.
 */
export function shouldSkipLockForNeverArrived(
  homeArrivalTime: Date | null
): boolean {
  return NEVER_ARRIVED_HOME_POLICY === 'skip-lock' && homeArrivalTime == null
}
