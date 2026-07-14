import { differenceInMinutes } from 'date-fns'
import type {
  AnalyticsSummary,
  CorrelationResult,
  FactorCorrelation,
  LinearRegression,
  ScatterCorrelation,
  ScatterPoint,
  SleepEntryWithRelations,
  StatsSummary,
} from '../types'
import {
  filterEntriesByAnalyticsRange,
  type AnalyticsDateRange,
} from '../utils/analyticsRange'
import {
  generateInsightSentences,
  type InsightCandidate,
} from './insightTemplates'

export type { AnalyticsDateRange } from '../utils/analyticsRange'
export {
  analyticsRangeCutoffKey,
  analyticsRangeDayCount,
  entryDateKey,
  filterEntriesByAnalyticsRange,
  parseAnalyticsDateRange,
} from '../utils/analyticsRange'
export { rollingAverage } from '../utils/rollingAverage'
import { longestStreak } from '../utils/streaks'
export { longestStreak }

export {
  generateInsightSentences,
  insightEffectSize,
  insightTemplates,
  MAX_RANKED_INSIGHTS,
  rankInsightCandidates,
  type InsightCandidate,
  type InsightTemplate,
} from './insightTemplates'

const TARGET_MINUTES = 8 * 60
const MINUTES_PER_DAY = 24 * 60

export { TARGET_MINUTES }

/**
 * Pure Pearson correlation — no Express, no Prisma.
 * Unit-testable with plain number arrays.
 */
export function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 2) {
    return null
  }

  const n = xs.length
  const meanX = xs.reduce((sum, value) => sum + value, 0) / n
  const meanY = ys.reduce((sum, value) => sum + value, 0) / n

  let numerator = 0
  let denomX = 0
  let denomY = 0

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    numerator += dx * dy
    denomX += dx * dx
    denomY += dy * dy
  }

  const denominator = Math.sqrt(denomX * denomY)
  if (denominator === 0) {
    return null
  }

  return numerator / denominator
}

/**
 * Ordinary least-squares: y ≈ slope·x + intercept (Step 86 trend lines).
 * Returns null when n &lt; 2 or when x has zero variance.
 */
export function linearRegression(
  xs: number[],
  ys: number[]
): LinearRegression | null {
  if (xs.length !== ys.length || xs.length < 2) {
    return null
  }

  const n = xs.length
  const meanX = xs.reduce((sum, v) => sum + v, 0) / n
  const meanY = ys.reduce((sum, v) => sum + v, 0) / n

  let ssxx = 0
  let ssxy = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    ssxx += dx * dx
    ssxy += dx * (ys[i] - meanY)
  }

  if (ssxx === 0) {
    return null
  }

  const slope = ssxy / ssxx
  const intercept = meanY - slope * meanX
  return {
    slope: round(slope, 6),
    intercept: round(intercept, 6),
    n,
  }
}

/** Endpoints of the OLS trend segment spanning the observed x-range. */
export function regressionTrendEndpoints(
  regression: LinearRegression,
  xs: number[]
): [{ x: number; y: number }, { x: number; y: number }] | null {
  if (xs.length === 0) return null
  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  return [
    { x: xMin, y: regression.slope * xMin + regression.intercept },
    { x: xMax, y: regression.slope * xMax + regression.intercept },
  ]
}

/**
 * OLS slope for `[x, y]` pairs (Step 92).
 * `linearRegressionSlope(last14Days.map((e, i) => [i, minutesSinceMidnight(e.bedTime)]))`
 */
