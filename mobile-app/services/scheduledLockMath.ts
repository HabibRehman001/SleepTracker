/**
 * Steps 152–153 / 155 / 177 — scheduled lock with late-arrival + never-arrived skip.
 */

import {
  computeEffectiveLockTime,
  isInEffectiveSleepWindow,
} from './lateArrivalMath'
import {
  evaluateNeverArrivedNight,
  NEVER_ARRIVED_HOME_POLICY,
  shouldSkipLockForNeverArrived,
} from './neverArrivedPolicyMath'

/** Same cadence as MOTION_SAMPLE — ~15 min on iOS BackgroundFetch. */
export const SCHEDULED_LOCK_INTERVAL_SECONDS = 15 * 60

export type ScheduledLockDecision = {
  shouldEnable: boolean
  shouldDisable: boolean
  inSleepWindow: boolean
  alreadyLocked: boolean
  /** Effective lock instant after late-arrival math (null = still out / skipped). */
  effectiveLockAt: Date | null
  deferredForLateArrival: boolean
  /** Step 177 — away overnight classification. */
  awayStatus?: string
  skippedReason?: string | null
}

/**
 * Enable at effective lockTime; disable past wake.
 * Late arrival: will not enable at original scheduledSleep while still commuting.
 * Never arrived (Step 177): skip-lock — never enable without geofence arrival.
 */
export function decideScheduledLock(input: {
  now: Date
  sleepTime: string
  wakeTime: string
  currentlyLocked: boolean
  scheduleLockedIn: boolean
  homeArrivalTime?: Date | null
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

  const homeArrivalTime = input.homeArrivalTime ?? null
  const away = evaluateNeverArrivedNight({
    now: input.now,
    sleepTime: input.sleepTime,
    wakeTime: input.wakeTime,
    homeArrivalTime,
  })

  // Step 177 — explicit skip when geofence never fired.
  if (
    NEVER_ARRIVED_HOME_POLICY === 'skip-lock' &&
    shouldSkipLockForNeverArrived(homeArrivalTime) &&
    (away.status === 'awaiting-home' ||
      away.status === 'skipped-away-all-night')
  ) {
    return {
      shouldEnable: false,
      shouldDisable: input.currentlyLocked,
      inSleepWindow: false,
      alreadyLocked: input.currentlyLocked,
      effectiveLockAt: null,
      deferredForLateArrival: true,
      awayStatus: away.status,
      skippedReason: away.skippedReason,
    }
  }

  const effective = computeEffectiveLockTime({
    now: input.now,
    scheduledSleepHHMM: input.sleepTime,
    wakeTimeHHMM: input.wakeTime,
    homeArrivalTime,
  })

  if (!effective.lockAt) {
    return {
      shouldEnable: false,
      shouldDisable: input.currentlyLocked,
      inSleepWindow: false,
      alreadyLocked: input.currentlyLocked,
      effectiveLockAt: null,
      deferredForLateArrival: effective.deferredForLateArrival,
      awayStatus: away.status,
      skippedReason: away.skippedReason,
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
    awayStatus: away.status,
    skippedReason: null,
  }
}

/** Clock-only sleep window (ignores late-arrival; treats as on-time). */
export function isInSleepWindow(
  now: Date,
  sleepTimeHHMM: string,
  wakeTimeHHMM: string
): boolean {
  const effective = computeEffectiveLockTime({
    now,
    scheduledSleepHHMM: sleepTimeHHMM,
    wakeTimeHHMM,
    // Early arrival so lockAt === scheduledSleep (no deferral).
    homeArrivalTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
  })
  return isInEffectiveSleepWindow(now, effective.lockAt, wakeTimeHHMM)
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
  awayStatus?: string
  skippedReason?: string
}

/**
 * One fetch-cycle check with injected I/O.
 * loadHomeArrival supplies Step 175 persisted arrival for late-arrival math.
 */
export async function runScheduledLockOnce(
  now: Date,
  deps: {
    enableLock: () => Promise<void>
    disableLock: () => Promise<void>
    isLocked: () => Promise<boolean>
    loadSchedule: () => Promise<PersistedEnforcedSchedule | null>
    loadHomeArrival?: () => Promise<Date | null>
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

  const homeArrivalTime = deps.loadHomeArrival
    ? await deps.loadHomeArrival()
    : null

  const currentlyLocked = await deps.isLocked()
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
      awayStatus: decision.awayStatus,
    }
  }

  if (decision.shouldDisable) {
    await deps.disableLock()
    return {
      enabled: false,
      disabled: true,
      inSleepWindow: false,
      deferredForLateArrival: decision.deferredForLateArrival,
      awayStatus: decision.awayStatus,
    }
  }

  return {
    enabled: false,
    disabled: false,
    inSleepWindow: decision.inSleepWindow,
    deferredForLateArrival: decision.deferredForLateArrival,
    awayStatus: decision.awayStatus,
    skippedReason:
      decision.skippedReason ??
      (decision.deferredForLateArrival
        ? 'deferred-late-arrival'
        : decision.alreadyLocked
          ? decision.inSleepWindow
            ? 'already-locked'
            : 'already-unlocked'
          : 'outside-sleep-window'),
  }
}
