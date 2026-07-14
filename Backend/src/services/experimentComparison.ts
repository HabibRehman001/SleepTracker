/**
 * Experiment before/after comparison (Steps 98–99).
 *
 * before  = last N nights with date < startDate
 * during  = nights with startDate ≤ date ≤ endDate (endDate null → no upper bound)
 * diff    = mean(during outcomes) − mean(before outcomes)
 * pValue  = Welch two-sample t-test (two-tailed)
 */

import {
  EXPERIMENT_ALPHA,
  welchTTest,
} from '../utils/welchTTest'

export { EXPERIMENT_ALPHA } from '../utils/welchTTest'
export { welchTTest, studentTPvalue } from '../utils/welchTTest'

export const EXPERIMENT_BEFORE_WINDOW_DAYS = 14

export function experimentDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export type ExperimentWindow<T> = {
  before: T[]
  during: T[]
}

export type DatedEntry = { date: Date }

export type ExperimentDates = {
  startDate: Date
  endDate: Date | null
}

/**
 * Split entries into pre-experiment (last `beforeDays`) and during-experiment windows.
 *
 * ```ts
 * const before = entries.filter(e => e.date < start).slice(-14)
 * const during = entries.filter(e => e.date >= start && e.date <= end)
 * ```
 */
export function splitExperimentWindows<T extends DatedEntry>(
  entries: readonly T[],
  experiment: ExperimentDates,
  beforeDays = EXPERIMENT_BEFORE_WINDOW_DAYS
): ExperimentWindow<T> {
  const startKey = experimentDateKey(experiment.startDate)
  const endKey = experiment.endDate
    ? experimentDateKey(experiment.endDate)
    : null

  const sorted = [...entries].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )

  const before = sorted
    .filter((e) => experimentDateKey(e.date) < startKey)
    .slice(-beforeDays)

  const during = sorted.filter((e) => {
    const key = experimentDateKey(e.date)
    if (key < startKey) return false
    if (endKey != null && key > endKey) return false
    return true
  })

  return { before, during }
}

export type ExperimentOutcomeDiff = {
  beforeMean: number
  duringMean: number
  /** duringMean − beforeMean */
  diff: number
  beforeN: number
  duringN: number
  /** Welch two-tailed p-value; null if t-test cannot be computed. */
  pValue: number | null
  /** Welch t statistic (before − during convention of welchTTest). */
  t: number | null
  df: number | null
  /** True when pValue != null and pValue < EXPERIMENT_ALPHA (0.05). */
  significant: boolean
}

/**
 * Generic before/after: `diff = mean(during.map(outcomeFn)) - mean(before.map(outcomeFn))`,
 * plus Welch t-test p-value on the same samples.
 * Returns null when either side has no numeric outcomes.
 */
export function experimentOutcomeDiff<T extends DatedEntry>(
  entries: readonly T[],
  experiment: ExperimentDates,
  outcomeFn: (entry: T) => number | null | undefined,
  beforeDays = EXPERIMENT_BEFORE_WINDOW_DAYS
): ExperimentOutcomeDiff | null {
  const { before, during } = splitExperimentWindows(
    entries,
    experiment,
    beforeDays
  )

  const beforeVals = before.map(outcomeFn).filter(isNumber)
  const duringVals = during.map(outcomeFn).filter(isNumber)
  const beforeMean = mean(beforeVals)
  const duringMean = mean(duringVals)

  if (beforeMean == null || duringMean == null) {
    return null
  }

  const test = welchTTest(beforeVals, duringVals)

  return {
    beforeMean,
    duringMean,
    diff: duringMean - beforeMean,
    beforeN: beforeVals.length,
    duringN: duringVals.length,
    pValue: test?.pValue ?? null,
    t: test?.t ?? null,
    df: test?.df ?? null,
    significant:
      test?.pValue != null && test.pValue < EXPERIMENT_ALPHA,
  }
}

export type ExperimentComparisonMetric = {
  key: string
  label: string
  /** Unit hint for UI (e.g. quality points, minutes, hours). */
  unit: string
  beforeMean: number
  duringMean: number
  diff: number
  beforeN: number
  duringN: number
  pValue: number | null
  t: number | null
  df: number | null
  significant: boolean
}

export type ExperimentComparison = {
  experimentId: string
  beforeDays: number
  beforeCount: number
  duringCount: number
  metrics: ExperimentComparisonMetric[]
}

export type OutcomeMetricSpec<T> = {
  key: string
  label: string
  unit: string
  get: (entry: T) => number | null | undefined
}

/**
 * Run several outcome metrics through the same before/during windows.
 */
export function computeExperimentComparison<T extends DatedEntry>(
  entries: readonly T[],
  experiment: ExperimentDates & { id: string },
  metrics: OutcomeMetricSpec<T>[],
  beforeDays = EXPERIMENT_BEFORE_WINDOW_DAYS
): ExperimentComparison {
  const { before, during } = splitExperimentWindows(
    entries,
    experiment,
    beforeDays
  )

  const results: ExperimentComparisonMetric[] = []
  for (const metric of metrics) {
    const diff = experimentOutcomeDiff(
      entries,
      experiment,
      metric.get,
      beforeDays
    )
    if (diff == null) continue
    results.push({
      key: metric.key,
      label: metric.label,
      unit: metric.unit,
      beforeMean: diff.beforeMean,
      duringMean: diff.duringMean,
      diff: diff.diff,
      beforeN: diff.beforeN,
      duringN: diff.duringN,
      pValue: diff.pValue,
      t: diff.t,
      df: diff.df,
      significant: diff.significant,
    })
  }

  return {
    experimentId: experiment.id,
    beforeDays,
    beforeCount: before.length,
    duringCount: during.length,
    metrics: results,
  }
}