export function linearRegressionSlope(
  points: Array<[number, number]>
): number | null {
  if (points.length < 2) return null
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const fit = linearRegression(xs, ys)
  return fit?.slope ?? null
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/** Alias used by correlateBoolean (Step 69). */
function mean(values: number[]): number | null {
  return average(values)
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export type BooleanGroupStats = {
  avg: number | null
  n: number
}

export type BooleanCorrelation = {
  groupA: BooleanGroupStats
  groupB: BooleanGroupStats
}

/**
 * Generic boolean-factor vs numeric-outcome split (Step 69).
 * One function for any factorFn / outcomeFn — no bespoke code per correlation.
 *
 * factorFn → true = groupA, false = groupB, null = skip entry.
 * Outcomes that are null/NaN are dropped before averaging.
 */
export function correlateBoolean<T>(
  entries: T[],
  factorFn: (entry: T) => boolean | null,
  outcomeFn: (entry: T) => number | null
): BooleanCorrelation {
  const groupA = entries
    .filter((e) => factorFn(e) === true)
    .map(outcomeFn)
    .filter(isNumber)
  const groupB = entries
    .filter((e) => factorFn(e) === false)
    .map(outcomeFn)
    .filter(isNumber)

  return {
    groupA: { avg: mean(groupA), n: groupA.length },
    groupB: { avg: mean(groupB), n: groupB.length },
  }
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/**
 * Sleep duration in minutes using full timestamps (handles overnight correctly).
 * Prefer estimatedSleepTime → wakeTime; fall back to attempt/bed if needed.
 *
 * Example (same calendar date timestamps):
 *   estimated 2026-07-09T04:00Z, wake 2026-07-09T12:00Z → 480
 * Overnight:
 *   estimated 2026-07-09T23:30Z, wake 2026-07-10T07:00Z → 450
 */
export function sleepDurationMinutes(
  entry: Pick<
    SleepEntryWithRelations,
    'estimatedSleepTime' | 'attemptSleepTime' | 'bedTime' | 'wakeTime'
  >
): number | null {
  const sleepStart =
    entry.estimatedSleepTime ?? entry.attemptSleepTime ?? entry.bedTime

  if (!sleepStart || !entry.wakeTime) {
    return null
  }

  const minutes = differenceInMinutes(entry.wakeTime, sleepStart)
  if (minutes <= 0) {
    return null
  }

  return minutes
}

/** Sleep duration in hours — derived from sleepDurationMinutes. */
export function sleepDurationHours(entry: SleepEntryWithRelations): number | null {
  const minutes = sleepDurationMinutes(entry)
  if (minutes === null) {
    return null
  }
  return minutes / 60
}

/**
 * Rolling 7-day sleep debt in minutes vs an 8-hour target.
 * Only deficits count (Math.max(0, …)); missing duration counts as on-target (0 debt that night).
 */
export function sleepDebt(
  entries: Array<
    Pick<
      SleepEntryWithRelations,
      'estimatedSleepTime' | 'attemptSleepTime' | 'bedTime' | 'wakeTime'
    >
  >
): number {
  return entries.slice(-7).reduce((debt, entry) => {
    const duration = sleepDurationMinutes(entry) ?? TARGET_MINUTES
    return debt + Math.max(0, TARGET_MINUTES - duration)
  }, 0)
}

export type CumulativeSleepDebtPoint = {
  /** Entry calendar date key (YYYY-MM-DD). */
  date: string
  /** Running debt after this night (minutes, never negative). */
  debtMinutes: number
  /**
   * Night contribution: positive = deficit added, negative = recovery applied.
   * TARGET − duration (missing duration → 0 delta).
   */
  nightDelta: number
}

type DurationFields = Pick<
  SleepEntryWithRelations,
  'date' | 'estimatedSleepTime' | 'attemptSleepTime' | 'bedTime' | 'wakeTime'
>

function entryDurationDeltaMinutes(entry: DurationFields): number {
  const duration = sleepDurationMinutes(entry)
  if (duration == null) return 0
  return TARGET_MINUTES - duration
}

/**
 * Step 93 — running cumulative sleep debt (all nights, chronological).
 * Deficits accumulate; nights above target apply recovery (`debt = max(0, debt + delta)`).
 * A single surplus night reduces debt but does not wipe it.
 */
export function cumulativeSleepDebtSeries(
  entries: DurationFields[]
): CumulativeSleepDebtPoint[] {
  const sorted = [...entries].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )

  let debt = 0
  const series: CumulativeSleepDebtPoint[] = []

  for (const entry of sorted) {
    const nightDelta = entryDurationDeltaMinutes(entry)
    debt = Math.max(0, debt + nightDelta)
    const d = entry.date
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    series.push({
      date: `${y}-${m}-${day}`,
      debtMinutes: debt,
      nightDelta,
    })
  }

  return series
}

/** Final cumulative sleep debt in minutes (Step 93). */
export function cumulativeSleepDebt(entries: DurationFields[]): number {
  const series = cumulativeSleepDebtSeries(entries)
  if (series.length === 0) return 0
  return series[series.length - 1].debtMinutes
}

/** Quality helper for streak predicates (Step 95). */
export function sleepQuality(
  entry: Pick<SleepEntryWithRelations, 'sleepQuality'>
): number | null {
  const q = entry.sleepQuality
  return q != null && Number.isFinite(q) ? q : null
}

function entryDateKeyLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Longest streak after sorting by calendar date (ascending).
 * `longestStreak(entries, (e) => (sleepQuality(e) ?? 0) >= 7)`
 */
export function longestStreakByDate<T extends { date: Date }>(
  entries: readonly T[],
  predicate: (entry: T) => boolean
): number {
  const sorted = [...entries].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )
  return longestStreak(sorted, predicate)
}

export type ExtremeNight = {
  value: number
  date: string
  id: string
}

export type PersonalRecord = {
  key: string
  label: string
  /** When true, best = max; when false (e.g. latency), best = min. */
  higherIsBetter: boolean
  best: ExtremeNight | null
  worst: ExtremeNight | null
}

type MetricSpec = {
  key: string
  label: string
  higherIsBetter: boolean
  getValue: (e: SleepEntryWithRelations) => number | null
}

const PERSONAL_RECORD_METRICS: MetricSpec[] = [
  {
    key: 'sleepQuality',
    label: 'Sleep quality',
    higherIsBetter: true,
    getValue: (e) => sleepQuality(e),
  },
  {
    key: 'durationMinutes',
    label: 'Sleep duration',
    higherIsBetter: true,
    getValue: (e) => sleepDurationMinutes(e),
  },
  {
    key: 'latencyMinutes',
    label: 'Sleep latency',
    higherIsBetter: false,
    getValue: (e) => latencyMinutes(e),
  },
]

function extremeFromEntry(
  entry: SleepEntryWithRelations,
  value: number
): ExtremeNight {
  return {
    value,
    date: entryDateKeyLocal(entry.date),
    id: entry.id,
  }
}

/**
 * Single best / worst night for quality, duration, and latency (Step 95).
 * Latency treats lower as better.
 */
export function computePersonalRecords(
  entries: SleepEntryWithRelations[]
): PersonalRecord[] {
  return PERSONAL_RECORD_METRICS.map((metric) => {
    let best: ExtremeNight | null = null
    let worst: ExtremeNight | null = null

    for (const entry of entries) {
      const value = metric.getValue(entry)
      if (value == null || !Number.isFinite(value)) continue

      const night = extremeFromEntry(entry, value)
      if (best == null) {
        best = night
        worst = night
        continue
      }

      if (metric.higherIsBetter) {
        if (value > best.value) best = night
        if (value < worst!.value) worst = night
      } else {
        if (value < best.value) best = night
        if (value > worst!.value) worst = night
      }
    }

    return {
      key: metric.key,
      label: metric.label,
      higherIsBetter: metric.higherIsBetter,
      best,
      worst,
    }
  })
}

/**
 * Sleep latency in minutes: attemptSleepTime → estimatedSleepTime.
 * Core correlation metric — no bedTime fallback (must have both timestamps).
 */
export function latencyMinutes(
  entry: Pick<SleepEntryWithRelations, 'attemptSleepTime' | 'estimatedSleepTime'>
): number | null {
  if (!entry.attemptSleepTime || !entry.estimatedSleepTime) {
    return null
  }

  const minutes = differenceInMinutes(
    entry.estimatedSleepTime,
    entry.attemptSleepTime
  )
  if (minutes < 0) {
    return null
  }

  return minutes
}

/** @deprecated Prefer latencyMinutes */
export function sleepLatencyMinutes(
  entry: Pick<SleepEntryWithRelations, 'attemptSleepTime' | 'estimatedSleepTime'>
): number | null {
  return latencyMinutes(entry)
}

/** Minutes from local midnight (0–1439). */
export function minutesSinceMidnight(date: Date | null | undefined): number | null {
  if (!date) {
    return null
  }
  return date.getHours() * 60 + date.getMinutes()
}

/** @deprecated Prefer minutesSinceMidnight */
export function clockMinutes(date: Date): number {
  return minutesSinceMidnight(date) ?? 0
}

function circularMeanMinutes(minutesList: number[]): number | null {
  if (minutesList.length === 0) {
    return null
  }

  let sinSum = 0
  let cosSum = 0

  for (const minutes of minutesList) {
    const angle = (minutes / MINUTES_PER_DAY) * 2 * Math.PI
    sinSum += Math.sin(angle)
    cosSum += Math.cos(angle)
  }

  const meanAngle = Math.atan2(sinSum / minutesList.length, cosSum / minutesList.length)
  let meanMinutes = (meanAngle / (2 * Math.PI)) * MINUTES_PER_DAY
  if (meanMinutes < 0) {
    meanMinutes += MINUTES_PER_DAY
  }

  return meanMinutes
}

/** Shortest distance on the 24h clock (0–720). */
export function circularDiffMinutes(a: number, b: number): number {
  const d = Math.abs(a - b) % MINUTES_PER_DAY
  return Math.min(d, MINUTES_PER_DAY - d)
}

/**
 * Unwrap clock minutes so successive samples stay continuous across midnight
 * (for circadian OLS — avoids 23:50 → 00:10 looking like a −23h jump).
 */
export function unwrapClockMinutes(minutes: number[]): number[] {
  if (minutes.length === 0) return []
  const out = [minutes[0]]
  for (let i = 1; i < minutes.length; i++) {
    let m = minutes[i]
    const prev = out[i - 1]
    while (m - prev > MINUTES_PER_DAY / 2) m -= MINUTES_PER_DAY
    while (prev - m > MINUTES_PER_DAY / 2) m += MINUTES_PER_DAY
    out.push(m)
  }
  return out
}

function formatClock(minutes: number): string {
  const normalized = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Population standard deviation of a numeric series.
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) {
    return 0
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

/** Circular stdev of clock minutes (handles midnight wrap). */
function circularStdDevMinutes(minutesList: number[]): number {
  if (minutesList.length < 2) {
    return 0
  }

  const meanMinutes = circularMeanMinutes(minutesList)
  if (meanMinutes === null) {
    return 0
  }

  const squared = minutesList.map((minutes) => {
    let delta = minutes - meanMinutes
    if (delta > MINUTES_PER_DAY / 2) delta -= MINUTES_PER_DAY
    if (delta < -MINUTES_PER_DAY / 2) delta += MINUTES_PER_DAY
    return delta * delta
  })

  return Math.sqrt(squared.reduce((sum, value) => sum + value, 0) / squared.length)
}

/**
 * Bedtime consistency 0–100: lower bedtime stdev → higher score.
 * score = 100 - min(100, stdevMinutes)
 */
export function consistencyScore(
  entries: Array<Pick<SleepEntryWithRelations, 'bedTime'>>
): number {
  const bedtimes = entries
    .map((entry) => minutesSinceMidnight(entry.bedTime))
    .filter((value): value is number => value !== null)

  if (bedtimes.length < 2) {
    return 100
  }

  const stdev = circularStdDevMinutes(bedtimes)
  return round(100 - Math.min(100, stdev), 1)
}

function lastN<T>(items: T[], n: number): T[] {
  return items.slice(Math.max(0, items.length - n))
}

type FactorExtractor = (entry: SleepEntryWithRelations) => number | null

const PEARSON_FACTORS: { factor: string; extract: FactorExtractor }[] = [
  {
    factor: 'stress',
    extract: (entry) => entry.mood?.stress ?? null,
  },
  {
    factor: 'anxiety',
    extract: (entry) => entry.mood?.anxiety ?? null,
  },
  {
    factor: 'caffeineAmountMg',
    extract: (entry) => entry.food?.caffeineAmountMg ?? null,
  },
  {
    factor: 'minutesPhoneBeforeSleep',
    extract: (entry) => entry.environment?.minutesPhoneBeforeSleep ?? null,
  },
  {
    factor: 'exerciseDuration',
    extract: (entry) => entry.exercise?.duration ?? null,
  },
]

/**
 * Correlation summary over in-memory entries (existing analytics endpoint).
 */
export function computeAnalyticsSummary(
  entries: SleepEntryWithRelations[]
): AnalyticsSummary {
  const qualities = entries
    .map((entry) => entry.sleepQuality)
    .filter((value): value is number => value !== null)

  const correlations: CorrelationResult[] = PEARSON_FACTORS.flatMap(({ factor, extract }) => {
    const pairs = entries
      .map((entry) => {
        const quality = entry.sleepQuality
        const factorValue = extract(entry)
        if (quality === null || factorValue === null) {
          return null
        }
        return { quality, factorValue }
      })
      .filter((pair): pair is { quality: number; factorValue: number } => pair !== null)

    const coefficient = pearsonCorrelation(
      pairs.map((pair) => pair.factorValue),
      pairs.map((pair) => pair.quality)
    )

    if (coefficient === null) {
      return []
    }

    return [
      {
        factor,
        coefficient: Number(coefficient.toFixed(4)),
        sampleSize: pairs.length,
      },
    ]
  })

  return {
    entryCount: entries.length,
    averageSleepQuality:
      average(qualities) === null
        ? null
        : Number(average(qualities)!.toFixed(2)),
    correlations,
  }
}

/**
 * Dashboard stats — all derived from entries, nothing hardcoded.
 * Entries should be sorted by date ascending.
 */
export function computeSummary(entries: SleepEntryWithRelations[]): StatsSummary {
  const sorted = [...entries].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )

  const withDuration = sorted
    .map((entry) => ({ entry, hours: sleepDurationHours(entry) }))
    .filter((row): row is { entry: SleepEntryWithRelations; hours: number } => row.hours !== null)

  const last7 = lastN(withDuration, 7)
  const last30 = lastN(withDuration, 30)

  const avg7day =
    last7.length === 0
      ? null
      : round(last7.reduce((sum, row) => sum + row.hours, 0) / last7.length, 2)

  const avg30day =
    last30.length === 0
      ? null
      : round(last30.reduce((sum, row) => sum + row.hours, 0) / last30.length, 2)

  const todaySleep =
    withDuration.length === 0
      ? null
      : round(withDuration[withDuration.length - 1].hours, 2)

  const bedMinutes = sorted
    .map((entry) => entry.bedTime)
    .filter((value): value is Date => value !== null)
    .map((date) => minutesSinceMidnight(date)!)

  const wakeMinutes = sorted
    .map((entry) => entry.wakeTime)
    .filter((value): value is Date => value !== null)
    .map((date) => minutesSinceMidnight(date)!)

  const avgBed = circularMeanMinutes(bedMinutes)
  const avgWake = circularMeanMinutes(wakeMinutes)

  const latencies = sorted
    .map(latencyMinutes)
    .filter((value): value is number => value !== null)

  return {
    todaySleep,
    sleepDebt: sleepDebt(sorted),
    avg7day,
    avg30day,
    consistencyScore: consistencyScore(sorted),
    avgBedtime: avgBed === null ? null : formatClock(avgBed),
    avgWakeTime: avgWake === null ? null : formatClock(avgWake),
    avgLatency:
      latencies.length === 0 ? null : round(average(latencies)!, 1),
  }
}

/** Weekend = Sun (0) or Sat (6). */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * Weekend vs weekday bedtime shift in hours (Step 73).
 * Positive ⇒ weekends later than weekdays (linear minutes-since-midnight mean).
 */
export function weekendBedtimeShiftHours(
  entries: Array<Pick<SleepEntryWithRelations, 'date' | 'bedTime'>>
): number | null {
  const weekdayAvgBedtime = mean(
    entries
      .filter((e) => !isWeekend(e.date))
      .map((e) => minutesSinceMidnight(e.bedTime))
      .filter(isNumber)
  )
  const weekendAvgBedtime = mean(
    entries
      .filter((e) => isWeekend(e.date))
      .map((e) => minutesSinceMidnight(e.bedTime))
      .filter(isNumber)
  )
  if (weekdayAvgBedtime == null || weekendAvgBedtime == null) {
    return null
  }
  return (weekendAvgBedtime - weekdayAvgBedtime) / 60
}

/**
 * Spec format: "Weekends shift your bedtime by 4.8 hours."
 * Uses absolute hours to one decimal; null when either side has no bedtimes.
 */
export function formatWeekendBedtimeShift(
  entries: Array<Pick<SleepEntryWithRelations, 'date' | 'bedTime'>>
): string | null {
  const shiftHours = weekendBedtimeShiftHours(entries)
  if (shiftHours == null) {
    return null
  }
  const absHours = Math.round(Math.abs(shiftHours) * 10) / 10
  return `Weekends shift your bedtime by ${absHours.toFixed(1)} hours.`
}

/**
 * Step 91 — weekend (social) jetlag thresholds.
 * Minor from ~1h; moderate when the shift exceeds ~2 hours.
 */
export const WEEKEND_JETLAG_MINOR_HOURS = 1
export const WEEKEND_JETLAG_MODERATE_HOURS = 2

export type WeekendJetlagSeverity = 'none' | 'minor' | 'moderate'

export type WeekendJetlagResult = {
  /** Max of bedtime / wake Sunday-night vs weekday avg (hours). */
  jetlagHours: number
  bedtimeHours: number | null
  wakeHours: number | null
  severity: WeekendJetlagSeverity
  /** True when severity is minor or moderate. */
  flagged: boolean
}

function isSundayNight(date: Date): boolean {
  return date.getDay() === 0
}

/**
 * Hours by which Sunday-night / Monday-morning schedule drifts from weekday avg.
 * Bedtimes use circular clock mean + shortest-arc diff (midnight-safe);
 * wake uses the same. Equivalent to `Math.abs(…)/60` when both times are AM.
 */
export function weekendJetlagHours(
  entries: Array<
    Pick<SleepEntryWithRelations, 'date' | 'bedTime' | 'wakeTime'>
  >
): number | null {
  const result = detectWeekendJetlag(entries)
  return result?.jetlagHours ?? null
}

export function classifyWeekendJetlag(
  jetlagHours: number
): WeekendJetlagSeverity {
  if (jetlagHours >= WEEKEND_JETLAG_MODERATE_HOURS) return 'moderate'
  if (jetlagHours >= WEEKEND_JETLAG_MINOR_HOURS) return 'minor'
  return 'none'
}

/**
 * Compare Sunday-night bedtime & Monday-morning wake to weekday averages.
 * `mondayBedtime` = Sunday entry bedTime (sleep into Monday morning).
 */
export function detectWeekendJetlag(
  entries: Array<
    Pick<SleepEntryWithRelations, 'date' | 'bedTime' | 'wakeTime'>
  >
): WeekendJetlagResult | null {
  const weekdays = entries.filter((e) => !isWeekend(e.date))
  const sundayNights = entries.filter((e) => isSundayNight(e.date))

  const weekdayAvgBedtime = circularMeanMinutes(
    weekdays.map((e) => minutesSinceMidnight(e.bedTime)).filter(isNumber)
  )
  const weekdayAvgWake = circularMeanMinutes(
    weekdays.map((e) => minutesSinceMidnight(e.wakeTime)).filter(isNumber)
  )
  const mondayBedtime = circularMeanMinutes(
    sundayNights.map((e) => minutesSinceMidnight(e.bedTime)).filter(isNumber)
  )
  const mondayWake = circularMeanMinutes(
    sundayNights.map((e) => minutesSinceMidnight(e.wakeTime)).filter(isNumber)
  )

  const bedtimeHours =
    mondayBedtime != null && weekdayAvgBedtime != null
      ? circularDiffMinutes(mondayBedtime, weekdayAvgBedtime) / 60
      : null
  const wakeHours =
    mondayWake != null && weekdayAvgWake != null
      ? circularDiffMinutes(mondayWake, weekdayAvgWake) / 60
      : null

  if (bedtimeHours == null && wakeHours == null) {
    return null
  }

  const jetlagHours = Math.max(bedtimeHours ?? 0, wakeHours ?? 0)
  const severity = classifyWeekendJetlag(jetlagHours)
  return {
    jetlagHours,
    bedtimeHours,
    wakeHours,
    severity,
    flagged: severity !== 'none',
  }
}

/**
 * Insight copy when Sunday-night schedule drifts from weekdays.
 * e.g. "Minor weekend jetlag: Sunday night is 1.0h off your weekday average."
 */
export function formatWeekendJetlag(
  entries: Array<
    Pick<SleepEntryWithRelations, 'date' | 'bedTime' | 'wakeTime'>
  >
): string | null {
  const result = detectWeekendJetlag(entries)
  if (result == null || !result.flagged) {
    return null
  }
  const hours = Math.round(result.jetlagHours * 10) / 10
  if (result.severity === 'moderate') {
    return `Weekend jetlag: Sunday night is ${hours.toFixed(1)}h off your weekday average.`
  }
  return `Minor weekend jetlag: Sunday night is ${hours.toFixed(1)}h off your weekday average.`
}

/** Rolling window for bedtime-vs-day OLS (Step 92). */
export const CIRCADIAN_DRIFT_WINDOW_DAYS = 14

/**
 * Minimum |slope| (minutes/day) to flag circadian drift (filters numeric noise).
 * Steadily +10 min/day clearly exceeds this.
 */
export const CIRCADIAN_DRIFT_MIN_SLOPE = 1

export type CircadianDriftDirection = 'later' | 'earlier' | 'stable'

export type CircadianDriftResult = {
  /** Minutes of bedtime change per day-index (OLS slope). */
  slope: number
  direction: CircadianDriftDirection
  /** True when bedtime is trending later or earlier. */
  flagged: boolean
  n: number
}

/**
 * Sort by date, keep last N nights with bedTime, map to `[dayIndex, minutes]`.
 * Y values are midnight-unwrapped so OLS is not wrecked by late/early wrap.
 */
export function bedtimeDayIndexPoints(
  entries: Array<Pick<SleepEntryWithRelations, 'date' | 'bedTime'>>,
  windowDays = CIRCADIAN_DRIFT_WINDOW_DAYS
): Array<[number, number]> {
  const last = [...entries]
    .filter((e) => e.bedTime != null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-windowDays)

  const raw: number[] = []
  for (const e of last) {
    const minutes = minutesSinceMidnight(e.bedTime)
    if (minutes != null) raw.push(minutes)
  }
  const unwrapped = unwrapClockMinutes(raw)
  return unwrapped.map((y, i) => [i, y] as [number, number])
}

/**
 * OLS slope of bedtime (minutes since midnight) vs day index over the rolling window.
 * Positive ⇒ drifting later.
 */
export function circadianDriftSlope(
  entries: Array<Pick<SleepEntryWithRelations, 'date' | 'bedTime'>>,
  windowDays = CIRCADIAN_DRIFT_WINDOW_DAYS
): number | null {
  return linearRegressionSlope(bedtimeDayIndexPoints(entries, windowDays))
}

export function detectCircadianDrift(
  entries: Array<Pick<SleepEntryWithRelations, 'date' | 'bedTime'>>,
  windowDays = CIRCADIAN_DRIFT_WINDOW_DAYS
): CircadianDriftResult | null {
  const points = bedtimeDayIndexPoints(entries, windowDays)
  const slope = linearRegressionSlope(points)
  if (slope == null) return null

  let direction: CircadianDriftDirection = 'stable'
  if (slope >= CIRCADIAN_DRIFT_MIN_SLOPE) direction = 'later'
  else if (slope <= -CIRCADIAN_DRIFT_MIN_SLOPE) direction = 'earlier'

  return {
    slope,
    direction,
    flagged: direction !== 'stable',
    n: points.length,
  }
}

/**
 * Insight when bedtime trends day-over-day.
 * Positive slope → "drifting later."
 */
export function formatCircadianDrift(
  entries: Array<Pick<SleepEntryWithRelations, 'date' | 'bedTime'>>
): string | null {
  const result = detectCircadianDrift(entries)
  if (result == null || !result.flagged) return null

  const absSlope = Math.round(Math.abs(result.slope) * 10) / 10
  if (result.direction === 'later') {
    return `Your bedtime is drifting later (${absSlope} min/day over the last ${result.n} days).`
  }
  return `Your bedtime is drifting earlier (${absSlope} min/day over the last ${result.n} days).`
}

/**
 * Dashboard amber banner threshold for drift (Step 96).
 * Mild day-to-day noise (typical seed) stays below this; +10 min/day fixture still fires.
 */
export const CIRCADIAN_DRIFT_BANNER_MIN_SLOPE = 10

export type PatternWarning = {
  key: 'weekendJetlag' | 'circadianDrift'
  severity: 'warning'
  message: string
}

export type PatternHighlight = {
  key: 'goodNightStreak' | 'personalRecord' | 'cumulativeDebt'
  message: string
}

export type SmartPatternsResult = {
  /** Amber banners — only meaningful / triggered warnings. */
  warnings: PatternWarning[]
  /** Non-banner facts (streaks, records, debt). */
  highlights: PatternHighlight[]
}

/**
 * Aggregate smart detections for the dashboard Patterns card (Step 96).
 * Amber warnings: moderate weekend jetlag (≥2h) and strong circadian drift
 * (|slope| ≥ {@link CIRCADIAN_DRIFT_BANNER_MIN_SLOPE}).
 */
export function computeSmartPatterns(
  entries: SleepEntryWithRelations[]
): SmartPatternsResult {
  const warnings: PatternWarning[] = []
  const highlights: PatternHighlight[] = []

  const jetlag = detectWeekendJetlag(entries)
  if (jetlag?.flagged && jetlag.severity === 'moderate') {
    const message = formatWeekendJetlag(entries)
    if (message) {
      warnings.push({ key: 'weekendJetlag', severity: 'warning', message })
    }
  }

  const drift = detectCircadianDrift(entries)
  if (
    drift?.flagged &&
    Math.abs(drift.slope) >= CIRCADIAN_DRIFT_BANNER_MIN_SLOPE
  ) {
    const message = formatCircadianDrift(entries)
    if (message) {
      warnings.push({ key: 'circadianDrift', severity: 'warning', message })
    }
  }

  const goodStreak = longestStreakByDate(
    entries,
    (e) => (sleepQuality(e) ?? 0) >= 7
  )
  if (goodStreak >= 3) {
    highlights.push({
      key: 'goodNightStreak',
      message: `Longest streak of good nights (quality ≥ 7): ${goodStreak} days.`,
    })
  }

  const qualityRecord = computePersonalRecords(entries).find(
    (r) => r.key === 'sleepQuality'
  )
  if (qualityRecord?.best) {
    highlights.push({
      key: 'personalRecord',
      message: `Best sleep quality: ${qualityRecord.best.value} on ${qualityRecord.best.date}.`,
    })
  }

  const debt = cumulativeSleepDebt(entries)
  if (debt > 0) {
    const hours = Math.floor(debt / 60)
    const mins = Math.round(debt % 60)
    highlights.push({
      key: 'cumulativeDebt',
      message: `Cumulative sleep debt: ${hours}h ${mins}m.`,
    })
  }

  return { warnings, highlights }
}

/** Round °C to the nearest 2°C bucket center (Step 74). */
export function roomTempBucket(tempC: number): number {
  return Math.round(tempC / 2) * 2
}

export type OptimalRoomTempRange = {
  /** Winning bucket center (°C). */
  bucket: number
  /** Display range low = bucket, high = bucket + 2. */
  rangeLow: number
  rangeHigh: number
  avgQuality: number
  n: number
}

/**
 * Bucket by roomTemp (nearest 2°C); return the bucket with highest avg quality.
 */
export function optimalRoomTempRange(
  entries: Array<
    Pick<SleepEntryWithRelations, 'sleepQuality' | 'environment'>
  >
): OptimalRoomTempRange | null {
  const buckets = new Map<number, number[]>()

  for (const entry of entries) {
    const temp = entry.environment?.roomTemp
    const quality = entry.sleepQuality
    if (temp == null || quality == null || !Number.isFinite(temp)) {
      continue
    }
    const bucket = roomTempBucket(temp)
    const list = buckets.get(bucket)
    if (list) list.push(quality)
    else buckets.set(bucket, [quality])
  }

  let best: OptimalRoomTempRange | null = null

  for (const [bucket, qualities] of buckets) {
    const avgQuality = mean(qualities)
    if (avgQuality == null) continue
    if (
      best == null ||
      avgQuality > best.avgQuality ||
      (avgQuality === best.avgQuality && qualities.length > best.n)
    ) {
      best = {
        bucket,
        rangeLow: bucket,
        rangeHigh: bucket + 2,
        avgQuality: round(avgQuality, 2),
        n: qualities.length,
      }
    }
  }

  return best
}

/** Insight sentence for the optimal room-temp bucket. */
export function formatOptimalRoomTemp(
  entries: Array<
    Pick<SleepEntryWithRelations, 'sleepQuality' | 'environment'>
  >
): string | null {
  const result = optimalRoomTempRange(entries)
  if (result == null) {
    return null
  }
  return `Your optimal room temperature range is ${result.rangeLow}–${result.rangeHigh}°C.`
}

export type SunriseBeforeBedImpact = {
  withSunrise: { avg: number; n: number }
  withoutSunrise: { avg: number; n: number }
}

/**
 * Average sleep quality with vs without sunrise/sunlight before sleep (Step 75).
 * Uses {@link correlateBoolean} on `sunlightSeenBeforeSleep` × `sleepQuality`.
 */
export function sunriseBeforeBedImpact(
  entries: Array<
    Pick<SleepEntryWithRelations, 'sleepQuality' | 'environment'>
  >
): SunriseBeforeBedImpact | null {
  const split = correlateBoolean(
    entries,
    (entry) => entry.environment?.sunlightSeenBeforeSleep ?? null,
    (entry) => entry.sleepQuality
  )

  if (
    split.groupA.n < MIN_CORRELATION_GROUP_N ||
    split.groupB.n < MIN_CORRELATION_GROUP_N ||
    split.groupA.avg == null ||
    split.groupB.avg == null
  ) {
    return null
  }

  return {
    withSunrise: {
      avg: round(split.groupA.avg, 1),
      n: split.groupA.n,
    },
    withoutSunrise: {
      avg: round(split.groupB.avg, 1),
      n: split.groupB.n,
    },
  }
}

/**
 * Spec-style with vs without: e.g. "Average quality with sunrise before sleep: 5.2; without: 8.1."
 */
export function formatSunriseBeforeBedImpact(
  entries: Array<
    Pick<SleepEntryWithRelations, 'sleepQuality' | 'environment'>
  >
): string | null {
  const impact = sunriseBeforeBedImpact(entries)
  if (impact == null) {
    return null
  }
  return `Average quality with sunrise before sleep: ${impact.withSunrise.avg.toFixed(1)}; without: ${impact.withoutSunrise.avg.toFixed(1)}.`
}

/**
 * Declarative correlation factor registry (Step 70).
 * Adding a factor = one entry here; computeCorrelations / cards pick it up automatically.
 */
export type CorrelationFactorDef = {
  key: string
  label: string
  get: (entry: SleepEntryWithRelations) => boolean | null | undefined
}

export const FACTORS: CorrelationFactorDef[] = [
  {
    key: 'phoneUsedBeforeSleep',
    label: 'Phone before sleep',
    get: (e) => e.environment?.phoneUsedBeforeSleep,
  },
  {
    key: 'sunlightSeenBeforeSleep',
    label: 'Sunrise exposure',
    get: (e) => e.environment?.sunlightSeenBeforeSleep,
  },
  {
    key: 'mealBeforeSleep',
    label: 'Ate before sleep',
    get: (e) => e.food?.mealBeforeSleep,
  },
  {
    key: 'isWeekend',
    label: 'Weekend',
    get: (e) => isWeekend(e.date),
  },
]

/**
 * Numeric outcomes each FACTORS entry is compared against (Step 71).
 * Loop is FACTORS × OUTCOMES — not a single metric.
 */
export type CorrelationOutcomeDef = {
  key: string
  label: string
  get: (entry: SleepEntryWithRelations) => number | null
  /** Decimal places when rounding the group mean. */
  digits: number
}

export const OUTCOMES: CorrelationOutcomeDef[] = [
  {
    key: 'latency',
    label: 'latency',
    get: latencyMinutes,
    digits: 1,
  },
  {
    key: 'quality',
    label: 'quality',
    get: (entry) => entry.sleepQuality,
    digits: 2,
  },
  {
    key: 'duration',
    label: 'duration',
    get: sleepDurationMinutes,
    digits: 1,
  },
]

function classifyFactor(
  get: CorrelationFactorDef['get']
): (entry: SleepEntryWithRelations) => boolean | null {
  return (entry) => {
    const value = get(entry)
    if (value == null) return null
    return Boolean(value)
  }
}

/** Minimum samples per side before a correlation card is surfaced (Step 72). */
export const MIN_CORRELATION_GROUP_N = 3

/**
 * FACTORS × OUTCOMES correlation cards (Steps 70–72).
 * Low-confidence rows (either group n &lt; 3) are suppressed.
 * Optional overrides keep unit tests free to inject a 5th factor / outcome.
 */
export function computeCorrelations(
  entries: SleepEntryWithRelations[],
  factors: CorrelationFactorDef[] = FACTORS,
  outcomes: CorrelationOutcomeDef[] = OUTCOMES
): FactorCorrelation[] {
  return factors.flatMap(({ key, label, get }) => {
    const classify = classifyFactor(get)

    return outcomes.flatMap((outcome) => {
      const split = correlateBoolean(entries, classify, outcome.get)

      // Step 72 — don't surface correlations backed by 1–2 points
      if (
        split.groupA.n < MIN_CORRELATION_GROUP_N ||
        split.groupB.n < MIN_CORRELATION_GROUP_N
      ) {
        return []
      }

      const roundAvg = (avg: number | null) =>
        avg == null ? null : round(avg, outcome.digits)

      return [
        {
          factor: key,
          outcome: outcome.key,
          label: `${label} vs ${outcome.label}`,
          groupA: {
            label: 'YES',
            avg: roundAvg(split.groupA.avg),
            n: split.groupA.n,
          },
          groupB: {
            label: 'NO',
            avg: roundAvg(split.groupB.avg),
            n: split.groupB.n,
          },
        },
      ]
    })
  })
}

/** Verb phrase for templates: "on days where you ${label}". */
export function insightActionLabel(factorKey: string): string {
  switch (factorKey) {
    case 'phoneUsedBeforeSleep':
      return 'used your phone before sleep'
    case 'sunlightSeenBeforeSleep':
      return 'had sunrise exposure before sleep'
    case 'mealBeforeSleep':
      return 'ate before sleep'
    case 'isWeekend':
      return 'had a weekend night'
    default: {
      const fromRegistry = FACTORS.find((f) => f.key === factorKey)?.label
      return fromRegistry?.toLowerCase() ?? factorKey
    }
  }
}

/**
 * Map a FactorCorrelation row into an {@link InsightCandidate} for templates.
 * duration → effectMinutes (YES − NO); latency → latencyDiff (YES − NO).
 */
export function toInsightCandidate(
  correlation: FactorCorrelation
): InsightCandidate | null {
  const a = correlation.groupA.avg
  const b = correlation.groupB.avg
  if (a == null || b == null) {
    return null
  }

  const label = insightActionLabel(correlation.factor)
  const diff = Math.round(a - b)

  if (correlation.outcome === 'duration') {
    return { label, effectMinutes: diff }
  }
  if (correlation.outcome === 'latency') {
    return { label, latencyDiff: diff }
  }
  return null
}

/**
 * Natural-language insights from factor correlations via Step 76 templates.
 * Thresholds live in the template library (effectMinutes > 20, latencyDiff > 15).
 */
export function generateInsights(correlations: FactorCorrelation[]): string[] {
  const candidates = correlations
    .map(toInsightCandidate)
    .filter((c): c is InsightCandidate => c != null)
  return generateInsightSentences(candidates)
}

/** Correlation insights + schedule / environment insights (Steps 73–75). */
export function buildInsights(entries: SleepEntryWithRelations[]): string[] {
  const insights = [...generateInsights(computeCorrelations(entries))]
  const shift = formatWeekendBedtimeShift(entries)
  if (shift) insights.push(shift)
  const jetlag = formatWeekendJetlag(entries)
  if (jetlag) insights.push(jetlag)
  const drift = formatCircadianDrift(entries)
  if (drift) insights.push(drift)
  const roomTemp = formatOptimalRoomTemp(entries)
  if (roomTemp) insights.push(roomTemp)
  const sunrise = formatSunriseBeforeBedImpact(entries)
  if (sunrise) insights.push(sunrise)
  return insights
}

function scatterDateKey(entry: SleepEntryWithRelations): string {
  const d = entry.date
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildScatterSeries(
  entries: SleepEntryWithRelations[],
  meta: Omit<ScatterCorrelation, 'points' | 'regression'>,
  getX: (e: SleepEntryWithRelations) => number | null,
  getY: (e: SleepEntryWithRelations) => number | null
): ScatterCorrelation {
  const points: ScatterPoint[] = []
  for (const entry of entries) {
    const x = getX(entry)
    const y = getY(entry)
    if (x == null || y == null || !Number.isFinite(x) || !Number.isFinite(y)) {
      continue
    }
    points.push({ x, y, date: scatterDateKey(entry) })
  }

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  return {
    ...meta,
    points,
    regression: linearRegression(xs, ys),
  }
}

/**
 * Continuous-factor scatters with OLS trend (Step 86).
 * - phone minutes before sleep × latency
 * - caffeine mg × sleep quality
 */
export function buildCorrelationScatters(
  entries: SleepEntryWithRelations[]
): ScatterCorrelation[] {
  return [
    buildScatterSeries(
      entries,
      {
        key: 'phoneMinutesVsLatency',
        label: 'Phone minutes vs latency',
        xLabel: 'Phone minutes before sleep',
        yLabel: 'Latency (min)',
      },
      (e) => e.environment?.minutesPhoneBeforeSleep ?? null,
      (e) => latencyMinutes(e)
    ),
    buildScatterSeries(
      entries,
      {
        key: 'caffeineVsQuality',
        label: 'Caffeine vs quality',
        xLabel: 'Caffeine (mg)',
        yLabel: 'Sleep quality',
      },
      (e) => e.food?.caffeineAmountMg ?? null,
      (e) => e.sleepQuality
    ),
  ]
}

export type SleepEntryReader = {
  findAll: () => Promise<SleepEntryWithRelations[]>
}

/**
 * Service facade used by routes. Depends on a repository interface,
 * not Prisma or Express — swap in a fake reader for unit tests.
 */
export function createAnalyticsService(reader: SleepEntryReader) {
  return {
    computeSummary,
    computeCorrelations,
    generateInsights,
    buildInsights,
    buildCorrelationScatters,
    linearRegression,
    linearRegressionSlope,
    weekendBedtimeShiftHours,
    formatWeekendBedtimeShift,
    weekendJetlagHours,
    detectWeekendJetlag,
    formatWeekendJetlag,
    circadianDriftSlope,
    detectCircadianDrift,
    formatCircadianDrift,
    cumulativeSleepDebt,
    cumulativeSleepDebtSeries,
    longestStreak,
    longestStreakByDate,
    computePersonalRecords,
    computeSmartPatterns,
    optimalRoomTempRange,
    formatOptimalRoomTemp,
    sunriseBeforeBedImpact,
    formatSunriseBeforeBedImpact,

    async getSummary(): Promise<AnalyticsSummary> {
      const entries = await reader.findAll()
      return computeAnalyticsSummary(entries)
    },

    async getStatsSummary(): Promise<StatsSummary> {
      const entries = await reader.findAll()
      return computeSummary(entries)
    },

    async getCorrelations(
      range: AnalyticsDateRange = 'all'
    ): Promise<FactorCorrelation[]> {
      const entries = filterEntriesByAnalyticsRange(
        await reader.findAll(),
        range
      )
      return computeCorrelations(entries)
    },

    /** Step 78 — GET /api/analytics/insights body shape. */
    async getInsights(
      range: AnalyticsDateRange = 'all'
    ): Promise<{ insights: string[] }> {
      const entries = filterEntriesByAnalyticsRange(
        await reader.findAll(),
        range
      )
      return { insights: buildInsights(entries) }
    },

    /** Step 86 — scatter points + OLS regression. */
    async getScatterCorrelations(
      range: AnalyticsDateRange = 'all'
    ): Promise<{ scatters: ScatterCorrelation[] }> {
      const entries = filterEntriesByAnalyticsRange(
        await reader.findAll(),
        range
      )
      return { scatters: buildCorrelationScatters(entries) }
    },

    /** Step 96 — dashboard Patterns Detected payload. */
    async getSmartPatterns(
      range: AnalyticsDateRange = 'all'
    ): Promise<SmartPatternsResult> {
      const entries = filterEntriesByAnalyticsRange(
        await reader.findAll(),
        range
      )
      return computeSmartPatterns(entries)
    },
  }
}
