/**
 * Step 103 — month-over-month metric compare (mirrors Backend monthlyReport).
 * Higher is better for all report metrics → up + improved = green arrow.
 */

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
export type MetricTone = 'improved' | 'regressed' | 'unchanged' | 'neutral'

export type ComparedMetric = {
  key: string
  label: string
  current: number | null
  previous: number | null
  delta: number | null
  direction: MetricDirection
  tone: MetricTone
}

export type MonthCompareResult = {
  currentMonth: string
  previousMonth: string
  current: MonthlyReportSummary
  previous: MonthlyReportSummary
  metrics: ComparedMetric[]
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

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
  { key: 'avgQuality', label: 'Avg quality', get: (s) => s.avgQuality },
  { key: 'avgDuration', label: 'Avg duration', get: (s) => s.avgDuration },
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

/** Compare two month summaries → up/down + improved/regressed tones. */
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

export function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  if (!y || !m) return month
  return new Date(y, m - 1, 1).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function formatQuality(value: number | null): string {
  if (!isFiniteNumber(value)) return '—'
  return value.toFixed(1)
}

/** Duration minutes → `7h 12m`. */
export function formatDurationMinutes(value: number | null): string {
  if (!isFiniteNumber(value)) return '—'
  const mins = Math.round(value)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

export function formatMetricValue(key: string, value: number | null): string {
  if (key === 'avgDuration') return formatDurationMinutes(value)
  return formatQuality(value)
}

export function formatDelta(key: string, delta: number | null): string {
  if (!isFiniteNumber(delta)) return ''
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  const abs = Math.abs(delta)
  if (key === 'avgDuration') {
    const mins = Math.round(abs)
    if (mins < 60) return `${sign}${mins}m`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m === 0 ? `${sign}${h}h` : `${sign}${h}h ${m}m`
  }
  return `${sign}${abs.toFixed(1)}`
}
