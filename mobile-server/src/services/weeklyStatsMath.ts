/**
 * Step 203 — weekly aggregation from passive-ongoing sessions only.
 * Same ideas as monthly stats (duration / adherence), windowed to past 7 days.
 * Pure — computed fresh from session rows (no hardcoded averages).
 */

import { computeScheduleAdherence } from './scheduleAdherenceMath'

export const WEEKLY_STATS_DAYS = 7
export const PASSIVE_ONGOING_SOURCE = 'passive-ongoing' as const

export type WeeklyNightInput = {
  date: Date | string
  bedTime: Date | string
  wakeTime: Date | string
  source?: string
}

export type WeeklyNightRow = {
  sleepDayKey: string
  date: Date
  bedTime: Date
  wakeTime: Date
  durationMinutes: number
  /** null when no locked schedule to compare. */
  adherenceMinutes: number | null
}

export type WeeklyStatsResult = {
  /** Inclusive local-calendar start of the 7-day window. */
  from: Date
  /** Exclusive end (now's local midnight + 1 day, or as-of day end). */
  to: Date
  /** Days in window (always 7 for the default job). */
  days: number
  nightCount: number
  nights: WeeklyNightRow[]
  avgDurationMinutes: number | null
  avgAdherenceMinutes: number | null
  lockedSleepTime: string | null
}

function asDate(value: Date | string): Date {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date in weekly session')
  }
  return d
}

export function sleepDayKey(at: Date): string {
  const y = at.getFullYear()
  const mo = String(at.getMonth() + 1).padStart(2, '0')
  const day = String(at.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

/** Local midnight for calendar day of `at`. */
export function localMidnight(at: Date): Date {
  const d = new Date(at.getFullYear(), at.getMonth(), at.getDate())
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Past N local calendar days ending today (inclusive), as [from, to).
 * Example: days=7, now=Wed → from = last Thursday 00:00, to = tomorrow 00:00.
 */
export function weeklyWindowBounds(
  now: Date = new Date(),
  days: number = WEEKLY_STATS_DAYS
): { from: Date; to: Date } {
  const today = localMidnight(now)
  const to = new Date(today)
  to.setDate(to.getDate() + 1)
  const from = new Date(today)
  from.setDate(from.getDate() - (days - 1))
  return { from, to }
}

export function durationMinutes(bedTime: Date, wakeTime: Date): number {
  return Math.round((wakeTime.getTime() - bedTime.getTime()) / 60_000)
}

function meanRounded(values: number[]): number | null {
  if (!values.length) return null
  const sum = values.reduce((a, b) => a + b, 0)
  return Math.round(sum / values.length)
}

/**
 * Build weekly stats from session rows. Filters to passive-ongoing, past window.
 * Averages are computed from the included nights — never hardcoded.
 */
export function buildWeeklyStats(input: {
  sessions: WeeklyNightInput[]
  lockedSleepTime?: string | null
  now?: Date
  days?: number
}): WeeklyStatsResult {
  const days = input.days ?? WEEKLY_STATS_DAYS
  const now = input.now ?? new Date()
  const { from, to } = weeklyWindowBounds(now, days)
  const lockedSleepTime = input.lockedSleepTime ?? null

  const nights: WeeklyNightRow[] = []

  for (const row of input.sessions) {
    if (row.source != null && row.source !== PASSIVE_ONGOING_SOURCE) {
      continue
    }
    const date = localMidnight(asDate(row.date))
    if (date.getTime() < from.getTime() || date.getTime() >= to.getTime()) {
      continue
    }
    const bedTime = asDate(row.bedTime)
    const wakeTime = asDate(row.wakeTime)
    const dur = durationMinutes(bedTime, wakeTime)
    if (!(dur > 0)) continue

    let adherenceMinutes: number | null = null
    if (lockedSleepTime) {
      adherenceMinutes = computeScheduleAdherence({
        passiveSession: { bedTime },
        lockedSchedule: { sleepTime: lockedSleepTime },
      }).adherenceMinutes
    }

    nights.push({
      sleepDayKey: sleepDayKey(date),
      date,
      bedTime,
      wakeTime,
      durationMinutes: dur,
      adherenceMinutes,
    })
  }

  nights.sort((a, b) => a.date.getTime() - b.date.getTime())

  const durations = nights.map((n) => n.durationMinutes)
  const adherences = nights
    .map((n) => n.adherenceMinutes)
    .filter((n): n is number => n != null && Number.isFinite(n))

  return {
    from,
    to,
    days,
    nightCount: nights.length,
    nights,
    avgDurationMinutes: meanRounded(durations),
    avgAdherenceMinutes: meanRounded(adherences),
    lockedSleepTime,
  }
}
