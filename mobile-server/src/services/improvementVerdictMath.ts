/**
 * Step 188 — weighted “did they improve” verdict (pure).
 * Consistency proxy: nights within 15 min of scheduled bedtime (no quality log).
 */

export const BEDTIME_ADHERENCE_WINDOW_MIN = 15

export const IMPROVEMENT_WEIGHTS = {
  avgDuration: 0.35,
  bedtimeAdherence: 0.45,
  avgSteps: 0.2,
} as const

export type ImprovementDriverKey =
  | 'avgDuration'
  | 'bedtimeAdherence'
  | 'avgSteps'

export const IMPROVEMENT_DRIVER_LABELS: Record<ImprovementDriverKey, string> = {
  avgDuration: 'avg sleep duration',
  bedtimeAdherence: 'bedtime adherence (±15 min)',
  avgSteps: 'step count',
}

export type ImprovementVerdict = {
  improved: boolean
  score: number
  driver: ImprovementDriverKey | null
  driverLabel: string | null
  /** e.g. Improved — driven by bedtime adherence (±15 min) */
  reason: string
}

const MINUTES_PER_DAY = 24 * 60

/** Smallest circular distance between two clock minutes. */
export function circularMinutesApart(a: number, b: number): number {
  let d = Math.abs(a - b) % MINUTES_PER_DAY
  if (d > MINUTES_PER_DAY / 2) d = MINUTES_PER_DAY - d
  return d
}

export function isNightWithinScheduledBedtime(
  actualBedMinutes: number,
  scheduledBedMinutes: number,
  windowMin = BEDTIME_ADHERENCE_WINDOW_MIN
): boolean {
  if (!Number.isFinite(actualBedMinutes) || !Number.isFinite(scheduledBedMinutes)) {
    return false
  }
  return circularMinutesApart(actualBedMinutes, scheduledBedMinutes) <= windowMin
}

/** Percent of nights on-time (0–100), or null if no nights. */
export function bedtimeAdherencePercent(
  nightsOnTime: number,
  totalNights: number
): number | null {
  if (!Number.isFinite(totalNights) || totalNights <= 0) return null
  const on = Math.max(0, nightsOnTime)
  return Math.round((on / totalNights) * 1000) / 10
}

function voteFromDelta(delta: number | null): -1 | 0 | 1 {
  if (delta == null || !Number.isFinite(delta) || delta === 0) return 0
  return delta > 0 ? 1 : -1
}

/**
 * Weighted score across duration / bedtime-adherence / steps.
 * Driver = metric with the largest |weight × vote| in the winning direction
 * (or overall largest magnitude when not improved).
 */
export function computeImprovementVerdict(input: {
  durationDelta: number | null
  adherenceDelta: number | null
  stepsDelta: number | null
}): ImprovementVerdict {
  const parts: Array<{
    key: ImprovementDriverKey
    vote: -1 | 0 | 1
    weight: number
    contribution: number
  }> = [
    {
      key: 'avgDuration',
      vote: voteFromDelta(input.durationDelta),
      weight: IMPROVEMENT_WEIGHTS.avgDuration,
      contribution: 0,
    },
    {
      key: 'bedtimeAdherence',
      vote: voteFromDelta(input.adherenceDelta),
      weight: IMPROVEMENT_WEIGHTS.bedtimeAdherence,
      contribution: 0,
    },
    {
      key: 'avgSteps',
      vote: voteFromDelta(input.stepsDelta),
      weight: IMPROVEMENT_WEIGHTS.avgSteps,
      contribution: 0,
    },
  ]

  for (const p of parts) {
    p.contribution = p.weight * p.vote
  }

  const score =
    Math.round(parts.reduce((s, p) => s + p.contribution, 0) * 1000) / 1000
  const improved = score > 0

  const candidates = parts.filter((p) => p.vote !== 0)
  let driver: ImprovementDriverKey | null = null
  if (candidates.length > 0) {
    const pool = improved
      ? candidates.filter((p) => p.vote > 0)
      : candidates.filter((p) => p.vote < 0)
    const ranked = (pool.length > 0 ? pool : candidates).sort(
      (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
    )
    driver = ranked[0]?.key ?? null
  }

  const driverLabel = driver ? IMPROVEMENT_DRIVER_LABELS[driver] : null
  const reason = improved
    ? driverLabel
      ? `Improved — driven by ${driverLabel}`
      : 'Improved vs last month'
    : driverLabel
      ? `Not improved — mainly ${driverLabel}`
      : 'No clear improvement vs last month'

  return { improved, score, driver, driverLabel, reason }
}
