/**
 * Steps 152–153 / 155 — scheduled lock/unlock with late-arrival shift (pure).
 */

import {
  computeEffectiveLockTime,
  isInEffectiveSleepWindow,
} from './lateArrivalMath'

/** Same cadence as MOTION_SAMPLE — ~15 min on iOS BackgroundFetch. */
export const SCHEDULED_LOCK_INTERVAL_SECONDS = 15 * 60

export type ScheduledLockDecision = {
  shouldEnable: boolean
  shouldDisable: boolean
  inSleepWindow: boolean
  alreadyLocked: boolean
  /** Effective lock instant after late-arrival math (null = still out). */
  effectiveLockAt: Date | null
  deferredForLateArrival: boolean
}

/**
 * Enable at effective lockTime; disable past wake.
 * Late arrival: will not enable at original scheduledSleep while still commuting.
 */
export function decideScheduledLock(input: {
  now: Date
  sleepTime: string
  wakeTime: string
  currentlyLocked: boolean
  scheduleLockedIn: boolean
  homeArrivalTime: Date | null
}): ScheduledLockDecision {
  if (!input.scheduleLockedIn) {
    return {
      shouldEnable: false,
      shouldDisable: false,
      inSleepWindow: false,
      alreadyLocked: input.currentlyLocked,
      effectiveLockAt: null,
      deferredForLateArrival: false,
    }
  }

  const effective = computeEffectiveLockTime({
    now: input.now,
    scheduledSleepHHMM: input.sleepTime,
    homeArrivalTime: input.homeArrivalTime,
  })

  // Still out — never lock at the original scheduled time alone.
  if (!effective.lockAt) {
    return {
      shouldEnable: false,
      shouldDisable: input.currentlyLocked,
      inSleepWindow: false,
      alreadyLocked: input.currentlyLocked,
      effectiveLockAt: null,
      deferredForLateArrival: true,
    }
  }

  const inSleepWindow = isInEffectiveSleepWindow(
    input.now,
    effective.lockAt,
    input.wakeTime
  )

  return {
    inSleepWindow,
    alreadyLocked: input.currentlyLocked,
    shouldEnable: inSleepWindow && !input.currentlyLocked,
    shouldDisable: !inSleepWindow && input.currentlyLocked,
    effectiveLockAt: effective.lockAt,
    deferredForLateArrival: effective.deferredForLateArrival,
  }
}

/** @deprecated Prefer isInEffectiveSleepWindow — kept for older contracts. */
export function isInSleepWindow(
  now: Date,
  sleepTimeHHMM: string,
  wakeTimeHHMM: string
): boolean {
  // Approximate with effective lock = scheduled (no late arrival).
  const { lockAt } = computeEffectiveLockTime({
    now,
    scheduledSleepHHMM: sleepTimeHHMM,
    homeArrivalTime: now, // treat "now" as arrival so lock = max(scheduled, now+grace) is wrong
  })
  // Fallback: if we force arrival=scheduled sleep moment, grace pushes lock — bad.
  // Use a synthetic arrival at scheduled - grace so lock == scheduled.
  const scheduled = computeEffectiveLockTime({
    now,
    scheduledSleepHHMM: sleepTimeHHMM,
    homeArrivalTime: (() => {
      const { scheduledSleepAt } = computeEffectiveLockTime({
        now,
        scheduledSleepHHMM: sleepTimeHHMM,
        homeArrivalTime: null,
      })
      return new Date(scheduledSleepAt.getTime() - 30 * 60 * 1000)
    })(),
  })
  if (!scheduled.lockAt) return false
  return isInEffectiveSleepWindow(now, scheduled.lockAt, wakeTimeHHMM)
}

export type PersistedEnforcedSchedule = {
  sleepTime: string
  wakeTime: string
  lockedIn: boolean
}

export type ScheduledLockRunResult = {
  enabled: boolean
  disabled: boolean
  inSleepWindow: boolean
  deferredForLateArrival?: boolean
  skippedReason?: string
}

/**
 * One fetch-cycle check with injected I/O (tests simulate clock / arrival).
 */
export async function runScheduledLockOnce(
  now: Date,
  deps: {
    enableLock: () => Promise<void>
    disableLock: () => Promise<void>
    isLocked: () => Promise<boolean>
    loadSchedule: () => Promise<PersistedEnforcedSchedule | null>
    loadHomeArrival: () => Promise<Date | null>
  }
): Promise<ScheduledLockRunResult> {
  const schedule = await deps.loadSchedule()
  if (!schedule?.lockedIn) {
    return {
      enabled: false,
      disabled: false,
      inSleepWindow: false,
      skippedReason: 'no-locked-schedule',
    }
  }

  const currentlyLocked = await deps.isLocked()
  const homeArrivalTime = await deps.loadHomeArrival()
  const decision = decideScheduledLock({
    now,
    sleepTime: schedule.sleepTime,
    wakeTime: schedule.wakeTime,
    currentlyLocked,
    scheduleLockedIn: true,
    homeArrivalTime,
  })

  if (decision.shouldEnable) {
    await deps.enableLock()
    return {
      enabled: true,
      disabled: false,
      inSleepWindow: true,
      deferredForLateArrival: decision.deferredForLateArrival,
    }
  }

  if (decision.shouldDisable) {
    await deps.disableLock()
    return {
      enabled: false,
      disabled: true,
      inSleepWindow: false,
      deferredForLateArrival: decision.deferredForLateArrival,
    }
  }

  return {
    enabled: false,
    disabled: false,
    inSleepWindow: decision.inSleepWindow,
    deferredForLateArrival: decision.deferredForLateArrival,
    skippedReason: decision.deferredForLateArrival
      ? 'deferred-late-arrival'
      : decision.alreadyLocked
        ? decision.inSleepWindow
          ? 'already-locked'
          : 'already-unlocked'
        : 'outside-sleep-window',
  }
}
