import {
  aggregateMonthlyStats,
  type MonthlyStats,
} from './monthlyStats.service'

export type ComparisonDeltas = {
  sessionCount: number | null
  avgDurationMinutes: number | null
  consistencyScore: number | null
  avgStepsCount: number | null
  /** Signed circular delta in minutes (positive = later). */
  avgBedTimeMinutes: number | null
  avgWakeTimeMinutes: number | null
}

export type MonthComparison = {
  thisMonth: MonthlyStats
  lastMonth: MonthlyStats
  /** True when a majority of higher-is-better metrics moved up. */
  improved: boolean
  deltas: ComparisonDeltas
}

const MINUTES_PER_DAY = 24 * 60

export function utcMonthKey(date: Date = new Date()): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function previousUtcMonthKey(month: string): string {
  const [y, m] = month.split('-').map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    throw new Error(`Invalid month key: ${month}`)
  }
  const d = new Date(Date.UTC(y, m - 2, 1))
  return utcMonthKey(d)
}

export function emptyMonthStats(month: string): MonthlyStats {
  return {
    month,
    sessionCount: 0,
    avgDurationMinutes: null,
    avgDurationHours: null,
    avgBedTime: null,
    avgWakeTime: null,
    consistencyScore: 0,
    avgStepsCount: null,
  }
}

function parseClockToMinutes(clock: string | null): number | null {
  if (clock == null) return null
  const match = /^(\d{2}):(\d{2})$/.exec(clock)
  if (!match) return null
  const hh = Number(match[1])
  const mm = Number(match[2])
  if (hh > 23 || mm > 59) return null
  return hh * 60 + mm
}

function signedCircularDelta(
  current: number | null,
  previous: number | null
): number | null {
  if (current == null || previous == null) return null
  let delta = current - previous
  if (delta > MINUTES_PER_DAY / 2) delta -= MINUTES_PER_DAY
  if (delta < -MINUTES_PER_DAY / 2) delta += MINUTES_PER_DAY
  return Math.round(delta)
}

function numericDelta(
  current: number | null,
  previous: number | null
): number | null {
  if (current == null || previous == null) return null
  return Math.round((current - previous) * 10) / 10
}

export function computeDeltas(
  thisMonth: MonthlyStats,
  lastMonth: MonthlyStats
): ComparisonDeltas {
  return {
    sessionCount: thisMonth.sessionCount - lastMonth.sessionCount,
    avgDurationMinutes: numericDelta(
      thisMonth.avgDurationMinutes,
      lastMonth.avgDurationMinutes
    ),
    consistencyScore: numericDelta(
      thisMonth.consistencyScore,
      lastMonth.consistencyScore
    ),
    avgStepsCount: numericDelta(
      thisMonth.avgStepsCount,
      lastMonth.avgStepsCount
    ),
    avgBedTimeMinutes: signedCircularDelta(
      parseClockToMinutes(thisMonth.avgBedTime),
      parseClockToMinutes(lastMonth.avgBedTime)
    ),
    avgWakeTimeMinutes: signedCircularDelta(
      parseClockToMinutes(thisMonth.avgWakeTime),
      parseClockToMinutes(lastMonth.avgWakeTime)
    ),
  }
}

/**
 * Higher-is-better: duration, consistency, steps.
 * Improved when more of those deltas are positive than negative.
 * Flat / missing metrics do not count as votes.
 */
export function didImprove(deltas: ComparisonDeltas): boolean {
  const votes: boolean[] = []
  if (deltas.avgDurationMinutes != null && deltas.avgDurationMinutes !== 0) {
    votes.push(deltas.avgDurationMinutes > 0)
  }
  if (deltas.consistencyScore != null && deltas.consistencyScore !== 0) {
    votes.push(deltas.consistencyScore > 0)
  }
  if (deltas.avgStepsCount != null && deltas.avgStepsCount !== 0) {
    votes.push(deltas.avgStepsCount > 0)
  }
  if (votes.length === 0) return false
  const ups = votes.filter(Boolean).length
  return ups > votes.length - ups
}

/**
 * This calendar month vs previous (UTC yyyy-MM).
 * Optional `month` override for testing / backfill (`yyyy-MM`).
 */
export async function buildMonthComparison(
  month?: string,
  now: Date = new Date()
): Promise<MonthComparison> {
  const thisKey = month ?? utcMonthKey(now)
  const lastKey = previousUtcMonthKey(thisKey)

  const months = await aggregateMonthlyStats(36)
  const byKey = new Map(months.map((m) => [m.month, m]))

  const thisMonth = byKey.get(thisKey) ?? emptyMonthStats(thisKey)
  const lastMonth = byKey.get(lastKey) ?? emptyMonthStats(lastKey)
  const deltas = computeDeltas(thisMonth, lastMonth)

  return {
    thisMonth,
    lastMonth,
    improved: didImprove(deltas),
    deltas,
  }
}
