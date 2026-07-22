/**
 * Step 191 — sped-up clock simulation of one full nightly cycle.
 * Stages: arrival → 30-min warning → lock → stay locked → unlock → session recorded.
 * Each stage must fire exactly once (no duplicate notifications / double-locks).
 */

import {
  computeEffectiveLockTime,
  resolveWakeAfter,
} from './lateArrivalMath'
import {
  runPreLockWarningOnce,
  type PreLockWarningRunResult,
} from './preLockWarningMath'
import {
  runScheduledLockOnce,
  type ScheduledLockRunResult,
} from './scheduledLockMath'

export type NightlyStage =
  | 'arrival'
  | 'warning'
  | 'lock'
  | 'stay_locked'
  | 'unlock'
  | 'session_recorded'

export type NightlyCycleEvent = {
  stage: NightlyStage
  at: Date
  detail?: string
}

export type LockedNightSessionPayload = {
  date: Date
  bedTime: Date
  wakeTime: Date
  source: 'locked-schedule'
  homeArrivalTime: Date
}

export type NightlyCycleCounts = {
  arrival: number
  warning: number
  lock: number
  unlock: number
  sessionRecorded: number
  /** Ticks where phone stayed locked without re-enable. */
  stayLockedTicks: number
}

export type NightlyCycleResult = {
  events: NightlyCycleEvent[]
  counts: NightlyCycleCounts
  ticks: number
  lockedAt: Date | null
  unlockedAt: Date | null
  session: LockedNightSessionPayload | null
}

export type NightlyCycleScenario = {
  /** Inclusive start of simulation (local Date). */
  start: Date
  /** Exclusive-or-inclusive end — last tick at or before end. */
  end: Date
  /** Minutes advanced per tick (sped-up device clock). */
  tickMinutes: number
  sleepTime: string
  wakeTime: string
  /** Geofence Enter instant. */
  arrivalAt: Date
}

