import { differenceInMinutes } from 'date-fns'
import type {
  AnalyticsSummary,
  CorrelationResult,
  FactorCorrelation,
  SleepEntryWithRelations,
  StatsSummary,
} from '../types'

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

const FACTORS: { factor: string; extract: FactorExtractor }[] = [
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

  const correlations: CorrelationResult[] = FACTORS.flatMap(({ factor, extract }) => {
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

type BinaryFactorDef = {
  factor: string
  labelA: string
  labelB: string
  /** true → groupA, false → groupB, null → skip entry */
  classify: (entry: SleepEntryWithRelations) => boolean | null
}

const BINARY_FACTORS: BinaryFactorDef[] = [
  {
    factor: 'phoneUsedBeforeSleep',
    labelA: 'Phone used before sleep',
    labelB: 'No phone before sleep',
    classify: (entry) => entry.environment?.phoneUsedBeforeSleep ?? null,
  },
  {
    factor: 'sunlightSeenBeforeSleep',
    labelA: 'Saw sunrise / sunlight',
    labelB: 'No sunrise exposure',
    classify: (entry) =>
      entry.environment?.sunlightSeenBeforeSleep ?? null,
  },
  {
    factor: 'mealBeforeSleep',
    labelA: 'Meal before sleep',
    labelB: 'No meal before sleep',
    classify: (entry) => entry.food?.mealBeforeSleep ?? null,
  },
  {
    factor: 'weekdayWeekend',
    labelA: 'Weekend',
    labelB: 'Weekday',
    classify: (entry) => {
      const day = entry.date.getDay() // 0 Sun … 6 Sat
      return day === 0 || day === 6
    },
  },
]

/**
 * Boolean / categorical factor cards: compare avg latency + quality between groups.
 * Averages come from {@link correlateBoolean}; `n` is classified entry count.
 */
export function computeCorrelations(
  entries: SleepEntryWithRelations[]
): FactorCorrelation[] {
  return BINARY_FACTORS.map(({ factor, labelA, labelB, classify }) => {
    const latency = correlateBoolean(entries, classify, latencyMinutes)
    const quality = correlateBoolean(
      entries,
      classify,
      (entry) => entry.sleepQuality
    )
    const nA = entries.filter((e) => classify(e) === true).length
    const nB = entries.filter((e) => classify(e) === false).length

    return {
      factor,
      groupA: {
        label: labelA,
        avgLatency:
          latency.groupA.avg == null ? null : round(latency.groupA.avg, 1),
        avgQuality:
          quality.groupA.avg == null ? null : round(quality.groupA.avg, 2),
        n: nA,
      },
      groupB: {
        label: labelB,
        avgLatency:
          latency.groupB.avg == null ? null : round(latency.groupB.avg, 1),
        avgQuality:
          quality.groupB.avg == null ? null : round(quality.groupB.avg, 2),
        n: nB,
      },
    }
  })
}

const FACTOR_PHRASE: Record<string, string> = {
  phoneUsedBeforeSleep: 'Using phone before sleep',
  sunlightSeenBeforeSleep: 'Seeing sunrise / sunlight before the day',
  mealBeforeSleep: 'Eating a meal before sleep',
  weekdayWeekend: 'Weekend vs weekday nights',
}

/**
 * Natural-language insights from factor correlations.
 * Templated text driven only by computed numbers — never hardcoded facts.
 * Surfaces only gaps where |avgLatency A − B| > 15 minutes.
 */
export function generateInsights(correlations: FactorCorrelation[]): string[] {
  return correlations.flatMap((c) => {
    const a = c.groupA.avgLatency
    const b = c.groupB.avgLatency
    if (a === null || b === null) {
      return []
    }

    const gap = Math.abs(a - b)
    if (gap <= 15) {
      return []
    }

    const roundedGap = Math.round(gap)
    const phrase =
      FACTOR_PHRASE[c.factor] ?? c.groupA.label.replace(/\s+vs\s+.*/i, '')

    const direction =
      a > b
        ? `${c.groupA.label.toLowerCase()} nights averaged ${roundedGap} more minutes to fall asleep than ${c.groupB.label.toLowerCase()} nights`
        : `${c.groupB.label.toLowerCase()} nights averaged ${roundedGap} more minutes to fall asleep than ${c.groupA.label.toLowerCase()} nights`

    // Spec-style template for phone; generic template otherwise
    if (c.factor === 'phoneUsedBeforeSleep') {
      return [
        `Using phone before sleep changed your average latency by ${roundedGap} minutes.`,
      ]
    }

    return [`${phrase} changed your average latency by ${roundedGap} minutes (${direction}).`]
  })
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

    async getSummary(): Promise<AnalyticsSummary> {
      const entries = await reader.findAll()
      return computeAnalyticsSummary(entries)
    },

    async getStatsSummary(): Promise<StatsSummary> {
      const entries = await reader.findAll()
      return computeSummary(entries)
    },

    async getCorrelations(): Promise<FactorCorrelation[]> {
      const entries = await reader.findAll()
      return computeCorrelations(entries)
    },

    async getInsights(): Promise<string[]> {
      const entries = await reader.findAll()
      return generateInsights(computeCorrelations(entries))
    },
  }
}
