/**
 * Step 155 — late arrival: lockTime = max(scheduledSleep, homeArrival + grace).
 * Pure Date math — Node-testable.
 */

import { clockToMinutes } from './baselineDetection'

/** Grace after arriving home before lock (matches LOCK_WARNING_MINUTES = 30). */
export const ARRIVAL_GRACE_PERIOD_MS = 30 * 60 * 1000

export type EffectiveLockResult = {
  /** null = still commuting / no arrival yet — do not lock at scheduled time alone. */
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
 * Scheduled sleep occurrence for this cycle.
 * Uses homeArrival's calendar day when present (late 4:30 arrival → today's 4:00 sleep).
 */
export function resolveScheduledSleepAt(
  now: Date,
  scheduledSleepHHMM: string,
  homeArrivalTime: Date | null
): Date {
  const anchor = homeArrivalTime ?? now
  return atTimeOnDay(anchor, scheduledSleepHHMM)
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
 * lockTime = max(scheduledSleepTime, homeArrivalTime + gracePeriod).
 * Without homeArrival, lock is deferred (do not lock while still out).
 */
export function computeEffectiveLockTime(input: {
  now: Date
  scheduledSleepHHMM: string
  homeArrivalTime: Date | null
  gracePeriodMs?: number
}): EffectiveLockResult {
  const grace = input.gracePeriodMs ?? ARRIVAL_GRACE_PERIOD_MS
  const scheduledSleepAt = resolveScheduledSleepAt(
    input.now,
    input.scheduledSleepHHMM,
    input.homeArrivalTime
  )

  if (!input.homeArrivalTime) {
    return {
      lockAt: null,
      scheduledSleepAt,
      arrivalBasedLockAt: null,
      deferredForLateArrival: true,
    }
  }

  const arrivalBasedLockAt = new Date(
    input.homeArrivalTime.getTime() + grace
  )
  const lockAt = new Date(
    Math.max(scheduledSleepAt.getTime(), arrivalBasedLockAt.getTime())
  )

  return {
    lockAt,
    scheduledSleepAt,
    arrivalBasedLockAt,
    deferredForLateArrival:
      lockAt.getTime() > scheduledSleepAt.getTime(),
  }
}

export function isInEffectiveSleepWindow(
  now: Date,
  lockAt: Date,
  wakeTimeHHMM: string
): boolean {
  const wakeAt = resolveWakeAfter(lockAt, wakeTimeHHMM)
  return now.getTime() >= lockAt.getTime() && now.getTime() < wakeAt.getTime()
}

/** Minutes until effective lock (ceil); null if lock not determined yet. */
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
