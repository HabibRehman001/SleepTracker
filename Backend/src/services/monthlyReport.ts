/**
 * Step 102–103 — Monthly report aggregator + month-over-month comparison.
 */

import { format, subMonths } from 'date-fns'

import {
  computeCorrelations,
  generateInsights,
  sleepDurationMinutes,
} from './analytics.service'
import { mean } from './experimentComparison'
import type { SleepEntryWithRelations } from '../types'

export type MonthlyReport = {
  month: string
  entryCount: number
  avgDuration: number | null
  avgQuality: number | null
  bestDay: SleepEntryWithRelations | null
  worstDay: SleepEntryWithRelations | null
  insights: string[]
}

/** JSON-safe month summary for the Reports API / frontend. */
export type MonthlyReportSummary = {
  month: string
  entryCount: number
  avgDuration: number | null
  avgQuality: number | null
  bestDayQuality: number | null
  worstDayQuality: number | null
  bestDayDate: string | null
  worstDayDate: string | null
  insights: string[]
}

export type MetricDirection = 'up' | 'down' | 'flat' | 'unknown'

/** Improvement semantics for the UI (green = improved). */
export type MetricTone = 'improved' | 'regressed' | 'unchanged' | 'neutral'

export type ComparedMetric = {
  key: string
  label: string
  current: number | null
  previous: number | null
  delta: number | null
  /** Numeric direction: current − previous. */
  direction: MetricDirection
  /** Whether the change is an improvement (higherIsBetter). */
  tone: MetricTone
}

export type MonthCompareResult = {
  currentMonth: string
  previousMonth: string
  current: MonthlyReportSummary
  previous: MonthlyReportSummary
  metrics: ComparedMetric[]
}

/** Calendar month key matching date-fns `yyyy-MM` (local timezone). */
export function entryMonthKey(date: Date): string {
  return format(date, 'yyyy-MM')
}

export function entryDayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Highest sleepQuality among entries with a quality score; first wins ties. */
export function maxBySleepQuality(
  entries: SleepEntryWithRelations[]
): SleepEntryWithRelations | null {
  let best: SleepEntryWithRelations | null = null
  for (const entry of entries) {
    if (!isFiniteNumber(entry.sleepQuality)) continue
    if (
      best == null ||
      !isFiniteNumber(best.sleepQuality) ||
      entry.sleepQuality > best.sleepQuality
    ) {
      best = entry
    }
  }
  return best
}

/** Lowest sleepQuality among entries with a quality score; first wins ties. */
export function minBySleepQuality(
  entries: SleepEntryWithRelations[]
): SleepEntryWithRelations | null {
  let worst: SleepEntryWithRelations | null = null
  for (const entry of entries) {
    if (!isFiniteNumber(entry.sleepQuality)) continue
    if (
      worst == null ||
      !isFiniteNumber(worst.sleepQuality) ||
      entry.sleepQuality < worst.sleepQuality
    ) {
      worst = entry
    }
  }
  return worst
}

/**
 * Aggregate one calendar month of sleep entries into a report payload.
 * @param month - `yyyy-MM` (e.g. `"2026-07"`)
 */
export function buildMonthlyReport(
  entries: SleepEntryWithRelations[],
  month: string
): MonthlyReport {
  const monthEntries = entries.filter((e) => entryMonthKey(e.date) === month)
  const durations = monthEntries
    .map(sleepDurationMinutes)
    .filter(isFiniteNumber)
  const qualities = monthEntries
    .map((e) => e.sleepQuality)
    .filter(isFiniteNumber)

  return {
    month,
    entryCount: monthEntries.length,
    avgDuration: mean(durations),
    avgQuality: mean(qualities),
    bestDay: maxBySleepQuality(monthEntries),
    worstDay: minBySleepQuality(monthEntries),
    insights: generateInsights(computeCorrelations(monthEntries)),
  }
}