function sleepDayMidnight(at: Date): Date {
  const d = new Date(at.getFullYear(), at.getMonth(), at.getDate())
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Build the locked-schedule session written to the backend after unlock.
 */
export function buildLockedNightSession(input: {
  bedTime: Date
  wakeTime: Date
  homeArrivalTime: Date
}): LockedNightSessionPayload {
  return {
    date: sleepDayMidnight(input.homeArrivalTime),
    bedTime: input.bedTime,
    wakeTime: input.wakeTime,
    source: 'locked-schedule',
    homeArrivalTime: input.homeArrivalTime,
  }
}

/**
 * Advance a fake clock through one night, invoking the same pure runners
 * the background SCHEDULED_LOCK task uses (warning then lock/unlock).
 */
export async function simulateNightlyCycle(
  scenario: NightlyCycleScenario
): Promise<NightlyCycleResult> {
  const { start, end, tickMinutes, sleepTime, wakeTime, arrivalAt } = scenario
  if (tickMinutes <= 0) {
    throw new Error('tickMinutes must be positive')
  }
  if (end.getTime() < start.getTime()) {
    throw new Error('end must be >= start')
  }

  let now = new Date(start.getTime())
  let locked = false
  let homeArrival: Date | null = null
  let lastWarnedId: string | null = null
  let lockStartedAt: Date | null = null
  let unlockedAt: Date | null = null
  let session: LockedNightSessionPayload | null = null

  const events: NightlyCycleEvent[] = []
  const counts: NightlyCycleCounts = {
    arrival: 0,
    warning: 0,
    lock: 0,
    unlock: 0,
    sessionRecorded: 0,
    stayLockedTicks: 0,
  }

  let ticks = 0
  const stepMs = tickMinutes * 60 * 1000

  while (now.getTime() <= end.getTime()) {
    ticks += 1

    // --- Stage: arrival (geofence Enter) ---
    if (!homeArrival && now.getTime() >= arrivalAt.getTime()) {
      homeArrival = new Date(arrivalAt.getTime())
      counts.arrival += 1
      events.push({
        stage: 'arrival',
        at: new Date(now.getTime()),
        detail: homeArrival.toISOString(),
      })
    }

    const schedule = {
      sleepTime,
      wakeTime,
      lockedIn: true as const,
    }

    // --- Stage: 30-min warning (exactly once per occurrence) ---
    const warn: PreLockWarningRunResult = await runPreLockWarningOnce(now, {
      loadSchedule: async () => schedule,
      isLocked: async () => locked,
      loadHomeArrival: async () => homeArrival,
      loadLastWarnedId: async () => lastWarnedId,
      saveLastWarnedId: async (id) => {
        lastWarnedId = id
      },
      presentWarning: async () => {
        /* counted via warn.fired */
      },
    })
    if (warn.fired) {
      counts.warning += 1
      events.push({
        stage: 'warning',
        at: new Date(now.getTime()),
        detail: warn.occurrenceId ?? undefined,
      })
    }

    // --- Stage: lock / stay locked / unlock ---
    const lockResult: ScheduledLockRunResult = await runScheduledLockOnce(
      now,
      {
        enableLock: async () => {
          locked = true
        },
        disableLock: async () => {
          locked = false
        },
        isLocked: async () => locked,
        loadSchedule: async () => schedule,
        loadHomeArrival: async () => homeArrival,
      }
    )

    if (lockResult.enabled) {
      counts.lock += 1
      const effective = computeEffectiveLockTime({
        now,
        scheduledSleepHHMM: sleepTime,
        wakeTimeHHMM: wakeTime,
        homeArrivalTime: homeArrival,
      })
      lockStartedAt = effective.lockAt ?? new Date(now.getTime())
      events.push({
        stage: 'lock',
        at: new Date(now.getTime()),
        detail: lockStartedAt.toISOString(),
      })
    } else if (locked && lockResult.inSleepWindow && !lockResult.disabled) {
      counts.stayLockedTicks += 1
      events.push({
        stage: 'stay_locked',
        at: new Date(now.getTime()),
      })
    }

    if (lockResult.disabled) {
      counts.unlock += 1
      unlockedAt = new Date(now.getTime())
      events.push({
        stage: 'unlock',
        at: unlockedAt,
      })

      // --- Stage: session recorded to backend (exactly once) ---
      if (homeArrival && lockStartedAt && counts.sessionRecorded === 0) {
        const wakeAt = resolveWakeAfter(lockStartedAt, wakeTime)
        session = buildLockedNightSession({
          bedTime: lockStartedAt,
          wakeTime: wakeAt,
          homeArrivalTime: homeArrival,
        })
        counts.sessionRecorded += 1
        events.push({
          stage: 'session_recorded',
          at: unlockedAt,
          detail: session.source,
        })
      }
    }

    now = new Date(now.getTime() + stepMs)
  }

  return {
    events,
    counts,
    ticks,
    lockedAt: lockStartedAt,
    unlockedAt,
    session,
  }
}

/**
 * Assert the once-per-stage invariant used by the Step 191 contract test.
 */
export function assertNightlyCycleOnceEach(result: NightlyCycleResult): void {
  const { counts } = result
  if (counts.arrival !== 1) {
    throw new Error(`expected arrival×1, got ${counts.arrival}`)
  }
  if (counts.warning !== 1) {
    throw new Error(`expected warning×1, got ${counts.warning}`)
  }
  if (counts.lock !== 1) {
    throw new Error(`expected lock×1 (no double-lock), got ${counts.lock}`)
  }
  if (counts.unlock !== 1) {
    throw new Error(`expected unlock×1, got ${counts.unlock}`)
  }
  if (counts.sessionRecorded !== 1) {
    throw new Error(
      `expected sessionRecorded×1, got ${counts.sessionRecorded}`
    )
  }
  if (counts.stayLockedTicks < 1) {
    throw new Error('expected at least one stay_locked tick while locked')
  }
  if (!result.session || result.session.source !== 'locked-schedule') {
    throw new Error('expected locked-schedule session payload')
  }
}
