/**
 * Step 155 / 176 — late arrival + dynamic lock-warning trigger.
 * effectiveLockTime = Math.max(scheduledSleepTime, homeArrivalTime + GRACE_MINUTES)
 * homeArrivalTime comes from real HOME_GEOFENCE Enter (Steps 174–175), not a mock.
 */

import { clockToMinutes } from './baselineDetection'

/** Grace minutes after home arrival before lock / warning window (Step 176). */
export const GRACE_MINUTES = 30

/** Grace after arriving home before lock (ms). */
export const ARRIVAL_GRACE_PERIOD_MS = GRACE_MINUTES * 60 * 1000

export type EffectiveLockResult = {
  /**
   * Effective lock instant, or null when past scheduled sleep but still
   * commuting (no homeArrival yet) — do not lock while out.
   */
  lockAt: Date | null
  scheduledSleepAt: Date
  arrivalBasedLockAt: Date | null
  deferredForLateArrival: boolean
}

/** Build a Date on `day`'s calendar date at HH:MM local. */
export function atTimeOnDay(day: Date, hhmm: string): Date {
  const minutes = clockToMinutes(hhmm)
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return d
}

/**
 * Scheduled sleep for the current or next cycle.
 * Overnight windows (e.g. 22:00→07:00): before wake today → yesterday's sleep.
 * Same-day (e.g. 04:00→12:00): after wake → tomorrow's sleep.
 */
export function resolveScheduledSleepAt(
  now: Date,
  scheduledSleepHHMM: string,
  _homeArrivalTime?: Date | null,
  wakeTimeHHMM?: string
): Date {
  const todaySleep = atTimeOnDay(now, scheduledSleepHHMM)
  if (!wakeTimeHHMM) {
    return todaySleep
  }

  const sleepM = clockToMinutes(scheduledSleepHHMM)
  const wakeM = clockToMinutes(wakeTimeHHMM)
  const overnight = sleepM > wakeM
  const wakeToday = atTimeOnDay(now, wakeTimeHHMM)

  if (overnight) {
    if (now.getTime() < wakeToday.getTime()) {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      return atTimeOnDay(yesterday, scheduledSleepHHMM)
    }
    return todaySleep
  }

  const wakeAfterTodaySleep = resolveWakeAfter(todaySleep, wakeTimeHHMM)
  if (now.getTime() < todaySleep.getTime()) {
    return todaySleep
  }
  if (now.getTime() < wakeAfterTodaySleep.getTime()) {
    return todaySleep
  }
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return atTimeOnDay(tomorrow, scheduledSleepHHMM)
}

/** Wake instant after a lock start (same day or next if wake ≤ lock clock). */
export function resolveWakeAfter(lockAt: Date, wakeTimeHHMM: string): Date {
  const wake = atTimeOnDay(lockAt, wakeTimeHHMM)
  if (wake.getTime() <= lockAt.getTime()) {
    wake.setDate(wake.getDate() + 1)
  }
  return wake
}

/**
 * Step 176 core formula (epoch ms):
 * effectiveLockTime = Math.max(scheduledSleepTime, homeArrivalTime + GRACE_MINUTES)
 */
export function effectiveLockTimeMs(
  scheduledSleepTime: number,
  homeArrivalTime: number,
  graceMinutes: number = GRACE_MINUTES
): number {
  return Math.max(
    scheduledSleepTime,
    homeArrivalTime + graceMinutes * 60 * 1000
  )
}

/**
 * lockTime = max(scheduledSleep, homeArrival + grace).
 * No arrival yet + already past scheduled sleep → lockAt null (still out).
 */
export function computeEffectiveLockTime(input: {
  now: Date
  scheduledSleepHHMM: string
  homeArrivalTime?: Date | null
  gracePeriodMs?: number
  wakeTimeHHMM?: string
}): EffectiveLockResult {
  const graceMs = input.gracePeriodMs ?? ARRIVAL_GRACE_PERIOD_MS
  const graceMinutes = graceMs / 60_000
  const scheduledSleepAt = resolveScheduledSleepAt(
    input.now,
    input.scheduledSleepHHMM,
    input.homeArrivalTime,
    input.wakeTimeHHMM
  )

  const arrival = input.homeArrivalTime ?? null
  if (!arrival) {
    if (input.now.getTime() >= scheduledSleepAt.getTime()) {
      return {
        lockAt: null,
        scheduledSleepAt,
        arrivalBasedLockAt: null,
        deferredForLateArrival: true,
      }
    }
    return {
      lockAt: scheduledSleepAt,
      scheduledSleepAt,
      arrivalBasedLockAt: null,
      deferredForLateArrival: false,
    }
  }

  const arrivalBasedLockAt = new Date(arrival.getTime() + graceMs)
  const lockAt = new Date(
    effectiveLockTimeMs(
      scheduledSleepAt.getTime(),
      arrival.getTime(),
      graceMinutes
    )
  )
  const deferredForLateArrival =
    lockAt.getTime() > scheduledSleepAt.getTime()

  return {
    lockAt,
    scheduledSleepAt,
    arrivalBasedLockAt,
    deferredForLateArrival,
  }
}

export function isInEffectiveSleepWindow(
  now: Date,
  lockAt: Date | null,
  wakeTimeHHMM: string
): boolean {
  if (!lockAt) return false
  const wakeAt = resolveWakeAfter(lockAt, wakeTimeHHMM)
  return now.getTime() >= lockAt.getTime() && now.getTime() < wakeAt.getTime()
}

/** Minutes until effective lock (ceil); 0 if already at/past; null if deferred. */
export function minutesUntilEffectiveLock(
  now: Date,
  lockAt: Date | null
): number | null {
  if (!lockAt) return null
  const ms = lockAt.getTime() - now.getTime()
  if (ms <= 0) return 0
  return Math.ceil(ms / 60_000)
}

export function effectiveLockOccurrenceId(lockAt: Date): string {
  const y = lockAt.getFullYear()
  const mo = String(lockAt.getMonth() + 1).padStart(2, '0')
  const d = String(lockAt.getDate()).padStart(2, '0')
  const h = String(lockAt.getHours()).padStart(2, '0')
  const m = String(lockAt.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${d}T${h}:${m}`
}
