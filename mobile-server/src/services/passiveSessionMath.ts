/**
 * Step 201 — passive-ongoing vs locked-schedule as distinct session records.
 * Pure helpers for Node contracts (no Mongo).
 */

export const ACTIVITY_SOURCE_BASELINE = 'baseline-auto' as const
export const ACTIVITY_SOURCE_LOCKED = 'locked-schedule' as const
export const ACTIVITY_SOURCE_PASSIVE = 'passive-ongoing' as const

export const PASSIVE_SESSION_SOURCES = [
  ACTIVITY_SOURCE_BASELINE,
  ACTIVITY_SOURCE_LOCKED,
  ACTIVITY_SOURCE_PASSIVE,
] as const

export type PassiveCompareSource = (typeof PASSIVE_SESSION_SOURCES)[number]

export type SessionRowLike = {
  date: Date | string
  bedTime: Date | string
  wakeTime: Date | string
  source: string
}

/** Local calendar midnight for the sleep day containing `at`. */
export function sleepDayMidnight(at: Date): Date {
  const d = new Date(at.getFullYear(), at.getMonth(), at.getDate())
  d.setHours(0, 0, 0, 0)
  return d
}

export function sleepDayKey(at: Date): string {
  const d = sleepDayMidnight(at)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

/** Build the passive-ongoing POST body from continuous detection bed/wake. */
export function buildPassiveOngoingSession(input: {
  bedTime: Date
  wakeTime: Date
  stepsCount?: number
}): {
  date: Date
  bedTime: Date
  wakeTime: Date
  source: typeof ACTIVITY_SOURCE_PASSIVE
  stepsCount: number
} {
  return {
    date: sleepDayMidnight(input.bedTime),
    bedTime: input.bedTime,
    wakeTime: input.wakeTime,
    source: ACTIVITY_SOURCE_PASSIVE,
    stepsCount: input.stepsCount ?? 0,
  }
}

/** Build the locked-schedule row (enforced times). */
export function buildLockedScheduleSession(input: {
  bedTime: Date
  wakeTime: Date
  homeArrivalTime?: Date | null
  stepsCount?: number
}): {
  date: Date
  bedTime: Date
  wakeTime: Date
  source: typeof ACTIVITY_SOURCE_LOCKED
  stepsCount: number
  homeArrivalTime: Date | null
} {
  const anchor = input.homeArrivalTime ?? input.bedTime
  return {
    date: sleepDayMidnight(anchor),
    bedTime: input.bedTime,
    wakeTime: input.wakeTime,
    source: ACTIVITY_SOURCE_LOCKED,
    stepsCount: input.stepsCount ?? 0,
    homeArrivalTime: input.homeArrivalTime ?? null,
  }
}

export function filterSessionsBySource<T extends { source: string }>(
  sessions: T[],
  source: PassiveCompareSource
): T[] {
  return sessions.filter((s) => s.source === source)
}

/**
 * Same sleep day: one passive (detected) + one locked (enforced), queryable apart.
 */
export function sameNightDualSources(input: {
  sessions: SessionRowLike[]
  sleepDayKey: string
}): {
  passive: SessionRowLike | null
  locked: SessionRowLike | null
  ok: boolean
} {
  const onDay = input.sessions.filter((s) => {
    const d = s.date instanceof Date ? s.date : new Date(s.date)
    return sleepDayKey(d) === input.sleepDayKey
  })
  const passive =
    onDay.find((s) => s.source === ACTIVITY_SOURCE_PASSIVE) ?? null
  const locked =
    onDay.find((s) => s.source === ACTIVITY_SOURCE_LOCKED) ?? null
  return {
    passive,
    locked,
    ok: passive != null && locked != null,
  }
}
