/**
 * Step 156 — in-app lock countdown helpers (uses effective lockTime; Node-testable).
 */

import {
  computeEffectiveLockTime,
  minutesUntilEffectiveLock,
} from './lateArrivalMath'
import { LOCK_WARNING_MINUTES } from './preLockWarningMath'

export const LOCK_COUNTDOWN_MAX_MINUTES = LOCK_WARNING_MINUTES

/**
 * Format remaining ms as M:SS or H:MM:SS for the full-screen timer.
 */
export function formatCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${m}:${ss}`
}

export type LockCountdownGate = {
  show: boolean
  lockAt: Date | null
  remainingMs: number
  reason?: string
}

/**
 * Show full-screen countdown when the app opens inside the 30-min pre-lock window.
 */
export function shouldShowLockCountdown(input: {
  now: Date
  scheduledSleepHHMM: string
  wakeTimeHHMM?: string
  homeArrivalTime?: Date | null
  scheduleLockedIn: boolean
  currentlyLocked: boolean
  dismissedThisSession?: boolean
}): LockCountdownGate {
  if (!input.scheduleLockedIn) {
    return { show: false, lockAt: null, remainingMs: 0, reason: 'no-schedule' }
  }
  if (input.currentlyLocked) {
    return { show: false, lockAt: null, remainingMs: 0, reason: 'already-locked' }
  }
  if (input.dismissedThisSession) {
    return { show: false, lockAt: null, remainingMs: 0, reason: 'dismissed' }
  }

  const effective = computeEffectiveLockTime({
    now: input.now,
    scheduledSleepHHMM: input.scheduledSleepHHMM,
    wakeTimeHHMM: input.wakeTimeHHMM,
    homeArrivalTime: input.homeArrivalTime,
  })

  if (!effective.lockAt) {
    return {
      show: false,
      lockAt: null,
      remainingMs: 0,
      reason: 'deferred-late-arrival',
    }
  }

  const remainingMs = effective.lockAt.getTime() - input.now.getTime()
  const minutesUntil = minutesUntilEffectiveLock(input.now, effective.lockAt)

  if (remainingMs <= 0 || minutesUntil == null || minutesUntil <= 0) {
    return {
      show: false,
      lockAt: effective.lockAt,
      remainingMs: 0,
      reason: 'lock-due',
    }
  }
  if (minutesUntil > LOCK_COUNTDOWN_MAX_MINUTES) {
    return {
      show: false,
      lockAt: effective.lockAt,
      remainingMs,
      reason: 'outside-warning-window',
    }
  }

  return {
    show: true,
    lockAt: effective.lockAt,
    remainingMs,
  }
}
