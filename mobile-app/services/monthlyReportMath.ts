/**
 * Step 187 — monthly report compare math (pure).
 * Metrics: avg bedtime, avg duration, consistency, step count.
 */

export type MetricDirection = 'up' | 'down' | 'flat' | 'unknown'
export type MetricTone = 'improved' | 'regressed' | 'unchanged' | 'neutral'

export type MonthlyStatsDTO = {
  month: string
  sessionCount: number
  avgDurationMinutes: number | null
  avgDurationHours: number | null
  avgBedTime: string | null
  avgWakeTime: string | null
  consistencyScore: number
  /** % nights within 15 min of scheduled bedtime (Step 188). */
  bedtimeAdherencePercent?: number | null
  nightsOnSchedule?: number
  avgStepsCount: number | null
}

export type ComparisonDeltasDTO = {
  sessionCount: number | null
  avgDurationMinutes: number | null
  consistencyScore: number | null
  bedtimeAdherencePercent?: number | null
  avgStepsCount: number | null
  avgBedTimeMinutes: number | null
  avgWakeTimeMinutes: number | null
}

export type ImprovementVerdictDTO = {
  improved: boolean
  score: number
  driver: 'avgDuration' | 'bedtimeAdherence' | 'avgSteps' | null
  driverLabel: string | null
  reason: string
}

export type MonthComparisonDTO = {
  thisMonth: MonthlyStatsDTO
  lastMonth: MonthlyStatsDTO
  improved: boolean
  deltas: ComparisonDeltasDTO
  verdict?: ImprovementVerdictDTO
}

export type ReportMetricKey =
  | 'avgBedTime'
  | 'avgDuration'
  | 'consistency'
  | 'avgSteps'

export type ComparedReportMetric = {
  key: ReportMetricKey
  label: string
  currentDisplay: string
  previousDisplay: string
  deltaDisplay: string | null
  direction: MetricDirection
  tone: MetricTone
}

export function formatMonthLabel(monthKey: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey)
  if (!match) return monthKey
  const d = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1))
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function formatDurationMinutes(minutes: number | null): string {
  if (minutes == null || !Number.isFinite(minutes)) return '—'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h <= 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatClockHm(clock: string | null): string {
  if (!clock || !/^\d{1,2}:\d{2}$/.test(clock)) return '—'
  const [hRaw, mRaw] = clock.split(':')
  const h = Number(hRaw)
  const m = Number(mRaw)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '—'
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function formatConsistency(score: number | null | undefined): string {
  if (score == null || !Number.isFinite(score)) return '—'
  return `${Math.round(score)}`
}

export function formatSteps(steps: number | null): string {
  if (steps == null || !Number.isFinite(steps)) return '—'
  return Math.round(steps).toLocaleString()
}

function directionFromDelta(delta: number | null): MetricDirection {
  if (delta == null || !Number.isFinite(delta)) return 'unknown'
  if (delta > 0) return 'up'
  if (delta < 0) return 'down'
  return 'flat'
}

/** Higher value is better → up = improved. */
function toneHigherBetter(direction: MetricDirection): MetricTone {
  if (direction === 'up') return 'improved'
  if (direction === 'down') return 'regressed'
  if (direction === 'flat') return 'unchanged'
  return 'neutral'
}

/**
 * Bedtime: earlier (negative minute delta) counts as improved for sleep hygiene.
 */
function toneBedtime(direction: MetricDirection): MetricTone {
  if (direction === 'down') return 'improved' // earlier
  if (direction === 'up') return 'regressed' // later
  if (direction === 'flat') return 'unchanged'
  return 'neutral'
}

function formatBedDelta(deltaMin: number | null): string | null {
  if (deltaMin == null) return null
  if (deltaMin === 0) return '0m'
  const abs = Math.abs(Math.round(deltaMin))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const mag = h > 0 ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`
  return deltaMin > 0 ? `+${mag} later` : `−${mag} earlier`
}

function formatDurationDelta(deltaMin: number | null): string | null {
  if (deltaMin == null) return null
  if (deltaMin === 0) return '0m'
  const abs = Math.abs(Math.round(deltaMin))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const mag = h > 0 ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`
  return deltaMin > 0 ? `+${mag}` : `−${mag}`
}

function formatPlainDelta(delta: number | null, suffix = ''): string | null {
  if (delta == null) return null
  if (delta === 0) return `0${suffix}`
  const rounded = Math.round(delta * 10) / 10
  const sign = rounded > 0 ? '+' : ''
  return `${sign}${rounded}${suffix}`
}

/**
 * Build the four side-by-side compare rows for the Monthly Report screen.
 */
export function buildReportMetrics(
  comparison: MonthComparisonDTO
): ComparedReportMetric[] {
  const { thisMonth, lastMonth, deltas } = comparison

  const bedDir = directionFromDelta(deltas.avgBedTimeMinutes)
  const durDir = directionFromDelta(deltas.avgDurationMinutes)
  const adherenceDelta =
    deltas.bedtimeAdherencePercent ?? deltas.consistencyScore
  const conDir = directionFromDelta(adherenceDelta)
  const stepDir = directionFromDelta(deltas.avgStepsCount)

  const thisAdherence =
    thisMonth.bedtimeAdherencePercent ?? thisMonth.consistencyScore
  const lastAdherence =
    lastMonth.bedtimeAdherencePercent ?? lastMonth.consistencyScore

  return [
    {
      key: 'avgBedTime',
      label: 'Avg bedtime',
      currentDisplay: formatClockHm(thisMonth.avgBedTime),
      previousDisplay: formatClockHm(lastMonth.avgBedTime),
      deltaDisplay: formatBedDelta(deltas.avgBedTimeMinutes),
      direction: bedDir,
      tone: toneBedtime(bedDir),
    },
    {
      key: 'avgDuration',
      label: 'Avg duration',
      currentDisplay: formatDurationMinutes(thisMonth.avgDurationMinutes),
      previousDisplay: formatDurationMinutes(lastMonth.avgDurationMinutes),
      deltaDisplay: formatDurationDelta(deltas.avgDurationMinutes),
      direction: durDir,
      tone: toneHigherBetter(durDir),
    },
    {
      key: 'consistency',
      label: 'Bedtime adherence',
      currentDisplay:
        thisMonth.bedtimeAdherencePercent != null
          ? `${formatConsistency(thisAdherence)}%`
          : formatConsistency(thisAdherence),
      previousDisplay:
        lastMonth.bedtimeAdherencePercent != null
          ? `${formatConsistency(lastAdherence)}%`
          : formatConsistency(lastAdherence),
      deltaDisplay: formatPlainDelta(adherenceDelta, ' pts'),
      direction: conDir,
      tone: toneHigherBetter(conDir),
    },
    {
      key: 'avgSteps',
      label: 'Step count',
      currentDisplay: formatSteps(thisMonth.avgStepsCount),
      previousDisplay: formatSteps(lastMonth.avgStepsCount),
      deltaDisplay: formatPlainDelta(deltas.avgStepsCount),
      direction: stepDir,
      tone: toneHigherBetter(stepDir),
    },
  ]
}

export function arrowGlyph(tone: MetricTone): string {
  if (tone === 'improved') return '↑'
  if (tone === 'regressed') return '↓'
  return '→'
}