export function toMonthlyReportSummary(
  report: MonthlyReport
): MonthlyReportSummary {
  return {
    month: report.month,
    entryCount: report.entryCount,
    avgDuration: report.avgDuration,
    avgQuality: report.avgQuality,
    bestDayQuality: report.bestDay?.sleepQuality ?? null,
    worstDayQuality: report.worstDay?.sleepQuality ?? null,
    bestDayDate: report.bestDay ? entryDayKey(report.bestDay.date) : null,
    worstDayDate: report.worstDay ? entryDayKey(report.worstDay.date) : null,
    insights: report.insights,
  }
}

/**
 * Arrow direction from a numeric delta (current − previous).
 * Tiny floats near zero count as flat.
 */
export function metricDirection(
  current: number | null,
  previous: number | null,
  epsilon = 1e-9
): MetricDirection {
  if (!isFiniteNumber(current) || !isFiniteNumber(previous)) return 'unknown'
  const delta = current - previous
  if (Math.abs(delta) <= epsilon) return 'flat'
  return delta > 0 ? 'up' : 'down'
}

/**
 * Map direction → improvement tone. All report metrics use higher-is-better.
 */
export function metricTone(
  direction: MetricDirection,
  higherIsBetter = true
): MetricTone {
  if (direction === 'unknown') return 'neutral'
  if (direction === 'flat') return 'unchanged'
  const upIsGood = higherIsBetter
  if (direction === 'up') return upIsGood ? 'improved' : 'regressed'
  return upIsGood ? 'regressed' : 'improved'
}

type MetricDef = {
  key: string
  label: string
  get: (s: MonthlyReportSummary) => number | null
  higherIsBetter?: boolean
}

const COMPARE_METRICS: MetricDef[] = [
  {
    key: 'avgQuality',
    label: 'Avg quality',
    get: (s) => s.avgQuality,
  },
  {
    key: 'avgDuration',
    label: 'Avg duration',
    get: (s) => s.avgDuration,
  },
  {
    key: 'bestDayQuality',
    label: 'Best night',
    get: (s) => s.bestDayQuality,
  },
  {
    key: 'worstDayQuality',
    label: 'Worst night',
    get: (s) => s.worstDayQuality,
  },
]

/** Compare two month summaries → metrics with up/down + improved/regressed. */
export function compareMonthlySummaries(
  current: MonthlyReportSummary,
  previous: MonthlyReportSummary
): ComparedMetric[] {
  return COMPARE_METRICS.map((def) => {
    const cur = def.get(current)
    const prev = def.get(previous)
    const direction = metricDirection(cur, prev)
    const higherIsBetter = def.higherIsBetter !== false
    const delta =
      isFiniteNumber(cur) && isFiniteNumber(prev) ? cur - prev : null
    return {
      key: def.key,
      label: def.label,
      current: cur,
      previous: prev,
      delta,
      direction,
      tone: metricTone(direction, higherIsBetter),
    }
  })
}

export function previousMonthKey(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return format(subMonths(d, 1), 'yyyy-MM')
}

export function currentAndPreviousMonthKeys(
  now: Date = new Date()
): { currentMonth: string; previousMonth: string } {
  return {
    currentMonth: format(now, 'yyyy-MM'),
    previousMonth: format(subMonths(now, 1), 'yyyy-MM'),
  }
}

/**
 * This-month vs last-month report (Step 103).
 * Optional `currentMonth` override (`yyyy-MM`); previous is always one month prior.
 */
export function buildMonthOverMonthCompare(
  entries: SleepEntryWithRelations[],
  currentMonth?: string,
  now: Date = new Date()
): MonthCompareResult {
  const keys = currentMonth
    ? {
        currentMonth,
        previousMonth: previousMonthKey(currentMonth),
      }
    : currentAndPreviousMonthKeys(now)

  const current = toMonthlyReportSummary(
    buildMonthlyReport(entries, keys.currentMonth)
  )
  const previous = toMonthlyReportSummary(
    buildMonthlyReport(entries, keys.previousMonth)
  )

  return {
    ...keys,
    current,
    previous,
    metrics: compareMonthlySummaries(current, previous),
  }
}
